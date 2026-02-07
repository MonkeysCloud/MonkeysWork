from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/fraud")


class FraudCheckRequest(BaseModel):
    account_id: str
    entity_type: str = "proposal"
    entity_id: Optional[str] = None


class RiskFactor(BaseModel):
    factor: str
    contribution: float
    description: str


class FraudResponse(BaseModel):
    account_id: str
    fraud_score: float
    risk_tier: str
    recommended_action: str
    top_risk_factors: List[RiskFactor]
    model_version: str
    enforcement_mode: str


@router.post("/check", response_model=FraudResponse)
async def check_fraud(request: FraudCheckRequest):
    # TODO: Feature computation + model inference
    # TODO: Apply enforcement mode
    # TODO: Log audit decision
    return FraudResponse(
        account_id=request.account_id,
        fraud_score=0.0,
        risk_tier="low",
        recommended_action="allow",
        top_risk_factors=[],
        model_version="v0.0.0-placeholder",
        enforcement_mode="shadow",
    )
