"""
UnifyXAI-Med — Unified Explainability Engine

Combines real SHAP and LIME explanations into a single
doctor-friendly feature ranking.

Input:
    SHAP explanation values
    LIME explanation values

Output:
    Unified ranking
    Agreement Score
    Confidence Score
"""

from math import isfinite


# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------

def round_value(value, digits=4):
    return round(float(value), digits)


# -------------------------------------------------------------------------
# Unified explanation
# -------------------------------------------------------------------------

def unify_explanations(shap_values, lime_values):
    """
    Combine SHAP and LIME explanations feature-by-feature.

    SHAP format expected:

        [
            {
                "feature": "GenHlth",
                "label": "General Health",
                "value": 0.035282
            },
            ...
        ]

    LIME format expected:

        [
            {
                "feature": "GenHlth",
                "label": "General Health",
                "value": 0.1085
            },
            ...
        ]
    """

    if not shap_values:
        raise ValueError("SHAP explanation is empty.")

    if not lime_values:
        raise ValueError("LIME explanation is empty.")

    # ---------------------------------------------------------------------
    # Store SHAP and LIME values by feature
    # ---------------------------------------------------------------------

    features = {}

    for item in shap_values:

        feature = item["feature"]

        features.setdefault(feature, {
            "feature": feature,
            "label": item.get("label", feature)
        })

        features[feature]["shap"] = float(item["value"])

    for item in lime_values:

        feature = item["feature"]

        features.setdefault(feature, {
            "feature": feature,
            "label": item.get("label", feature)
        })

        features[feature]["lime"] = float(item["value"])

    # ---------------------------------------------------------------------
    # Make sure every feature has both explanations
    # ---------------------------------------------------------------------

    incomplete = []

    for feature, item in features.items():

        if "shap" not in item or "lime" not in item:
            incomplete.append(feature)

    if incomplete:
        raise ValueError(
            "Missing SHAP or LIME explanation for: "
            + ", ".join(incomplete)
        )

    # ---------------------------------------------------------------------
    # Calculate unified values
    # ---------------------------------------------------------------------

    ranking = []

    for feature, item in features.items():

        shap_value = item["shap"]
        lime_value = item["lime"]

        # Average SHAP and LIME contribution
        unified_value = (shap_value + lime_value) / 2

        # Direction agreement
        #
        # If either explanation is extremely close to zero,
        # treat it as neutral rather than strong disagreement.
        same_sign = (
            (shap_value >= 0 and lime_value >= 0)
            or
            (shap_value < 0 and lime_value < 0)
            or
            abs(shap_value) < 0.02
            or
            abs(lime_value) < 0.02
        )

        # Difference in contribution magnitude
        magnitude_difference = abs(
            abs(shap_value) - abs(lime_value)
        )

        ranking.append({
            "feature": feature,
            "label": item["label"],
            "shap": round_value(shap_value, 6),
            "lime": round_value(lime_value, 6),
            "unified": round_value(unified_value, 6),
            "sameSign": same_sign,
            "magDiff": round_value(magnitude_difference, 6)
        })

    # ---------------------------------------------------------------------
    # Rank features by unified importance
    # ---------------------------------------------------------------------

    ranking.sort(
        key=lambda item: abs(item["unified"]),
        reverse=True
    )

    for index, item in enumerate(ranking, start=1):
        item["rank"] = index

    # ---------------------------------------------------------------------
    # Agreement Score
    # ---------------------------------------------------------------------

    agreement_components = []

    for item in ranking:

        # Direction agreement
        sign_score = 1.0 if item["sameSign"] else 0.0

        # Magnitude agreement
        #
        # Difference of 0 = perfect agreement.
        # Difference >= 0.5 = zero magnitude agreement.
        magnitude_score = 1.0 - min(
            1.0,
            item["magDiff"] / 0.5
        )

        # Direction is given more importance than magnitude.
        feature_agreement = (
            sign_score * 0.7
            +
            magnitude_score * 0.3
        )

        agreement_components.append(feature_agreement)

    agreement_score = (
        sum(agreement_components)
        / len(agreement_components)
        * 100
    )

    # ---------------------------------------------------------------------
    # Confidence Score
    # ---------------------------------------------------------------------

    squared_differences = []

    for item in ranking:

        difference = item["shap"] - item["lime"]

        squared_differences.append(
            difference ** 2
        )

    variance = (
        sum(squared_differences)
        / len(squared_differences)
    )

    confidence_score = max(
        0.0,
        100.0 - variance * 180.0
    )

    return {
        "ranking": ranking,
        "agreementScore": round_value(
            agreement_score,
            1
        ),
        "confidenceScore": round_value(
            confidence_score,
            1
        )
    }


# -------------------------------------------------------------------------
# Doctor-friendly summary
# -------------------------------------------------------------------------

def build_unified_summary(unified_result):

    ranking = unified_result["ranking"]

    top_features = ranking[:3]

    drivers = []

    for feature in top_features:

        if feature["unified"] >= 0:
            direction = "increases"
        else:
            direction = "decreases"

        drivers.append(
            f'{feature["label"]} '
            f'({direction} diabetes risk, '
            f'impact {feature["unified"]:+.3f})'
        )

    driver_text = ", ".join(drivers)

    agreement = unified_result["agreementScore"]
    confidence = unified_result["confidenceScore"]

    if agreement >= 85:

        agreement_text = (
            "SHAP and LIME strongly agree on the leading "
            "risk drivers."
        )

    elif agreement >= 65:

        agreement_text = (
            "SHAP and LIME largely agree, with some "
            "differences between the methods."
        )

    else:

        agreement_text = (
            "SHAP and LIME show notable disagreement "
            "for some features. The explanation should "
            "therefore be interpreted with additional "
            "clinical judgement."
        )

    return (
        f"The leading factors identified by the unified "
        f"SHAP-LIME explanation are {driver_text}. "
        f"{agreement_text} "
        f"The explanation agreement score is "
        f"{agreement:.1f}%, while the explanation "
        f"confidence score is {confidence:.1f}%."
    )