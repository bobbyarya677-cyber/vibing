"""
VibeShift AI - Instant Persona and Communication Transformer
Core Flask Application and REST API
"""

import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

from ai_service import generate_rewrite, PERSONA_PROMPTS
from word_diff import compute_word_diff
from meaning_guard import analyze_meaning_guard

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

@app.route("/")
def index():
    """Serves the main presentation-ready single page application."""
    return render_template("index.html")

@app.route("/api/status", methods=["GET"])
def api_status():
    """Returns the backend engine status and API connectivity details."""
    has_gemini = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    has_openai = bool(os.environ.get("OPENAI_API_KEY", "").strip())

    engine = "Demo Simulation Mode"
    if has_gemini:
        engine = "Google Gemini 1.5 Flash (Live AI)"
    elif has_openai:
        engine = "OpenAI Model (Live AI)"

    return jsonify({
        "status": "healthy",
        "active_engine": engine,
        "is_live_ai": has_gemini or has_openai,
        "has_gemini_key": has_gemini,
        "has_openai_key": has_openai,
        "api_setup_hint": "To activate live LLM generation, set GEMINI_API_KEY in your .env file. Free tier allows 15 RPM.",
        "personas": list(PERSONA_PROMPTS.keys())
    })

@app.route("/api/rewrite", methods=["POST"])
def api_rewrite():
    """
    Transforms user text into a chosen persona with tone parameters,
    computes word-level diffing, and executes the Meaning Guard fact verification.
    """
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    persona = data.get("persona", "executive")
    tones = data.get("tones") or {"formality": 50, "brevity": 50, "urgency": 50, "empathy": 50}
    length_preset = data.get("length_preset", "balanced")

    if not text:
        return jsonify({
            "error": "Please enter a message, rough draft, or bullet points to transform."
        }), 400

    if persona not in PERSONA_PROMPTS:
        persona = "executive"

    try:
        # 1. Generate Persona Rewriting
        rewrite_result = generate_rewrite(text, persona, tones, length_preset)
        rewritten_text = rewrite_result["rewritten_text"]

        # 2. Compute Word-Level LCS Diff
        diff_result = compute_word_diff(text, rewritten_text)

        # 3. Analyze Meaning Guard (Entity & Fact Preservation)
        meaning_result = analyze_meaning_guard(text, rewritten_text)

        response_payload = {
            "success": True,
            "original_text": text,
            "persona": persona,
            "persona_title": rewrite_result["persona_title"],
            "rewritten_text": rewritten_text,
            "change_summary": rewrite_result["change_summary"],
            "is_demo": rewrite_result["is_demo"],
            "engine_name": rewrite_result["engine_name"],
            "error_note": rewrite_result.get("error_note"),
            "tones": tones,
            "length_preset": length_preset,
            "diff": diff_result,
            "meaning_guard": meaning_result
        }

        return jsonify(response_payload)

    except Exception as e:
        return jsonify({
            "error": f"Failed to rewrite message: {str(e)}"
        }), 500

@app.route("/api/compare", methods=["POST"])
def api_compare():
    """
    Runs all four personas simultaneously on the same draft for side-by-side voice comparison.
    """
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    tones = data.get("tones") or {"formality": 50, "brevity": 50, "urgency": 50, "empathy": 50}
    length_preset = data.get("length_preset", "balanced")

    if not text:
        return jsonify({
            "error": "Please enter a message, rough draft, or bullet points to compare."
        }), 400

    results = []
    for p_key in ["executive", "supportive", "legal", "gen_z"]:
        try:
            res = generate_rewrite(text, p_key, tones, length_preset)
            rew_text = res["rewritten_text"]
            diff = compute_word_diff(text, rew_text)
            guard = analyze_meaning_guard(text, rew_text)
            
            results.append({
                "persona": p_key,
                "persona_title": res["persona_title"],
                "rewritten_text": rew_text,
                "change_summary": res["change_summary"],
                "is_demo": res["is_demo"],
                "engine_name": res["engine_name"],
                "diff": diff,
                "meaning_guard": guard
            })
        except Exception as e:
            results.append({
                "persona": p_key,
                "persona_title": PERSONA_PROMPTS[p_key]["title"],
                "rewritten_text": f"Error generating: {str(e)}",
                "error": True
            })

    return jsonify({
        "success": True,
        "original_text": text,
        "comparisons": results,
        "tones": tones,
        "length_preset": length_preset
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("\n=================================================================")
    print(f"[*] VibeShift AI Server running at: http://127.0.0.1:{port}")
    print("=================================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
