import type { WordPair } from '../types/game';
import { pickRandomWordPair } from '../utils/gameLogic';
import { buildWordPairPrompt } from './prompts';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

export async function generateWordPairFromTheme(theme: string): Promise<WordPair> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Clé API Gemini manquante. Vérifiez votre fichier .env.local.');
  }

  const prompt = buildWordPairPrompt(theme);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API Gemini : ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    // Gemini peut envelopper le JSON dans des backticks markdown
    const cleaned = rawText.trim().replace(/^```json?\n?/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.civil || !parsed.undercover || !parsed.category) {
      throw new Error('Réponse JSON incomplète');
    }
    return { ...parsed, source: 'ai-generated' } as WordPair;
  } catch {
    throw new Error(`Réponse inattendue de l'IA : ${rawText}`);
  }
}

export async function generateWordPairSafe(
  theme: string,
  onFallback?: (reason: string) => void
): Promise<WordPair> {
  try {
    return await generateWordPairFromTheme(theme);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Erreur inconnue';
    onFallback?.(reason);
    return pickRandomWordPair();
  }
}
