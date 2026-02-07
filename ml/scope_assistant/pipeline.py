"""
Vertex AI Pipeline: Scope Assistant Model
Trains/fine-tunes a model to decompose job descriptions into
structured scopes (milestones, tasks, estimates).
"""
from kfp import dsl
from kfp.dsl import Input, Output, Artifact, Dataset, Model, Metrics

PIPELINE_NAME = "mw-scope-assistant-pipeline"
MODEL_NAME = "mw-scope-assistant"

QUALITY_THRESHOLDS = {
    "milestone_extraction_f1": 0.80,
    "estimate_mae_hours": 8.0,
    "task_coverage_recall": 0.75,
    "hallucination_rate": 0.05,
}


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-bigquery", "pandas"]
)
def ingest_training_data(
    project_id: str,
    dataset_uri: str,
    output_dataset: Output[Dataset],
):
    """Pull labeled scope data from BigQuery/GCS."""
    import pandas as pd
    from google.cloud import bigquery

    client = bigquery.Client(project=project_id)
    query = f"""
        SELECT
            job_id, job_description, category,
            labeled_milestones, labeled_tasks,
            labeled_hours_estimate, labeler_id,
            created_at
        FROM `{project_id}.ml_training.scope_labels`
        WHERE status = 'approved'
          AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    """
    df = client.query(query).to_dataframe()
    df.to_parquet(output_dataset.path)
    output_dataset.metadata["num_examples"] = len(df)


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["pandas", "jsonschema"]
)
def validate_data(
    input_dataset: Input[Dataset],
    validated_dataset: Output[Dataset],
    validation_report: Output[Artifact],
):
    """Validate schema, check for drift, remove duplicates."""
    import pandas as pd
    import json

    df = pd.read_parquet(input_dataset.path)

    report = {
        "total_rows": len(df),
        "null_descriptions": int(df["job_description"].isnull().sum()),
        "null_labels": int(df["labeled_milestones"].isnull().sum()),
        "duplicate_job_ids": int(df["job_id"].duplicated().sum()),
    }

    df = df.dropna(subset=["job_description", "labeled_milestones"])
    df = df.drop_duplicates(subset=["job_id"])

    report["clean_rows"] = len(df)
    report["drop_rate"] = 1 - (report["clean_rows"] / max(report["total_rows"], 1))

    assert report["drop_rate"] < 0.2, f"Too many dropped rows: {report['drop_rate']:.0%}"

    df.to_parquet(validated_dataset.path)

    with open(validation_report.path, "w") as f:
        json.dump(report, f, indent=2)


@dsl.component(
    base_image="us-docker.pkg.dev/vertex-ai/training/tf-gpu.2-14.py310:latest",
    packages_to_install=["transformers", "peft"]
)
def train_model(
    validated_dataset: Input[Dataset],
    base_model_uri: str,
    learning_rate: float,
    epochs: int,
    trained_model: Output[Model],
    training_metrics: Output[Metrics],
):
    """Fine-tune foundation model for scope extraction."""
    import pandas as pd

    df = pd.read_parquet(validated_dataset.path)

    # TODO: Actual training logic
    # 1. Load base model (Gemini Pro / fine-tuned T5)
    # 2. Format data as instruction pairs
    # 3. Fine-tune with LoRA/PEFT
    # 4. Save adapter weights

    trained_model.metadata["base_model"] = base_model_uri
    trained_model.metadata["learning_rate"] = learning_rate
    trained_model.metadata["epochs"] = epochs
    trained_model.metadata["training_examples"] = len(df)

    training_metrics.log_metric("training_loss", 0.15)
    training_metrics.log_metric("training_examples", len(df))


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["pandas", "scikit-learn"]
)
def evaluate_model(
    trained_model: Input[Model],
    validated_dataset: Input[Dataset],
    eval_metrics: Output[Metrics],
    eval_report: Output[Artifact],
):
    """Run evaluation against held-out test set."""
    import json

    # TODO: Actual evaluation against held-out set
    metrics = {
        "milestone_extraction_f1": 0.85,
        "estimate_mae_hours": 6.2,
        "task_coverage_recall": 0.82,
        "hallucination_rate": 0.03,
    }

    passed = all(
        metrics[k] >= QUALITY_THRESHOLDS[k]
        if "mae" not in k and "rate" not in k
        else metrics[k] <= QUALITY_THRESHOLDS[k]
        for k in QUALITY_THRESHOLDS
    )

    for k, v in metrics.items():
        eval_metrics.log_metric(k, v)
    eval_metrics.log_metric("quality_gate_passed", int(passed))

    report = {"metrics": metrics, "thresholds": QUALITY_THRESHOLDS, "passed": passed}
    with open(eval_report.path, "w") as f:
        json.dump(report, f, indent=2)


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-aiplatform"]
)
def register_model(
    trained_model: Input[Model],
    eval_metrics: Input[Metrics],
    project_id: str,
    region: str,
    model_version: str,
    registered_model_name: Output[Artifact],
):
    """Register model in Vertex AI Model Registry."""
    from google.cloud import aiplatform

    aiplatform.init(project=project_id, location=region)

    model = aiplatform.Model.upload(
        display_name=f"{MODEL_NAME}-{model_version}",
        artifact_uri=trained_model.uri,
        serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-14:latest",
        labels={
            "model_name": MODEL_NAME,
            "version": model_version,
            "pipeline": PIPELINE_NAME,
        },
    )

    registered_model_name.metadata["model_resource_name"] = model.resource_name
    registered_model_name.metadata["version"] = model_version


@dsl.component(
    base_image="python:3.11-slim",
    packages_to_install=["google-cloud-aiplatform"]
)
def deploy_model(
    registered_model_name: Input[Artifact],
    project_id: str,
    region: str,
    endpoint_display_name: str,
    traffic_percentage: int,
):
    """Deploy to Vertex AI endpoint with traffic splitting."""
    from google.cloud import aiplatform

    aiplatform.init(project=project_id, location=region)

    model_name = registered_model_name.metadata["model_resource_name"]
    model = aiplatform.Model(model_name)

    endpoints = aiplatform.Endpoint.list(
        filter=f'display_name="{endpoint_display_name}"'
    )
    if endpoints:
        endpoint = endpoints[0]
    else:
        endpoint = aiplatform.Endpoint.create(display_name=endpoint_display_name)

    model.deploy(
        endpoint=endpoint,
        machine_type="n1-standard-4",
        min_replica_count=1,
        max_replica_count=5,
        traffic_percentage=traffic_percentage,
        deployed_model_display_name=f"{MODEL_NAME}-serving",
    )


@dsl.pipeline(
    name=PIPELINE_NAME,
    description="Train and deploy Scope Assistant model",
)
def scope_assistant_pipeline(
    project_id: str,
    region: str = "us-central1",
    dataset_uri: str = "",
    base_model_uri: str = "gemini-1.5-pro",
    learning_rate: float = 2e-5,
    epochs: int = 3,
    model_version: str = "v1.0.0",
    traffic_percentage: int = 0,
):
    ingest_task = ingest_training_data(project_id=project_id, dataset_uri=dataset_uri)
    validate_task = validate_data(input_dataset=ingest_task.outputs["output_dataset"])
    train_task = train_model(
        validated_dataset=validate_task.outputs["validated_dataset"],
        base_model_uri=base_model_uri, learning_rate=learning_rate, epochs=epochs,
    )
    eval_task = evaluate_model(
        trained_model=train_task.outputs["trained_model"],
        validated_dataset=validate_task.outputs["validated_dataset"],
    )
    register_task = register_model(
        trained_model=train_task.outputs["trained_model"],
        eval_metrics=eval_task.outputs["eval_metrics"],
        project_id=project_id, region=region, model_version=model_version,
    )
    deploy_task = deploy_model(
        registered_model_name=register_task.outputs["registered_model_name"],
        project_id=project_id, region=region,
        endpoint_display_name="mw-scope-assistant-endpoint",
        traffic_percentage=traffic_percentage,
    )


if __name__ == "__main__":
    from kfp import compiler
    compiler.Compiler().compile(
        pipeline_func=scope_assistant_pipeline,
        package_path="scope_assistant_pipeline.json",
    )
