import { BOLT, NUT, BRICK } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

const BELIEF_VERBS = [
  'is', 'are', 'must', 'should', 'will', 'can',
  'believe', 'think', 'know', 'assert', 'claim', 'argue', 'hold that',
];

const SENTENCE_SUPPORT_STARTERS = [
  'because', 'since', 'as', 'given that', 'this means',
  'therefore', 'thus', 'hence',
];

const SENTENCE_SUPPORT_KEYWORDS = ['evidence', 'shows', 'proves', 'suggests'];

const ABSOLUTE_WORDS = ['always', 'never', 'everyone', 'nobody', 'impossible'];

// Split text into sentences using punctuation heuristics
function splitSentences(text: string): string[] {
  // Split on . ! ? followed by whitespace or end of string, keeping basic structure
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Check if a sentence contains a belief-signalling verb
function hasBeliefVerb(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return BELIEF_VERBS.some((v) => {
    // For multi-word phrases, just do substring check
    if (v.includes(' ')) return lower.includes(v);
    // For single words, match as word boundary to avoid partial matches
    const re = new RegExp(`\\b${v}\\b`);
    return re.test(lower);
  });
}

// Extract the first noun phrase heuristic: first 2-4 words before the belief verb
function extractCIntension(sentence: string): string {
  const lower = sentence.toLowerCase();
  for (const verb of BELIEF_VERBS) {
    const idx = lower.indexOf(verb);
    if (idx > 0) {
      const before = sentence.slice(0, idx).trim();
      const words = before.split(/\s+/).filter((w) => w.length > 0);
      if (words.length > 0) {
        // Take last 2-4 words before the verb (the subject/noun phrase)
        const nounWords = words.slice(Math.max(0, words.length - 4));
        return nounWords.join(' ');
      }
    }
  }
  // Fallback: first 3 words of the sentence
  const words = sentence.split(/\s+/).slice(0, 3);
  return words.join(' ');
}

// Extract BOLTs from raw text using heuristic NLP
// BOLTs are sentences containing belief-signalling words
export function extractBOLTs(text: string): BOLT[] {
  const sentences = splitSentences(text);
  const bolts: BOLT[] = [];

  for (const sentence of sentences) {
    if (bolts.length >= 20) break;
    if (sentence.length < 10) continue;
    if (hasBeliefVerb(sentence)) {
      const c_intension = extractCIntension(sentence);
      const w_intension = `in the world, this means that ${sentence}`;
      bolts.push({
        id: uuidv4(),
        text: sentence,
        c_intension,
        w_intension,
        waldconsistency: {},
        is_brick: false,
      });
    }
  }

  return bolts;
}

// Check if a sentence provides support for a BOLT
function isSupportingSentence(sentence: string): boolean {
  const lower = sentence.toLowerCase().trim();
  if (SENTENCE_SUPPORT_STARTERS.some((s) => lower.startsWith(s))) return true;
  if (SENTENCE_SUPPORT_KEYWORDS.some((k) => lower.includes(k))) return true;
  return false;
}

// Extract NUTs — supporting sentences adjacent to each BOLT
export function extractNUTs(bolts: BOLT[], text: string): NUT[] {
  const sentences = splitSentences(text);
  const nuts: NUT[] = [];

  for (const bolt of bolts) {
    // Find the index of the BOLT sentence in the sentences array
    const boltIdx = sentences.findIndex((s) => s.trim() === bolt.text.trim());
    if (boltIdx === -1) continue;

    // Look within 2 sentences before and after
    const start = Math.max(0, boltIdx - 2);
    const end = Math.min(sentences.length - 1, boltIdx + 2);

    for (let i = start; i <= end; i++) {
      if (i === boltIdx) continue;
      const candidate = sentences[i];
      if (candidate && isSupportingSentence(candidate)) {
        nuts.push({
          id: uuidv4(),
          bolt_id: bolt.id,
          text: candidate,
          type: 'premise',
        });
      }
    }
  }

  return nuts;
}

// Identify BRICKs — vague, circular, or contradictory BOLTs
export function identifyBRICKs(bolts: BOLT[], nuts: NUT[]): BRICK[] {
  const bricks: BRICK[] = [];

  for (const bolt of bolts) {
    // (a) Too vague — text is under 15 chars
    if (bolt.text.trim().length < 15) {
      bricks.push({
        id: uuidv4(),
        bolt_id: bolt.id,
        text: bolt.text,
        resistance_type: 'empirical',
        severity: 'high',
      });
      bolt.is_brick = true;
      continue;
    }

    // (b) Circular — c_intension repeats the text verbatim
    if (
      bolt.c_intension.trim().length > 0 &&
      bolt.text.trim().toLowerCase() === bolt.c_intension.trim().toLowerCase()
    ) {
      bricks.push({
        id: uuidv4(),
        bolt_id: bolt.id,
        text: bolt.text,
        resistance_type: 'logical',
        severity: 'high',
      });
      bolt.is_brick = true;
      continue;
    }

    // (c) Contains absolute words
    const lower = bolt.text.toLowerCase();
    const absoluteFound = ABSOLUTE_WORDS.find((w) => {
      const re = new RegExp(`\\b${w}\\b`);
      return re.test(lower);
    });

    if (absoluteFound) {
      bricks.push({
        id: uuidv4(),
        bolt_id: bolt.id,
        text: bolt.text,
        resistance_type: 'normative',
        severity: 'medium',
      });
      bolt.is_brick = true;
    }
  }

  return bricks;
}
