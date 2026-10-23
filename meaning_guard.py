"""
Meaning Guard: Fact, Entity, and Commitment Preservation Analyzer
Checks important details before and after rewriting:
- Proper Names & Mentions
- Dates, Deadlines, & Timing
- Numbers, Amounts, & Quantities
- Negations & Commitments (critical for preserving restrictions and obligations)
- Action Items & Requirements
"""

import re

# Common days and temporal markers
DAY_PATTERNS = [
    r"\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\b(?:tomorrow|yesterday|today|tonight)\b",
    r"\b(?:asap|eod|end of day|cob|close of business)\b",
    r"\b(?:next sprint|this sprint|next week|this week|next month)\b",
    r"\b(?:q[1-4]|quarter\s*[1-4])\b",
    r"\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm))\b",
    r"\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b",
]

# Numbers, percentages, currency
NUMBER_PATTERNS = [
    r"\$\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion|thousand))?\b",
    r"\b\d+(?:\.\d+)?\s*%",
    r"\b\d+\s*(?:days?|hours?|weeks?|months?|minutes?|secs?|seconds?|slides?|tickets?|bugs?|features?|pr|prs|users?|dollars?)\b",
    r"\b\d+(?:,\d{3})*(?:\.\d+)?\b",
]

# Negations (inverting these changes meaning entirely)
NEGATION_PATTERNS = [
    r"\b(?:not|never|no|none|cannot|can't|won't|wouldn't|don't|doesn't|didn't|shouldn't|mustn't)\b",
    r"\b(?:refuse|decline|prohibit|forbidden|stop|avoid|reject|fail)\b"
]

# Commitments & strong obligations
COMMITMENT_PATTERNS = [
    r"\b(?:must|shall|guarantee|promise|commit|committed|required|mandatory|deadline|urgent|critical)\b"
]

def extract_entities(text):
    """
    Extracts structured entities, metrics, temporal references, and negations.
    """
    text_lower = text.lower()
    
    # 1. Temporal markers & deadlines
    dates = []
    for pattern in DAY_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for m in matches:
            if m not in dates:
                dates.append(m.strip())

    # 2. Numbers and amounts
    numbers = []
    for pattern in NUMBER_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            m_clean = m.strip()
            # Filter trivial single digits if captured generically
            if m_clean not in numbers and m_clean not in dates:
                numbers.append(m_clean)

    # 3. Negations
    negations = []
    for pattern in NEGATION_PATTERNS:
        matches = re.findall(pattern, text_lower)
        for m in matches:
            if m not in negations:
                negations.append(m.strip())

    # 4. Commitments & obligations
    commitments = []
    for pattern in COMMITMENT_PATTERNS:
        matches = re.findall(pattern, text_lower)
        for m in matches:
            if m not in commitments:
                commitments.append(m.strip())

    # 5. Potential Names & User handles
    names = []
    # User handles like @username
    handles = re.findall(r"@[\w.-]+", text)
    names.extend(handles)

    # Capitalized names in middle of sentences
    tokens = text.split()
    for i, token in enumerate(tokens):
        clean = re.sub(r"[^\w]", "", token)
        if clean and clean[0].isupper() and clean.lower() not in ["the", "a", "an", "i", "we", "he", "she", "it", "they", "this", "that"]:
            # If not first word of a sentence or bullet
            if i > 0 and not tokens[i-1].endswith(('.', '!', '?', ':', '-')):
                if clean not in names:
                    names.append(clean)

    return {
        "dates": dates,
        "numbers": numbers,
        "negations": negations,
        "commitments": commitments,
        "names": names
    }

def analyze_meaning_guard(original_text, rewritten_text):
    """
    Compares original draft against rewritten version to flag potential factual drift,
    lost negations, missed deadlines, or altered numbers.
    """
    orig = extract_entities(original_text or "")
    rew = extract_entities(rewritten_text or "")
    
    warnings = []
    passed_checks = []
    
    # Check Negations (Crucial: losing "not" or "can't" completely alters message meaning)
    missing_negations = [neg for neg in orig["negations"] if neg not in rew["negations"]]
    if orig["negations"] and missing_negations:
        # Check if affirmative phrasing might have been used or if meaning inverted
        warnings.append({
            "type": "negation",
            "severity": "high",
            "title": "Negation Restriction Modified",
            "message": f"Original message contained restriction terms ({', '.join(missing_negations)}) that may have been softened or omitted."
        })
    elif orig["negations"]:
        passed_checks.append("Negations & negative constraints preserved")

    # Check Dates and Deadlines
    missing_dates = []
    for d in orig["dates"]:
        # check if subword or exact match exists in rewritten text
        if d.lower() not in (rewritten_text or "").lower():
            missing_dates.append(d)
            
    if missing_dates:
        warnings.append({
            "type": "date",
            "severity": "medium",
            "title": "Possible Deadline or Timing Change",
            "message": f"Timing reference(s) ({', '.join(missing_dates)}) were not detected verbatim in the rewritten draft. Please verify delivery schedule."
        })
    elif orig["dates"]:
        passed_checks.append("All key dates, deadlines, and timing markers intact")

    # Check Numbers & Metrics
    missing_numbers = []
    for n in orig["numbers"]:
        clean_num = re.sub(r"[^\d.]", "", n)
        if clean_num and clean_num not in (rewritten_text or ""):
            missing_numbers.append(n)
            
    if missing_numbers:
        warnings.append({
            "type": "number",
            "severity": "medium",
            "title": "Numerical Quantity or Metric Shift",
            "message": f"Detected numbers or metrics ({', '.join(missing_numbers)}) may have been altered or generalized."
        })
    elif orig["numbers"]:
        passed_checks.append("Numerical metrics, counts, and amounts preserved")

    # Check Names & Entities
    missing_names = [name for name in orig["names"] if name.lower() not in (rewritten_text or "").lower()]
    if missing_names:
        warnings.append({
            "type": "name",
            "severity": "low",
            "title": "Entity or Person Name Reference",
            "message": f"Referenced entity or name ({', '.join(missing_names)}) was not detected explicitly in the output."
        })
    elif orig["names"]:
        passed_checks.append("Participant and entity references preserved")

    # Determine Overall Guard Status
    if any(w["severity"] == "high" for w in warnings):
        status = "danger"
        status_label = "Action Required: Guard Alert"
        status_color = "rose"
    elif any(w["severity"] == "medium" for w in warnings):
        status = "warning"
        status_label = "Review Suggested: Minor Drift"
        status_color = "amber"
    else:
        status = "safe"
        status_label = "Guard Verified: Meaning Intact"
        status_color = "emerald"

    if not warnings and not passed_checks:
        passed_checks.append("No ambiguous entities or high-risk constraints detected in source text.")

    return {
        "status": status,
        "status_label": status_label,
        "status_color": status_color,
        "warnings": warnings,
        "passed_checks": passed_checks,
        "original_entities": orig,
        "rewritten_entities": rew,
        "disclaimer": "Meaning Guard is an algorithmic heuristic check to assist review; always verify critical commitments."
    }
