# ⚡ VibeShift AI
> **Instant Persona and Communication Transformer**  
> *"One rough draft, many voices: rewrite any message for the audience that will read it."*

🏆 **College Vibeathon 2026 Presentation-Ready Project**

---

## 📖 Executive Summary
In fast-paced modern teams, communication breakdown occurs when raw, blunt drafts, hasty bullet points, or emotional venting are sent directly to sensitive or high-stakes audiences. 

**VibeShift AI** bridges this gap by transforming unrefined drafts into four precisely calibrated communication styles:
1. **Executive C-Level Summary**: Concise, formal, strategic, direct, focused on decisions and bottom-line outcomes.
2. **Supportive Peer Feedback**: Empathetic, constructive, friendly, encouraging, collaborative, psychological safety.
3. **Legal/Compliance Notice**: Precise, neutral, professional, cautious, and unambiguous (strictly without inventing legal advice).
4. **Gen-Z Hype**: Energetic, conversational, informal, engaging, with tasteful modern camaraderie.

Beyond basic text rewriting, VibeShift AI provides two critical safety engines:
- 🔍 **Real Word-Level LCS Diff Inspector**: Visualizes exactly which words were removed (red strikethrough) and added (green highlight), along with delta counts and similarity scores.
- 🛡️ **Meaning Guard Fact & Commitment Shield**: A heuristic preservation engine that guarantees key dates, deadlines, metrics, numbers, and negations (such as *cannot*, *not*, *must*) are preserved without hallucinatory distortion.

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| **Interactive SaaS Interface** | Crisp white & light-gray aesthetic, navy typography, electric blue & cyan accents, subtle micro-animations. |
| **4 Strategic Personas** | Executive C-Level, Supportive Peer, Legal/Compliance, Gen-Z Hype. |
| **Multi-Voice Comparison** | One-click **"Compare All 4 Voices"** runs all personas simultaneously on the same draft. |
| **Custom Tone Sliders** | Real-time 0–100 sliders for Formality, Brevity, Urgency, and Empathy, plus Short/Balanced/Detailed presets. |
| **Dual AI Execution Engine** | Seamless live Google Gemini 1.5 Flash / OpenAI support + offline context-aware intelligent simulation mode. |
| **Word-Level Token Diffing** | Computes Longest Common Subsequence (LCS) to highlight deleted and added words side-by-side or inline. |
| **Meaning Guard** | Inspects original vs rewritten text for entities, dates, metrics, negations, and commitments. |
| **Action & Export Suite** | 1-Click Copy, Inline Edit, Email-Ready format, Slack-Ready format, Plain Text (`.txt`) and Markdown (`.md`) download. |
| **Local History Drawer** | Persists recent drafts in `localStorage` with 1-click restore and clear controls. |

---

## 🏗️ Project Architecture & File Structure

```
vibeshift-ai/
├── app.py                      # Production Flask backend & REST API endpoints
├── ai_service.py               # Google Gemini REST API, OpenAI integration & simulation engine
├── meaning_guard.py            # Meaning Guard fact, negation & commitment analyzer
├── word_diff.py                # Server-side LCS token diff & similarity scoring
├── requirements.txt            # Python dependencies (flask, flask-cors, python-dotenv)
├── .env.example                # Template for API keys
├── .env                        # Local environment file
├── static/
│   ├── css/
│   │   └── custom.css          # Modern typography, diff token styling & micro-animations
│   ├── js/
│   │   ├── diff_engine.js      # Client-side LCS diff visualizer (instant inline edits)
│   │   ├── meaning_guard.js    # Client-side fact shield inspector
│   │   └── app.js              # Reactive Single Page Application controller
│   └── favicon.svg             # Modern geometric gradient logo
├── templates/
│   └── index.html              # Presentation-ready single-page web app
└── README.md                   # Full documentation & Vibeathon pitch
```

---

## 🚀 Quickstart Guide

### 1. Requirements
- Python 3.10+ (Tested on Python 3.14)
- Web browser (Chrome, Edge, Firefox, Safari)

### 2. Installation
Open your terminal or PowerShell in the project directory:

```bash
cd C:\Users\ASUS\.gemini\antigravity\scratch\vibeshift-ai
python -m pip install -r requirements.txt
```

### 3. Launch the Server
```bash
python app.py
```

The application will start immediately at:
👉 **`http://127.0.0.1:5000`**

Open this URL in your browser to view the presentation-ready web app!

---

## 🔑 AI Engine Configuration (Live vs Demo Mode)

### A. Demo Mode (Zero Setup Required)
Out-of-the-box, **VibeShift AI** runs in **Intelligent Simulation Mode**. It does *not* display static placeholder responses; instead, it dynamically parses your actual input, applies tone sliders, and transforms the message using rule-based contextual synthesis. This guarantees a smooth demo even without an internet connection or API keys!

### B. Live Google Gemini 1.5 Flash (Free Tier)
To connect real-time Gemini LLM intelligence:
1. Visit [Google AI Studio](https://aistudio.google.com/) and create a free API key.
2. Open `.env` in the project directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```
3. Restart `python app.py`. The top navigation pill will automatically light up green: **"Google Gemini 1.5 Flash (Live AI)"**.
*(Google Gemini free tier provides 15 Requests Per Minute at no cost).*

---

## 🧪 Testing the 3 Built-in Scenarios

To demonstrate the power of VibeShift AI to judges, click any of the 3 quick-start sample buttons in the editor:

1. **🚨 Blunt Slack Vent**:
   > *"Hey, your code broke staging again. Fix this ASAP, I can't test anything and the release is tomorrow. Stop rushing PRs."*
   - **Executive**: Bottom-line blocker summary with release timeline risk.
   - **Supportive**: Empathetic troubleshooting offer with shared team ownership.
   - **Legal**: Objective notice documenting environment status and release milestone criteria.
   - **Gen-Z**: Upbeat, high-spirited rally to patch staging and keep momentum high.

2. **📝 Messy Meeting Bullets**:
   > *"talked to clients. they want dashboard exports in pdf by friday. also pricing page is confusing users. need dev estimate. john said 2 days maybe. push to next sprint if tight."*

3. **🎯 Harsh Feedback Draft**:
   > *"This presentation deck is too cluttered and honestly boring. The client will tune out by slide 3. Cut half the bullet points and add real metrics instead of vague promises."*

---

## 🛡️ Meaning Guard & Word-Diff Verification

- **Word-Level Diff**: Tokenizes words and punctuation while preserving layout whitespace. Red highlights with strikethroughs denote words removed from the draft; green highlights show terms introduced in the rewrite.
- **Meaning Guard**: Evaluates:
  - **Negations** (*not, never, cannot, won't, refuse*) — Prevents accidental reversal of restrictions.
  - **Deadlines** (*Friday, tomorrow, ASAP, Q3, 5 PM*) — Verifies schedule accuracy.
  - **Numbers** (*$5,000, 42%, 2 days, 3 slides*) — Flags altered quantities.
  - **Names** (*John, Sarah, @leads*) — Ensures accountability.
- **Disclaimer**: *Meaning Guard is an algorithmic heuristic check to assist review; always verify critical commitments.*

---

## 🎓 Vibeathon Pitch Points
When presenting to the judges:
1. **The Real-World Problem**: Communication friction costs modern tech teams thousands of hours. Blunt messages damage morale; wordy messages get ignored by executives.
2. **The Innovation**: VibeShift AI doesn't just rewrite text — it gives the user **transparency** (Word-Level Diff) and **safety** (Meaning Guard).
3. **The User Experience**: Instant sliders, dual comparison mode, inline editing, and one-click export to Slack and Email.
