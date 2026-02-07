"""Shared evaluation metrics for ML models."""
from typing import Dict, Any


def check_quality_gates(metrics: Dict[str, float], thresholds: Dict[str, float]) -> bool:
    """Check if all quality gates pass.

    For metrics with 'rate', 'fpr', 'mae', 'latency' in the name,
    lower is better. For all others, higher is better.
    """
    lower_is_better = {'rate', 'fpr', 'mae', 'latency', 'false_positive'}

    for key, threshold in thresholds.items():
        if key not in metrics:
            return False
        if any(term in key for term in lower_is_better):
            if metrics[key] > threshold:
                return False
        else:
            if metrics[key] < threshold:
                return False
    return True
