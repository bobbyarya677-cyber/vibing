"""
Word-Level Difference and Similarity Engine for VibeShift AI.
Provides precise token-level LCS (Longest Common Subsequence) diffing
to highlight removed, added, and unchanged words between the original draft
and the rewritten persona output.
"""

import re
import difflib

def tokenize(text):
    """
    Tokenizes text into words and punctuation while preserving layout whitespace.
    """
    if not text:
        return []
    # Match words (including contractions and hyphens) or individual punctuation / spaces
    return re.findall(r"\w+(?:['’-]\w+)?|[^\w\s]|\s+", text, re.UNICODE)

def compute_word_diff(original_text, rewritten_text):
    """
    Computes a word-level diff between original_text and rewritten_text.
    Returns:
        - diff_tokens: list of dicts { 'type': 'unchanged' | 'removed' | 'added', 'value': str }
        - orig_words: int
        - rew_words: int
        - delta_words: int
        - similarity_score: float (0.0 to 100.0)
    """
    orig_raw_words = [w for w in re.findall(r"\b[\w'-]+\b", original_text or "")]
    rew_raw_words = [w for w in re.findall(r"\b[\w'-]+\b", rewritten_text or "")]
    
    orig_count = len(orig_raw_words)
    rew_count = len(rew_raw_words)
    delta_words = rew_count - orig_count

    orig_tokens = tokenize(original_text or "")
    rew_tokens = tokenize(rewritten_text or "")

    matcher = difflib.SequenceMatcher(None, orig_tokens, rew_tokens)
    diff_tokens = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            diff_tokens.append({
                'type': 'unchanged',
                'value': "".join(orig_tokens[i1:i2])
            })
        elif tag == 'delete':
            diff_tokens.append({
                'type': 'removed',
                'value': "".join(orig_tokens[i1:i2])
            })
        elif tag == 'insert':
            diff_tokens.append({
                'type': 'added',
                'value': "".join(rew_tokens[j1:j2])
            })
        elif tag == 'replace':
            diff_tokens.append({
                'type': 'removed',
                'value': "".join(orig_tokens[i1:i2])
            })
            diff_tokens.append({
                'type': 'added',
                'value': "".join(rew_tokens[j1:j2])
            })

    # Word similarity ratio using difflib ratio on word lists
    word_matcher = difflib.SequenceMatcher(None, [w.lower() for w in orig_raw_words], [w.lower() for w in rew_raw_words])
    similarity = round(word_matcher.ratio() * 100, 1)

    return {
        'tokens': diff_tokens,
        'orig_word_count': orig_count,
        'rew_word_count': rew_count,
        'delta_words': delta_words,
        'delta_percent': round((delta_words / orig_count * 100) if orig_count > 0 else 0, 1),
        'similarity_score': similarity
    }
