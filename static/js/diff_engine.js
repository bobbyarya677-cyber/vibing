/**
 * VibeShift AI - Client-side Word-Level Diff Engine
 * Provides instant token-level difference highlighting for both
 * initial AI responses and user manual inline edits.
 */

window.DiffEngine = (function() {

  function tokenize(text) {
    if (!text) return [];
    // Tokenize preserving words, contractions, punctuation, and whitespaces
    return text.match(/\w+(?:['’-]\w+)?|[^\w\s]|\s+/gu) || [];
  }

  function getRawWords(text) {
    if (!text) return [];
    return text.match(/\b[\w'-]+\b/gu) || [];
  }

  function computeLCS(tokensA, tokensB) {
    const m = tokensA.length;
    const n = tokensB.length;
    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokensA[i - 1] === tokensB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find diff tokens
    let i = m, j = n;
    const diff = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
        diff.unshift({ type: 'unchanged', value: tokensA[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', value: tokensB[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        diff.unshift({ type: 'removed', value: tokensA[i - 1] });
        i--;
      }
    }

    return diff;
  }

  function computeDiff(originalText, rewrittenText) {
    const origWords = getRawWords(originalText);
    const rewWords = getRawWords(rewrittenText);
    
    const origCount = origWords.length;
    const rewCount = rewWords.length;
    const deltaWords = rewCount - origCount;
    const deltaPercent = origCount > 0 ? ((deltaWords / origCount) * 100).toFixed(1) : 0;

    const tokensA = tokenize(originalText || '');
    const tokensB = tokenize(rewrittenText || '');
    const tokens = computeLCS(tokensA, tokensB);

    // Compute textual similarity using token overlap
    let commonCount = 0;
    const origWordsLower = origWords.map(w => w.toLowerCase());
    const rewWordsLower = rewWords.map(w => w.toLowerCase());
    
    const countMap = {};
    for (const w of origWordsLower) countMap[w] = (countMap[w] || 0) + 1;
    for (const w of rewWordsLower) {
      if (countMap[w] > 0) {
        commonCount++;
        countMap[w]--;
      }
    }

    const totalWords = origCount + rewCount;
    const similarity = totalWords > 0 ? ((2.0 * commonCount / totalWords) * 100).toFixed(1) : 100;

    return {
      tokens: tokens,
      orig_word_count: origCount,
      rew_word_count: rewCount,
      delta_words: deltaWords,
      delta_percent: deltaPercent,
      similarity_score: parseFloat(similarity)
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderUnifiedDiff(tokens) {
    return tokens.map(t => {
      const val = escapeHtml(t.value);
      if (t.type === 'removed') {
        return `<span class="diff-removed" title="Removed from original">${val}</span>`;
      } else if (t.type === 'added') {
        return `<span class="diff-added" title="Added in rewritten">${val}</span>`;
      } else {
        return `<span class="diff-unchanged">${val}</span>`;
      }
    }).join('');
  }

  function renderSideBySide(tokens) {
    // Left: Original text with removals highlighted, additions omitted
    let leftHtml = '';
    // Right: Rewritten text with additions highlighted, removals omitted
    let rightHtml = '';

    for (const t of tokens) {
      const val = escapeHtml(t.value);
      if (t.type === 'removed') {
        leftHtml += `<span class="diff-removed" title="Removed from original">${val}</span>`;
      } else if (t.type === 'added') {
        rightHtml += `<span class="diff-added" title="Added in rewrite">${val}</span>`;
      } else {
        leftHtml += `<span class="diff-unchanged">${val}</span>`;
        rightHtml += `<span class="diff-unchanged">${val}</span>`;
      }
    }

    return {
      originalColumn: leftHtml,
      rewrittenColumn: rightHtml
    };
  }

  return {
    computeDiff: computeDiff,
    renderUnifiedDiff: renderUnifiedDiff,
    renderSideBySide: renderSideBySide,
    escapeHtml: escapeHtml
  };

})();
