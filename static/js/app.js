/**
 * VibeShift AI - Main Application Controller
 * Handles user interactions, API communications, state persistence,
 * word-level diffing, and Meaning Guard analytics.
 */

document.addEventListener("DOMContentLoaded", function () {
  // App State
  const state = {
    originalDraft: "",
    selectedPersona: "executive",
    tones: {
      formality: 50,
      brevity: 50,
      urgency: 50,
      empathy: 50
    },
    lengthPreset: "balanced",
    diffViewMode: "side-by-side", // "side-by-side" or "unified"
    currentResult: null,
    isGenerating: false,
    isComparingAll: false,
    compareResults: [],
    isEditingInline: false,
    history: []
  };

  // Sample Messages
  const SAMPLES = {
    slack: "Hey, your code broke staging again. Fix this ASAP, I can't test anything and the release is tomorrow. Stop rushing PRs.",
    notes: "talked to clients. they want dashboard exports in pdf by friday. also pricing page is confusing users. need dev estimate. john said 2 days maybe. push to next sprint if tight.",
    feedback: "This presentation deck is too cluttered and honestly boring. The client will tune out by slide 3. Cut half the bullet points and add real metrics instead of vague promises."
  };

  // DOM Elements
  const draftInput = document.getElementById("draftInput");
  const charCount = document.getElementById("charCount");
  const wordCount = document.getElementById("wordCount");
  const clearDraftBtn = document.getElementById("clearDraftBtn");
  const transformBtn = document.getElementById("transformBtn");
  const compareAllBtn = document.getElementById("compareAllBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");

  // Persona Cards
  const personaCards = document.querySelectorAll(".persona-card");

  // Tone Sliders & Badges
  const sliderFormality = document.getElementById("sliderFormality");
  const badgeFormality = document.getElementById("badgeFormality");
  const sliderBrevity = document.getElementById("sliderBrevity");
  const badgeBrevity = document.getElementById("badgeBrevity");
  const sliderUrgency = document.getElementById("sliderUrgency");
  const badgeUrgency = document.getElementById("badgeUrgency");
  const sliderEmpathy = document.getElementById("sliderEmpathy");
  const badgeEmpathy = document.getElementById("badgeEmpathy");

  // Length buttons
  const lengthButtons = document.querySelectorAll(".length-btn");

  // Result Area
  const emptyStateCard = document.getElementById("emptyStateCard");
  const singleResultCard = document.getElementById("singleResultCard");
  const multiCompareGrid = document.getElementById("multiCompareGrid");

  // Single Result Elements
  const resultPersonaBadge = document.getElementById("resultPersonaBadge");
  const resultEngineBadge = document.getElementById("resultEngineBadge");
  const resultChangeSummary = document.getElementById("resultChangeSummary");
  const resultTextContent = document.getElementById("resultTextContent");
  const resultTextEditor = document.getElementById("resultTextEditor");
  const resultTextarea = document.getElementById("resultTextarea");
  const saveInlineEditBtn = document.getElementById("saveInlineEditBtn");
  const cancelInlineEditBtn = document.getElementById("cancelInlineEditBtn");

  // Action Buttons
  const copyBtn = document.getElementById("copyBtn");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const copySlackBtn = document.getElementById("copySlackBtn");
  const editInlineBtn = document.getElementById("editInlineBtn");
  const regenerateBtn = document.getElementById("regenerateBtn");
  const clearResultBtn = document.getElementById("clearResultBtn");
  const exportTxtBtn = document.getElementById("exportTxtBtn");
  const exportMdBtn = document.getElementById("exportMdBtn");

  // Diff Elements
  const btnSideBySide = document.getElementById("btnSideBySide");
  const btnUnified = document.getElementById("btnUnified");
  const sideBySideContainer = document.getElementById("sideBySideContainer");
  const unifiedContainer = document.getElementById("unifiedContainer");
  const origWordStat = document.getElementById("origWordStat");
  const rewWordStat = document.getElementById("rewWordStat");
  const deltaWordStat = document.getElementById("deltaWordStat");
  const similarityStat = document.getElementById("similarityStat");
  const diffColOriginal = document.getElementById("diffColOriginal");
  const diffColRewritten = document.getElementById("diffColRewritten");
  const unifiedDiffOutput = document.getElementById("unifiedDiffOutput");

  // Meaning Guard Elements
  const guardStatusBanner = document.getElementById("guardStatusBanner");
  const guardStatusIcon = document.getElementById("guardStatusIcon");
  const guardStatusLabel = document.getElementById("guardStatusLabel");
  const guardWarningsContainer = document.getElementById("guardWarningsContainer");
  const origEntitiesChips = document.getElementById("origEntitiesChips");
  const rewEntitiesChips = document.getElementById("rewEntitiesChips");

  // History Drawer Elements
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const historyCountBadge = document.getElementById("historyCountBadge");

  // System Status Elements
  const systemStatusPill = document.getElementById("systemStatusPill");
  const apiStatusText = document.getElementById("apiStatusText");

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    loadLocalHistory();
    fetchBackendStatus();
    attachEventListeners();
    updateTextStats();
    updateToneBadges();
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  function attachEventListeners() {
    // Draft textarea
    draftInput.addEventListener("input", function () {
      state.originalDraft = draftInput.value;
      updateTextStats();
    });

    // Clear draft button
    clearDraftBtn.addEventListener("click", function () {
      draftInput.value = "";
      state.originalDraft = "";
      updateTextStats();
      showToast("Draft cleared.");
    });

    // Sample buttons
    document.querySelectorAll(".sample-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const sampleKey = this.dataset.sample;
        if (SAMPLES[sampleKey]) {
          draftInput.value = SAMPLES[sampleKey];
          state.originalDraft = SAMPLES[sampleKey];
          updateTextStats();
          showToast(`Loaded sample: ${btn.textContent.trim()}`);
        }
      });
    });

    // Persona selection
    personaCards.forEach((card) => {
      card.addEventListener("click", function () {
        const persona = this.dataset.persona;
        selectPersona(persona);
      });
    });

    // Tone sliders
    sliderFormality.addEventListener("input", function () {
      state.tones.formality = parseInt(this.value, 10);
      updateToneBadges();
    });
    sliderBrevity.addEventListener("input", function () {
      state.tones.brevity = parseInt(this.value, 10);
      updateToneBadges();
    });
    sliderUrgency.addEventListener("input", function () {
      state.tones.urgency = parseInt(this.value, 10);
      updateToneBadges();
    });
    sliderEmpathy.addEventListener("input", function () {
      state.tones.empathy = parseInt(this.value, 10);
      updateToneBadges();
    });

    // Length preset buttons
    lengthButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        lengthButtons.forEach((b) => b.classList.remove("active", "bg-blue-600", "text-white"));
        this.classList.add("active", "bg-blue-600", "text-white");
        this.classList.remove("bg-slate-100", "text-slate-700");
        state.lengthPreset = this.dataset.length;
      });
    });

    // Main Actions
    transformBtn.addEventListener("click", executeSingleRewrite);
    compareAllBtn.addEventListener("click", executeCompareAll);

    // Keyboard shortcut (Ctrl + Enter)
    draftInput.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        executeSingleRewrite();
      }
    });

    // Diff view switcher
    btnSideBySide.addEventListener("click", function () {
      switchDiffView("side-by-side");
    });
    btnUnified.addEventListener("click", function () {
      switchDiffView("unified");
    });

    // Result Actions
    copyBtn.addEventListener("click", copyOutputText);
    copyEmailBtn.addEventListener("click", copyEmailFormat);
    copySlackBtn.addEventListener("click", copySlackFormat);
    editInlineBtn.addEventListener("click", toggleInlineEdit);
    saveInlineEditBtn.addEventListener("click", saveInlineEdit);
    cancelInlineEditBtn.addEventListener("click", cancelInlineEdit);
    regenerateBtn.addEventListener("click", executeSingleRewrite);
    clearResultBtn.addEventListener("click", resetResults);
    exportTxtBtn.addEventListener("click", exportAsPlainText);
    exportMdBtn.addEventListener("click", exportAsMarkdown);

    // History controls
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", clearLocalHistory);
    }
  }

  // ==========================================
  // PERSONA SELECTION
  // ==========================================
  function selectPersona(persona) {
    state.selectedPersona = persona;
    personaCards.forEach((card) => {
      if (card.dataset.persona === persona) {
        card.classList.add("border-blue-600", "ring-2", "ring-blue-500/20", "bg-blue-50/40");
        card.classList.remove("border-slate-200");
      } else {
        card.classList.remove("border-blue-600", "ring-2", "ring-blue-500/20", "bg-blue-50/40");
        card.classList.add("border-slate-200");
      }
    });

    // Optional tone preset suggestions based on persona
    if (persona === "executive") {
      setSliderValues(80, 75, 60, 40);
    } else if (persona === "supportive") {
      setSliderValues(45, 45, 30, 90);
    } else if (persona === "legal") {
      setSliderValues(95, 60, 70, 20);
    } else if (persona === "gen_z") {
      setSliderValues(10, 65, 80, 85);
    }
  }

  function setSliderValues(f, b, u, e) {
    sliderFormality.value = f;
    state.tones.formality = f;
    sliderBrevity.value = b;
    state.tones.brevity = b;
    sliderUrgency.value = u;
    state.tones.urgency = u;
    sliderEmpathy.value = e;
    state.tones.empathy = e;
    updateToneBadges();
  }

  function updateToneBadges() {
    badgeFormality.textContent = `${state.tones.formality}%`;
    badgeBrevity.textContent = `${state.tones.brevity}%`;
    badgeUrgency.textContent = `${state.tones.urgency}%`;
    badgeEmpathy.textContent = `${state.tones.empathy}%`;
  }

  function updateTextStats() {
    const text = draftInput.value;
    charCount.textContent = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCount.textContent = words;
  }

  // ==========================================
  // BACKEND API STATUS
  // ==========================================
  async function fetchBackendStatus() {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        if (data.is_live_ai) {
          systemStatusPill.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200";
          apiStatusText.textContent = data.active_engine;
        } else {
          systemStatusPill.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200";
          apiStatusText.textContent = "Simulation Demo Mode (Instant)";
        }
      }
    } catch (err) {
      console.warn("Could not fetch API status, using offline demo defaults.", err);
    }
  }

  // ==========================================
  // SINGLE PERSONA REWRITE
  // ==========================================
  async function executeSingleRewrite() {
    const draft = draftInput.value.trim();
    if (!draft) {
      showToast("Please enter or paste a message to transform.", "error");
      draftInput.focus();
      return;
    }

    setGeneratingState(true);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: draft,
          persona: state.selectedPersona,
          tones: state.tones,
          length_preset: state.lengthPreset
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      state.currentResult = data;
      renderSingleResult(data);
      saveToHistory(data);
      showToast("Message transformed successfully!");

      // Scroll to results on mobile devices
      if (window.innerWidth < 1024) {
        singleResultCard.scrollIntoView({ behavior: "smooth" });
      }

    } catch (err) {
      console.error("Rewrite error:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setGeneratingState(false);
    }
  }

  // ==========================================
  // COMPARE ALL 4 VOICES
  // ==========================================
  async function executeCompareAll() {
    const draft = draftInput.value.trim();
    if (!draft) {
      showToast("Please enter or paste a message to compare.", "error");
      draftInput.focus();
      return;
    }

    setGeneratingState(true);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: draft,
          tones: state.tones,
          length_preset: state.lengthPreset
        })
      });

      if (!response.ok) {
        throw new Error(`Comparison failed: ${response.status}`);
      }

      const data = await response.json();
      state.compareResults = data.comparisons;
      renderCompareAllResults(data.comparisons);
      showToast("All 4 personas generated side-by-side!");

      multiCompareGrid.scrollIntoView({ behavior: "smooth" });

    } catch (err) {
      console.error("Compare error:", err);
      showToast(`Comparison error: ${err.message}`, "error");
    } finally {
      setGeneratingState(false);
    }
  }

  // ==========================================
  // RENDER SINGLE RESULT
  // ==========================================
  function renderSingleResult(data) {
    emptyStateCard.classList.add("hidden");
    multiCompareGrid.classList.add("hidden");
    singleResultCard.classList.remove("hidden");

    // Header info
    resultPersonaBadge.textContent = data.persona_title || data.persona;
    resultEngineBadge.textContent = data.is_demo ? "Demo Engine" : "Live AI";
    resultEngineBadge.className = data.is_demo
      ? "text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800"
      : "text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800";

    resultChangeSummary.textContent = data.change_summary;
    resultTextContent.textContent = data.rewritten_text;

    // Reset inline edit mode if active
    exitInlineEditMode();

    // Word Diff Rendering
    renderDiffStats(data.diff);
    renderDiffViews(data.diff);

    // Meaning Guard Rendering
    renderMeaningGuard(data.meaning_guard);
  }

  // ==========================================
  // RENDER DIFF VIEWS
  // ==========================================
  function renderDiffStats(diff) {
    if (!diff) return;
    origWordStat.textContent = diff.orig_word_count;
    rewWordStat.textContent = diff.rew_word_count;
    
    const sign = diff.delta_words > 0 ? "+" : "";
    deltaWordStat.textContent = `${sign}${diff.delta_words} (${diff.delta_percent}%)`;
    if (diff.delta_words < 0) {
      deltaWordStat.className = "font-bold text-blue-600";
    } else {
      deltaWordStat.className = "font-bold text-slate-800";
    }

    similarityStat.textContent = `${diff.similarity_score}%`;
  }

  function renderDiffViews(diff) {
    if (!diff || !diff.tokens) return;

    // Side-by-side view
    const sideBySide = window.DiffEngine.renderSideBySide(diff.tokens);
    diffColOriginal.innerHTML = sideBySide.originalColumn;
    diffColRewritten.innerHTML = sideBySide.rewrittenColumn;

    // Unified view
    unifiedDiffOutput.innerHTML = window.DiffEngine.renderUnifiedDiff(diff.tokens);
  }

  function switchDiffView(mode) {
    state.diffViewMode = mode;
    if (mode === "side-by-side") {
      btnSideBySide.classList.add("bg-white", "shadow-sm", "text-blue-600", "font-semibold");
      btnSideBySide.classList.remove("text-slate-600");
      btnUnified.classList.remove("bg-white", "shadow-sm", "text-blue-600", "font-semibold");
      btnUnified.classList.add("text-slate-600");

      sideBySideContainer.classList.remove("hidden");
      unifiedContainer.classList.add("hidden");
    } else {
      btnUnified.classList.add("bg-white", "shadow-sm", "text-blue-600", "font-semibold");
      btnUnified.classList.remove("text-slate-600");
      btnSideBySide.classList.remove("bg-white", "shadow-sm", "text-blue-600", "font-semibold");
      btnSideBySide.classList.add("text-slate-600");

      sideBySideContainer.classList.add("hidden");
      unifiedContainer.classList.remove("hidden");
    }
  }

  // ==========================================
  // RENDER MEANING GUARD
  // ==========================================
  function renderMeaningGuard(guard) {
    if (!guard) return;

    // Status Banner Style
    guardStatusLabel.textContent = guard.status_label;
    if (guard.status === "danger") {
      guardStatusBanner.className = "p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-900";
      guardStatusIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>`;
    } else if (guard.status === "warning") {
      guardStatusBanner.className = "p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900";
      guardStatusIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
    } else {
      guardStatusBanner.className = "p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900";
      guardStatusIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
    }

    // Warnings list
    guardWarningsContainer.innerHTML = "";
    if (guard.warnings && guard.warnings.length > 0) {
      guard.warnings.forEach((w) => {
        const item = document.createElement("div");
        item.className = "flex items-start gap-2 text-xs py-1 text-slate-700";
        item.innerHTML = `<span class="inline-block w-2 h-2 rounded-full mt-1.5 ${w.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}"></span><div><strong class="font-medium">${w.title}:</strong> ${w.message}</div>`;
        guardWarningsContainer.appendChild(item);
      });
    } else if (guard.passed_checks && guard.passed_checks.length > 0) {
      guard.passed_checks.forEach((p) => {
        const item = document.createElement("div");
        item.className = "flex items-center gap-2 text-xs py-0.5 text-emerald-700 font-medium";
        item.innerHTML = `<span>✓</span><span>${p}</span>`;
        guardWarningsContainer.appendChild(item);
      });
    }

    // Entity Chips
    renderEntityChips(origEntitiesChips, guard.original_entities);
    renderEntityChips(rewEntitiesChips, guard.rewritten_entities);
  }

  function renderEntityChips(container, entities) {
    container.innerHTML = "";
    if (!entities) return;

    let total = 0;
    const addChip = (text, typeClass) => {
      total++;
      const span = document.createElement("span");
      span.className = `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeClass}`;
      span.textContent = text;
      container.appendChild(span);
    };

    (entities.dates || []).forEach(d => addChip(d, "bg-purple-100 text-purple-800"));
    (entities.numbers || []).forEach(n => addChip(n, "bg-blue-100 text-blue-800"));
    (entities.negations || []).forEach(neg => addChip(neg, "bg-rose-100 text-rose-800 font-bold"));
    (entities.names || []).forEach(nm => addChip(nm, "bg-slate-100 text-slate-800"));

    if (total === 0) {
      container.innerHTML = `<span class="text-xs text-slate-400 italic">None detected</span>`;
    }
  }

  // ==========================================
  // COMPARE ALL 4 RESULTS VIEW
  // ==========================================
  function renderCompareAllResults(comparisons) {
    emptyStateCard.classList.add("hidden");
    singleResultCard.classList.add("hidden");
    multiCompareGrid.classList.remove("hidden");

    multiCompareGrid.innerHTML = `
      <div class="col-span-full flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 class="text-lg font-bold text-slate-900">4-Voice Persona Comparison</h3>
          <p class="text-xs text-slate-500">Same draft transformed simultaneously across all four communication styles.</p>
        </div>
        <button id="closeCompareBtn" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
          Back to Single Result
        </button>
      </div>
    `;

    document.getElementById("closeCompareBtn").addEventListener("click", () => {
      if (state.currentResult) {
        multiCompareGrid.classList.add("hidden");
        singleResultCard.classList.remove("hidden");
      } else {
        multiCompareGrid.classList.add("hidden");
        emptyStateCard.classList.remove("hidden");
      }
    });

    comparisons.forEach((item) => {
      const card = document.createElement("div");
      card.className = "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition";
      
      const icon = item.persona === "executive" ? "👔"
        : item.persona === "supportive" ? "🤝"
        : item.persona === "legal" ? "⚖️" : "⚡";

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
              <span>${icon}</span> ${item.persona_title}
            </span>
            <span class="text-xs text-slate-400 font-mono">${item.diff ? item.diff.rew_word_count + ' words' : ''}</span>
          </div>
          <p class="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed mb-4">${window.DiffEngine.escapeHtml(item.rewritten_text)}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">${item.diff ? item.diff.similarity_score + '% similarity' : ''}</span>
          <button class="compare-copy-btn px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition" data-text="${window.DiffEngine.escapeHtml(item.rewritten_text)}">
            Copy
          </button>
        </div>
      `;

      multiCompareGrid.appendChild(card);
    });

    document.querySelectorAll(".compare-copy-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const text = this.getAttribute("data-text");
        navigator.clipboard.writeText(text);
        showToast("Copied persona output!");
      });
    });
  }

  // ==========================================
  // INLINE EDITING
  // ==========================================
  function toggleInlineEdit() {
    if (!state.currentResult) return;
    state.isEditingInline = true;
    resultTextContent.classList.add("hidden");
    resultTextEditor.classList.remove("hidden");
    resultTextarea.value = state.currentResult.rewritten_text;
    resultTextarea.focus();
  }

  function saveInlineEdit() {
    const newText = resultTextarea.value.trim();
    if (!newText) {
      showToast("Text cannot be empty.", "error");
      return;
    }

    state.currentResult.rewritten_text = newText;
    resultTextContent.textContent = newText;
    exitInlineEditMode();

    // Recompute diff and meaning guard locally using client engines
    const origDraft = draftInput.value;
    const diff = window.DiffEngine.computeDiff(origDraft, newText);
    const guard = window.MeaningGuard.analyze(origDraft, newText);

    state.currentResult.diff = diff;
    state.currentResult.meaning_guard = guard;

    renderDiffStats(diff);
    renderDiffViews(diff);
    renderMeaningGuard(guard);

    showToast("Changes saved & diff re-analyzed.");
  }

  function cancelInlineEdit() {
    exitInlineEditMode();
  }

  function exitInlineEditMode() {
    state.isEditingInline = false;
    resultTextEditor.classList.add("hidden");
    resultTextContent.classList.remove("hidden");
  }

  // ==========================================
  // COPY & EXPORT ACTIONS
  // ==========================================
  function copyOutputText() {
    if (!state.currentResult) return;
    navigator.clipboard.writeText(state.currentResult.rewritten_text).then(() => {
      showToast("Copied rewritten message to clipboard!");
    });
  }

  function copyEmailFormat() {
    if (!state.currentResult) return;
    const personaTitle = state.currentResult.persona_title || "Communication";
    const emailFormat = `Subject: Important Update regarding Project Milestones\n\nDear Team,\n\n${state.currentResult.rewritten_text}\n\nBest regards,\nVibeShift AI`;
    navigator.clipboard.writeText(emailFormat).then(() => {
      showToast("Copied in Email-ready format (Subject + Body)!");
    });
  }

  function copySlackFormat() {
    if (!state.currentResult) return;
    const slackFormat = `*VibeShift AI [${state.currentResult.persona_title}]:*\n> ${state.currentResult.rewritten_text.split('\n').join('\n> ')}`;
    navigator.clipboard.writeText(slackFormat).then(() => {
      showToast("Copied in Slack/Teams markdown block format!");
    });
  }

  function exportAsPlainText() {
    if (!state.currentResult) return;
    const content = `VIBESHIFT AI - PERSONA REWRITE EXPORT\nPersona: ${state.currentResult.persona_title}\nSimilarity: ${state.currentResult.diff ? state.currentResult.diff.similarity_score + '%' : 'N/A'}\n\n--- ORIGINAL DRAFT ---\n${state.currentResult.original_text || draftInput.value}\n\n--- REWRITTEN OUTPUT ---\n${state.currentResult.rewritten_text}\n`;
    downloadFile(content, "vibeshift_rewrite.txt", "text/plain");
  }

  function exportAsMarkdown() {
    if (!state.currentResult) return;
    const content = `# VibeShift AI Rewrite Export\n\n**Persona:** ${state.currentResult.persona_title}  \n**Similarity Score:** ${state.currentResult.diff ? state.currentResult.diff.similarity_score + '%' : 'N/A'}  \n**Word Count:** ${state.currentResult.diff ? state.currentResult.diff.rew_word_count : 'N/A'}\n\n### Original Draft\n> ${state.currentResult.original_text || draftInput.value}\n\n### Rewritten Message\n${state.currentResult.rewritten_text}\n\n---\n*Preserved with VibeShift AI Meaning Guard.*`;
    downloadFile(content, "vibeshift_rewrite.md", "text/markdown");
  }

  function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`);
  }

  function resetResults() {
    state.currentResult = null;
    singleResultCard.classList.add("hidden");
    multiCompareGrid.classList.add("hidden");
    emptyStateCard.classList.remove("hidden");
    draftInput.value = "";
    state.originalDraft = "";
    updateTextStats();
    showToast("Reset workspace.");
  }

  // ==========================================
  // HISTORY PERSISTENCE (LOCALSTORAGE)
  // ==========================================
  function loadLocalHistory() {
    try {
      const stored = localStorage.getItem("vibeshift_history");
      if (stored) {
        state.history = JSON.parse(stored);
        renderHistoryList();
      }
    } catch (e) {
      console.warn("Could not read localStorage history", e);
    }
  }

  function saveToHistory(item) {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      persona: item.persona,
      persona_title: item.persona_title,
      original_text: item.original_text,
      rewritten_text: item.rewritten_text,
      similarity_score: item.diff ? item.diff.similarity_score : 100,
      itemData: item
    };

    state.history.unshift(historyEntry);
    if (state.history.length > 8) state.history.pop(); // keep last 8 entries

    try {
      localStorage.setItem("vibeshift_history", JSON.stringify(state.history));
      renderHistoryList();
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  function renderHistoryList() {
    if (!historyList) return;
    historyList.innerHTML = "";

    if (historyCountBadge) {
      historyCountBadge.textContent = state.history.length;
    }

    if (state.history.length === 0) {
      historyList.innerHTML = `<p class="text-xs text-slate-400 py-2 italic text-center">No transformations saved yet.</p>`;
      return;
    }

    state.history.forEach((h) => {
      const div = document.createElement("div");
      div.className = "p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm cursor-pointer transition flex flex-col gap-1";
      div.innerHTML = `
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-800">${h.persona_title}</span>
          <span class="text-slate-400 text-[11px]">${h.timestamp}</span>
        </div>
        <p class="text-xs text-slate-600 truncate">${window.DiffEngine.escapeHtml(h.original_text)}</p>
      `;

      div.addEventListener("click", () => {
        draftInput.value = h.original_text;
        state.originalDraft = h.original_text;
        updateTextStats();
        selectPersona(h.persona);
        state.currentResult = h.itemData;
        renderSingleResult(h.itemData);
        showToast("Restored from history.");
      });

      historyList.appendChild(div);
    });
  }

  function clearLocalHistory() {
    state.history = [];
    localStorage.removeItem("vibeshift_history");
    renderHistoryList();
    showToast("History cleared.");
  }

  // ==========================================
  // UI HELPERS (SPINNERS & TOASTS)
  // ==========================================
  function setGeneratingState(loading) {
    state.isGenerating = loading;
    if (loading) {
      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Transforming...";
      transformBtn.disabled = true;
      compareAllBtn.disabled = true;
      transformBtn.classList.add("opacity-80", "cursor-not-allowed");
    } else {
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Transform Persona";
      transformBtn.disabled = false;
      compareAllBtn.disabled = false;
      transformBtn.classList.remove("opacity-80", "cursor-not-allowed");
    }
  }

  function showToast(message, type = "info") {
    // Remove existing toast
    const oldToast = document.querySelector(".toast-notice");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notice fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border ${
      type === "error"
        ? "bg-rose-900 text-white border-rose-700"
        : "bg-slate-900 text-white border-slate-700"
    }`;
    toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '✓'}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Run on start
  init();
});
