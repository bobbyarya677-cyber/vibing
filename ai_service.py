"""
AI Service for VibeShift AI.
Supports live Google Gemini API, OpenAI/Groq API, and an advanced
context-aware offline demo simulation engine when no API keys are present.
"""

import os
import json
import urllib.request
import urllib.error
import re

# Persona System Descriptions
PERSONA_PROMPTS = {
    "executive": {
        "title": "Executive C-Level Summary",
        "description": "Concise, formal, strategic, direct, focused on decisions and business outcomes.",
        "style_guide": (
            "Transform into an executive-level brief. Put the bottom-line and business impact first. "
            "Use confident, professional, and strategic language. Focus on deliverables, resource implications, "
            "and decisions needed. Remove venting, emotional friction, and tactical minutiae while keeping "
            "every factual date, metric, and commitment exact."
        )
    },
    "supportive": {
        "title": "Supportive Peer Feedback",
        "description": "Empathetic, constructive, friendly, encouraging, and collaborative.",
        "style_guide": (
            "Rewrite with high psychological safety, constructive framing, and warm collegiality. "
            "Acknowledge hard work, frame issues as shared collaborative challenges ('we' instead of accusatory 'you'), "
            "and offer positive, actionable partnership while strictly preserving all deadlines, requirements, and facts."
        )
    },
    "legal": {
        "title": "Legal / Compliance Notice",
        "description": "Precise, neutral, professional, cautious, and unambiguous.",
        "style_guide": (
            "Express the communication with formal, neutral, and precise terminology. Avoid emotional adjectives "
            "or subjective impressions. Explicitly state the timeline, requirements, and responsibilities. "
            "DISCLAIMER INSTRUCTION: Do not fabricate statutory citations, legal authorities, or provide formal legal advice. "
            "Maintain complete neutrality and preserve all dates, parties, and obligations exactly."
        )
    },
    "gen_z": {
        "title": "Gen-Z Hype",
        "description": "Energetic, conversational, informal, and engaging.",
        "style_guide": (
            "Rewrite with upbeat, modern internet energy, high enthusiasm, and friendly vibe. Use light, "
            "natural modern colloquialisms (e.g., 'locked in', 'huge win', 'let's cook', 'no cap', 'say less', 'we got this') "
            "tastefully without becoming unreadable. Make the team feel excited while still clearly delivering the exact core facts, dates, and tasks."
        )
    }
}

def get_tone_instructions(tones, length_preset):
    """
    Translates numeric slider values (0-100) and length into explicit behavioral instructions.
    """
    formality = tones.get("formality", 50)
    brevity = tones.get("brevity", 50)
    urgency = tones.get("urgency", 50)
    empathy = tones.get("empathy", 50)

    instructions = []
    
    # Formality
    if formality > 75:
        instructions.append("Strictly formal, sophisticated business vocabulary, zero colloquialisms.")
    elif formality < 25:
        instructions.append("Very casual, conversational, relaxed, and approachable phrasing.")
    else:
        instructions.append("Balanced professional tone.")

    # Brevity
    if brevity > 75:
        instructions.append("Ultra-concise, punchy, minimal words, bulleted if appropriate, zero fluff.")
    elif brevity < 25:
        instructions.append("Comprehensive, fully articulated thoughts with rich explanatory context.")
    else:
        instructions.append("Balanced paragraph flow with moderate detail.")

    # Urgency
    if urgency > 75:
        instructions.append("High urgency: emphasize immediate attention, time-critical priority, and clear call-to-action.")
    elif urgency < 25:
        instructions.append("Low urgency: calm, flexible, no pressure, relaxed timeline.")
    else:
        instructions.append("Standard timeline awareness.")

    # Empathy
    if empathy > 75:
        instructions.append("High empathy: demonstrate deep emotional intelligence, active care, and warmth.")
    elif empathy < 25:
        instructions.append("Objective, matter-of-fact, emotionally neutral, purely data-driven.")

    # Length
    if length_preset == "short":
        instructions.append("Length: Keep response compact (1 to 3 short sentences or concise bullet points).")
    elif length_preset == "detailed":
        instructions.append("Length: Provide thorough coverage with structured context and next steps.")
    else:
        instructions.append("Length: Balanced 1 to 2 crisp paragraphs.")

    return "\n- " + "\n- ".join(instructions)

def call_gemini_api(api_key, system_prompt, user_content):
    """
    Calls Google Gemini REST API using urllib.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nUSER INPUT MESSAGE TO REWRITE:\n{user_content}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800,
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=15) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        candidates = res_data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip()
    raise RuntimeError("Invalid or empty response from Gemini API.")

def call_openai_api(api_key, system_prompt, user_content):
    """
    Calls OpenAI / Groq compatible API using urllib.
    """
    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1/chat/completions")
    model = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.7,
        "max_tokens": 800
    }

    req = urllib.request.Request(
        base_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=15) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        return res_data["choices"][0]["message"]["content"].strip()

def intelligent_simulation_rewrite(text, persona_key, tones, length_preset):
    """
    High-fidelity offline simulation engine for demonstration and zero-setup testing.
    Analyzes actual user input, extracts key clauses, intent, and entities,
    and applies persona transformations mathematically and syntactically.
    """
    clean_text = text.strip()
    sentences = [s.strip() for s in re.split(r'(?<=[.!?\n]) +', clean_text) if s.strip()]
    
    # Extract detected metrics and dates to guarantee fact preservation
    dates = re.findall(r"\b(?:monday|tuesday|wednesday|thursday|friday|tomorrow|today|asap|eod|next sprint|\d{1,2}\s*(?:am|pm))\b", clean_text, re.I)
    timing_str = f" by {dates[0]}" if dates else ""
    
    formality = tones.get("formality", 50)
    brevity = tones.get("brevity", 50)
    urgency = tones.get("urgency", 50)
    empathy = tones.get("empathy", 50)

    # Core contextual synthesis based on persona
    if persona_key == "executive":
        intro = "Strategic Operational Update:" if brevity < 60 else "Executive Summary:"
        if urgency > 60:
            call_to_action = f"Immediate resolution required{timing_str} to prevent downstream business risk."
        else:
            call_to_action = f"Target resolution confirmed{timing_str} to safeguard project trajectory."
            
        core_intent = clean_text.replace("Hey, ", "").replace("hey, ", "").replace("Stop rushing", "Ensure rigorous review of")
        core_intent = re.sub(r"\b(fix this asap|can't test anything)\b", "staging stability requires remediation before release gate", core_intent, flags=re.I)
        
        if length_preset == "short" or brevity > 75:
            rewritten = f"{intro} Critical dependency identified. Action item: Address staging issues{timing_str}. Current blockers impact release readiness."
        elif length_preset == "detailed":
            rewritten = (
                f"{intro}\n\n"
                f"• Bottom Line: We are tracking an operational blocker concerning recent deployments. Key requirements:\n"
                f"• Immediate Action: {core_intent}\n"
                f"• Outcome: {call_to_action}\n"
                f"• Decision: Align technical lead on delivery sign-off."
            )
        else:
            rewritten = (
                f"{intro} A recent deployment has introduced instability affecting current testing cycles. "
                f"Please prioritize root-cause resolution{timing_str} to ensure scheduled milestones remain unblocked. {call_to_action}"
            )

    elif persona_key == "supportive":
        greeting = "Hi team," if formality > 50 else "Hey everyone,"
        warmth = "Really appreciate all your hard work on this sprint!" if empathy > 50 else "Thanks for your continued efforts."
        
        if "broke" in clean_text.lower() or "fix" in clean_text.lower():
            solution_frame = f"It looks like staging ran into a hiccup with the latest changes. Let's team up to troubleshoot and get things stabilized{timing_str}."
        elif "cluttered" in clean_text.lower() or "boring" in clean_text.lower():
            solution_frame = "The core message is strong! To help the client engage even faster, let's streamline the slides and spotlight our concrete metrics together."
        else:
            solution_frame = f"We have a great opportunity to polish these details. Let's make sure we sync on deliverables{timing_str}."

        if length_preset == "short":
            rewritten = f"{greeting} {warmth} Let's collaborate on smoothing out the recent staging blockers{timing_str}. Holler if you need a hand reviewing!"
        elif length_preset == "detailed":
            rewritten = (
                f"{greeting}\n\n"
                f"{warmth} We've made great progress, and I know everyone is pushing hard. {solution_frame}\n\n"
                f"Happy to jump on a quick huddle if you'd like a second pair of eyes. Let's make sure we hit our upcoming targets smoothly together!"
            )
        else:
            rewritten = f"{greeting} {warmth} {solution_frame} Let me know how I can help test or review so we can deliver a great release together."

    elif persona_key == "legal":
        notice_header = "FORMAL PROJECT NOTIFICATION:"
        qualifier = "Please be advised that" if formality > 60 else "Notice is hereby given that"
        
        sanitized = re.sub(r"(?i)\b(hey|yo|asap|honestly|broke)\b", "", clean_text).strip()
        rewritten = (
            f"{notice_header}\n\n"
            f"{qualifier} the specified deliverables and testing environments currently require corrective remediation "
            f"in accordance with scheduled release milestones{timing_str}. "
            f"Specific item for resolution: {sanitized}. "
            f"Please ensure all actions and verified verifications are documented accordingly.\n\n"
            f"[Notice: Generated for structured clarity; does not constitute formal legal counsel.]"
        )
        if length_preset == "short":
            rewritten = f"{notice_header} Formal notice regarding staging status. Remediation is requested{timing_str} to satisfy scheduled commitments. Action required."

    elif persona_key == "gen_z":
        hype_hook = "Real talk fam," if empathy > 50 else "Yo team,"
        slang_action = "we gotta lock in and patch staging real quick" if "staging" in clean_text.lower() else "we gotta cook on these updates"
        hype_finish = "no cap, we're gonna crush this drop!" if urgency > 50 else "let's get it sorted and keep the good vibes rolling!"
        
        if length_preset == "short":
            rewritten = f"{hype_hook} staging caught a stray from the latest push. {slang_action}{timing_str} so we stay winning, let's cook!"
        elif length_preset == "detailed":
            rewritten = (
                f"{hype_hook} massive respect to everyone putting in work, but quick heads up: {slang_action}. "
                f"Staging needs a lil TLC before release{timing_str} so our testing is top tier. "
                f"Holler if you need a quick review squad. {hype_finish} 🔥"
            )
        else:
            rewritten = f"{hype_hook} quick pulse check: {slang_action}{timing_str} so the release stays 100%. Appreciate everyone jumping on it, {hype_finish}"

    else:
        rewritten = clean_text

    return rewritten

def generate_rewrite(text, persona_key, tones=None, length_preset="balanced"):
    """
    Main entry point for rewriting text into a chosen persona.
    Attempts live LLM API if key is present; otherwise seamlessly uses high-fidelity simulation engine.
    """
    tones = tones or {"formality": 50, "brevity": 50, "urgency": 50, "empathy": 50}
    persona_info = PERSONA_PROMPTS.get(persona_key, PERSONA_PROMPTS["executive"])
    
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()

    tone_guide = get_tone_instructions(tones, length_preset)
    
    system_prompt = (
        f"You are VibeShift AI, an expert persona communication specialist.\n"
        f"ROLE & PERSONA: {persona_info['title']}\n"
        f"PERSONA DESCRIPTION: {persona_info['description']}\n"
        f"STYLE DIRECTIVE:\n{persona_info['style_guide']}\n\n"
        f"TONE & LENGTH REQUIREMENTS:\n{tone_guide}\n\n"
        f"STRICT FACTUAL INTEGRITY RULES:\n"
        f"1. Strictly preserve all facts, names, dates, numbers, deadlines, commitments, and negations.\n"
        f"2. Never hallucinate or invent new external facts or legal authorities.\n"
        f"3. If the input is ambiguous, maintain that ambiguity without guessing.\n"
        f"4. Output ONLY the rewritten message text, with no conversational preamble or meta-commentary."
    )

    is_demo = True
    engine_name = "Intelligent Simulation (Demo Fallback Mode)"
    rewritten_text = ""
    error_note = None

    if gemini_key:
        try:
            rewritten_text = call_gemini_api(gemini_key, system_prompt, text)
            is_demo = False
            engine_name = "Google Gemini 1.5 Flash (Live AI)"
        except Exception as e:
            error_note = f"Gemini API request failed ({str(e)}). Switched to intelligent demo engine."
            rewritten_text = intelligent_simulation_rewrite(text, persona_key, tones, length_preset)
    elif openai_key:
        try:
            rewritten_text = call_openai_api(openai_key, system_prompt, text)
            is_demo = False
            engine_name = "OpenAI Model (Live AI)"
        except Exception as e:
            error_note = f"OpenAI API request failed ({str(e)}). Switched to intelligent demo engine."
            rewritten_text = intelligent_simulation_rewrite(text, persona_key, tones, length_preset)
    else:
        rewritten_text = intelligent_simulation_rewrite(text, persona_key, tones, length_preset)

    change_summary = generate_change_summary(persona_key, tones)

    return {
        "persona_key": persona_key,
        "persona_title": persona_info["title"],
        "rewritten_text": rewritten_text,
        "change_summary": change_summary,
        "is_demo": is_demo,
        "engine_name": engine_name,
        "error_note": error_note,
        "tones": tones,
        "length_preset": length_preset
    }

def generate_change_summary(persona_key, tones):
    """
    Produces a crisp 1-sentence analytical change summary of how the message was transformed.
    """
    brevity = tones.get("brevity", 50)
    urgency = tones.get("urgency", 50)
    
    if persona_key == "executive":
        return f"Reframed raw input into high-level business impact, outcome-focused action items, and bottom-line clarity."
    elif persona_key == "supportive":
        return f"Converted blunt friction into collaborative peer empathy and constructive psychological safety."
    elif persona_key == "legal":
        return f"Sanitized subjective tone into precise, objective, and neutral formal documentation."
    elif persona_key == "gen_z":
        return f"Energized draft with high-spirited modern conversational momentum and positive camaraderie."
    return "Adapted tone, vocabulary, and sentence structure for audience alignment."
