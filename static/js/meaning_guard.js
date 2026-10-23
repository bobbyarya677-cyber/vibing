/**
 * VibeShift AI - Client-side Meaning Guard Inspector
 * Ensures fact preservation, negation checks, and commitment tracking
 * when users inspect, edit, or regenerate outputs.
 */

window.MeaningGuard = (function() {

  const DAY_PATTERNS = [
    /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(?:tomorrow|yesterday|today|tonight)\b/gi,
    /\b(?:asap|eod|end of day|cob|close of business)\b/gi,
    /\b(?:next sprint|this sprint|next week|this week|next month)\b/gi,
    /\b(?:q[1-4]|quarter\s*[1-4])\b/gi,
    /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi,
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi
  ];

  const NUMBER_PATTERNS = [
    /\$\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion|thousand))?\b/gi,
    /\b\d+(?:\.\d+)?\s*%/gi,
    /\b\d+\s*(?:days?|hours?|weeks?|months?|minutes?|secs?|seconds?|slides?|tickets?|bugs?|features?|pr|prs|users?|dollars?)\b/gi,
    /\b\d+(?:,\d{3})*(?:\.\d+)?\b/gi
  ];

  const NEGATION_PATTERNS = [
    /\b(?:not|never|no|none|cannot|can't|won't|wouldn't|don't|doesn't|didn't|shouldn't|mustn't)\b/gi,
    /\b(?:refuse|decline|prohibit|forbidden|stop|avoid|reject|fail)\b/gi
  ];

  const COMMITMENT_PATTERNS = [
    /\b(?:must|shall|guarantee|promise|commit|committed|required|mandatory|deadline|urgent|critical)\b/gi
  ];

  function extractEntities(text) {
    if (!text) {
      return { dates: [], numbers: [], negations: [], commitments: [], names: [] };
    }

    const dates = [];
    DAY_PATTERNS.forEach(pat => {
      const matches = text.match(pat) || [];
      matches.forEach(m => {
        const clean = m.toLowerCase().trim();
        if (!dates.includes(clean)) dates.push(clean);
      });
    });

    const numbers = [];
    NUMBER_PATTERNS.forEach(pat => {
      const matches = text.match(pat) || [];
      matches.forEach(m => {
        const clean = m.trim();
        if (!numbers.includes(clean) && !dates.includes(clean.toLowerCase())) {
          numbers.push(clean);
        }
      });
    });

    const negations = [];
    NEGATION_PATTERNS.forEach(pat => {
      const matches = text.match(pat) || [];
      matches.forEach(m => {
        const clean = m.toLowerCase().trim();
        if (!negations.includes(clean)) negations.push(clean);
      });
    });

    const commitments = [];
    COMMITMENT_PATTERNS.forEach(pat => {
      const matches = text.match(pat) || [];
      matches.forEach(m => {
        const clean = m.toLowerCase().trim();
        if (!commitments.includes(clean)) commitments.push(clean);
      });
    });

    const names = [];
    // User handles
    const handles = text.match(/@[\w.-]+/g) || [];
    handles.forEach(h => { if (!names.includes(h)) names.push(h); });

    // Capitalized names (ignoring common start words)
    const tokens = text.split(/\s+/);
    tokens.forEach((token, idx) => {
      const clean = token.replace(/[^\w]/g, '');
      if (clean && /^[A-Z][a-z]+$/.test(clean)) {
        if (!['The', 'A', 'An', 'I', 'We', 'He', 'She', 'It', 'They', 'This', 'That', 'If', 'So', 'Our', 'My'].includes(clean)) {
          if (idx > 0 && !/[.!?:]$/.test(tokens[idx - 1])) {
            if (!names.includes(clean)) names.push(clean);
          }
        }
      }
    });

    return {
      dates: dates,
      numbers: numbers,
      negations: negations,
      commitments: commitments,
      names: names
    };
  }

  function analyze(originalText, rewrittenText) {
    const orig = extractEntities(originalText);
    const rew = extractEntities(rewrittenText);

    const warnings = [];
    const passed = [];

    // Check negations
    const rewTextLower = (rewrittenText || '').toLowerCase();
    const missingNegations = orig.negations.filter(n => !rewTextLower.includes(n));
    if (orig.negations.length > 0 && missingNegations.length > 0) {
      warnings.push({
        type: 'negation',
        severity: 'high',
        title: 'Negation Restriction Modified',
        message: `Original message contained restriction terms (${missingNegations.join(', ')}) that may have been softened or omitted.`
      });
    } else if (orig.negations.length > 0) {
      passed.push('Negations & negative constraints preserved');
    }

    // Check dates
    const missingDates = orig.dates.filter(d => !rewTextLower.includes(d));
    if (missingDates.length > 0) {
      warnings.push({
        type: 'date',
        severity: 'medium',
        title: 'Possible Deadline or Timing Change',
        message: `Timing reference (${missingDates.join(', ')}) not detected verbatim in rewritten draft.`
      });
    } else if (orig.dates.length > 0) {
      passed.push('All key dates, deadlines, and timing markers intact');
    }

    // Check numbers
    const missingNumbers = orig.numbers.filter(n => {
      const digits = n.replace(/[^\d.]/g, '');
      return digits && !(rewrittenText || '').includes(digits);
    });
    if (missingNumbers.length > 0) {
      warnings.push({
        type: 'number',
        severity: 'medium',
        title: 'Numerical Quantity or Metric Shift',
        message: `Detected metrics (${missingNumbers.join(', ')}) may have been altered or generalized.`
      });
    } else if (orig.numbers.length > 0) {
      passed.push('Numerical metrics, counts, and amounts preserved');
    }

    // Check names
    const missingNames = orig.names.filter(nm => !rewTextLower.includes(nm.toLowerCase()));
    if (missingNames.length > 0) {
      warnings.push({
        type: 'name',
        severity: 'low',
        title: 'Entity or Person Reference',
        message: `Participant or entity (${missingNames.join(', ')}) was not detected explicitly.`
      });
    } else if (orig.names.length > 0) {
      passed.push('Participant and entity references preserved');
    }

    // Status resolution
    let status = 'safe';
    let statusLabel = 'Guard Verified: Meaning Intact';
    let statusColor = 'emerald';

    if (warnings.some(w => w.severity === 'high')) {
      status = 'danger';
      statusLabel = 'Action Required: Guard Alert';
      statusColor = 'rose';
    } else if (warnings.some(w => w.severity === 'medium')) {
      status = 'warning';
      statusLabel = 'Review Suggested: Minor Drift';
      statusColor = 'amber';
    }

    if (warnings.length === 0 && passed.length === 0) {
      passed.push('No ambiguous entities or high-risk constraints detected in source draft.');
    }

    return {
      status: status,
      status_label: statusLabel,
      status_color: statusColor,
      warnings: warnings,
      passed_checks: passed,
      original_entities: orig,
      rewritten_entities: rew,
      disclaimer: 'Meaning Guard is an algorithmic heuristic check to assist review; always verify critical commitments.'
    };
  }

  return {
    extractEntities: extractEntities,
    analyze: analyze
  };

})();
