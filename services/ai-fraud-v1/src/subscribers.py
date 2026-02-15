"""
Pub/Sub event handlers for ai-fraud-v1.

Handles:
  - user-registered → creates fraud baseline for new accounts
"""

import structlog

logger = structlog.get_logger()


async def handle_user_registered(data: dict) -> None:
    """
    Async handler for UserRegistered events.
    Creates an initial fraud baseline for the new account.
    """
    user_id = data.get("user_id")
    email = data.get("email", "")
    role = data.get("role", "unknown")

    if not user_id:
        logger.warning("missing_user_id_in_event", data=data)
        return

    logger.info("fraud_baseline_start", user_id=user_id, role=role)

    # ── Rule-based baseline scoring ──────────────────────────────────
    score = 0.0
    risk_factors = []

    # 1. Email domain reputation (simple heuristic)
    domain = email.split("@")[-1].lower() if "@" in email else ""
    disposable_domains = {
        "tempmail.com", "throwaway.email", "guerrillamail.com",
        "mailinator.com", "yopmail.com", "10minutemail.com",
        "trashmail.com", "sharklasers.com", "guerrillamailblock.com",
    }
    if domain in disposable_domains:
        score += 0.4
        risk_factors.append({
            "factor": "disposable_email",
            "contribution": 0.4,
            "description": f"Email uses disposable domain: {domain}",
        })

    # 2. Email pattern (numeric-heavy = suspicious)
    local_part = email.split("@")[0] if "@" in email else ""
    digit_ratio = sum(c.isdigit() for c in local_part) / max(len(local_part), 1)
    if digit_ratio > 0.6 and len(local_part) > 5:
        score += 0.15
        risk_factors.append({
            "factor": "numeric_email",
            "contribution": 0.15,
            "description": f"Email local part is {digit_ratio:.0%} digits",
        })

    score = min(score, 1.0)
    risk_tier = "high" if score > 0.5 else ("medium" if score > 0.3 else "low")

    # ── Callback to PHP API ──────────────────────────────────────────
    try:
        from shared.callback import api_callback

        await api_callback.post("/fraud/baseline", {
            "user_id": user_id,
            "fraud_score": round(score, 4),
            "risk_tier": risk_tier,
            "risk_factors": risk_factors,
            "model_name": "fraud-baseline",
            "model_version": "v1.0.0",
            "input_data": {"email": email, "role": role},
        })

        logger.info(
            "fraud_baseline_complete",
            user_id=user_id,
            score=score,
            risk_tier=risk_tier,
        )
    except Exception:
        logger.exception("fraud_baseline_callback_failed", user_id=user_id)
