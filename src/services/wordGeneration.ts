import type { WordPair } from '../types/game';
import { pickRandomWordPair } from '../utils/gameLogic';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateWordPairFromTheme(theme: string): Promise<WordPair> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Clé API Gemini manquante. Vérifiez votre fichier .env.local.');
  }

  const prompt = `Tu es un générateur de paires de mots pour le jeu Undercover.

Le thème choisi par les joueurs est : "${theme}"

Génère UNE paire de mots respectant ces règles :
1. Les deux mots appartiennent à l'univers du thème.
2. Les mots sont proches mais distincts (pas de synonymes exacts, pas trop éloignés).
3. Les mots doivent être des noms simples (1-3 mots maximum).

Exemples :
- Thème "Harry Potter" → civil: "Gryffondor", undercover: "Serdaigle"
- Thème "Cuisine japonaise" → civil: "Ramen", undercover: "Udon"
- Thème "Années 80" → civil: "Walkman", undercover: "Discman"

Réponds UNIQUEMENT avec un objet JSON, sans backticks, sans explication :
{"civil": "...", "undercover": "...", "category": "${theme}"}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 100, temperature: 0.9 },
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
