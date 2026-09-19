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

def get_direction(value, threshold=0.02):
    """
    Classify an explanation value as positive, negative, or neutral.

    Values close to zero are treated as neutral because their
    directional contribution is small.
    """

    if abs(value) < threshold:
        return "neutral"

    if value > 0:
        return "positive"

    return "negative"

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

        shap_direction = get_direction(shap_value)
        lime_direction = get_direction(lime_value)

        if shap_direction == "neutral" or lime_direction == "neutral":
            direction_match = "neutral"
        else:
            direction_match = (
                "agree"
                if shap_direction == lime_direction
                else "diverge"
            )

        same_sign = direction_match == "agree"

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

            "shapDirection": shap_direction,
            "limeDirection": lime_direction,
            "directionMatch": direction_match,

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
        if item["directionMatch"] == "agree":
            sign_score = 1.0
        elif item["directionMatch"] == "neutral":
            sign_score = 0.5
        else:
            sign_score = 0.0

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

    consistency_score  = max(
        0.0,
        100.0 - variance * 180.0
    )

    return {
        "ranking": ranking,
        "agreementScore": round_value(
            agreement_score,
            1
        ),
        "consistencyScore ": round_value(
            consistency_score ,
            1
        )
    }


# -------------------------------------------------------------------------
# Doctor-friendly summary
# -------------------------------------------------------------------------

def build_unified_summary(result, unified):
    ranking = unified.get("ranking", [])

    if not ranking:
        return (
            f"The model classifies this patient as {result['prediction'].lower()} "
            f"with a predicted probability of {result['probability'] * 100:.1f}%."
        )

    # Top 3 unified contributors
    top_features = ranking[:3]

    top_text = ", ".join(
        f"{item['label']} "
        f"({'contributed toward a higher' if item['unified'] > 0 else 'contributed toward a lower'} "
        f"model-estimated diabetes probability)"
        for item in top_features
        if item["unified"] != 0
    )

    # Count meaningful directional disagreements
    directional_disagreements = [
        item
        for item in ranking
        if item["directionMatch"] == "diverge"
    ]

    disagreement_count = len(directional_disagreements)

    # Explanation agreement statement
    if disagreement_count == 0:
        agreement_text = (
            "SHAP and LIME show consistent directional agreement across "
            "the evaluated features."
        )
    elif disagreement_count <= 2:
        agreement_text = (
            f"SHAP and LIME agree on the main contributing factors, "
            f"although {disagreement_count} features show a meaningful "
            f"directional difference between the two explainers."
        )
    else:
        agreement_text = (
            f"SHAP and LIME agree on several leading factors, but "
            f"{disagreement_count} features show meaningful directional "
            f"differences between the two explainers."
        )

    return (
        f"The model classifies this patient as {result['prediction'].lower()} "
        f"with a predicted probability of {result['probability'] * 100:.1f}%. "
        f"The leading contributing factors are {top_text}. "
        f"{agreement_text} "
        f"The explanation agreement score is {unified['agreementScore']:.1f}/100 "
        f"and cross-method consistency is {unified['consistencyScore']:.1f}/100."
    )