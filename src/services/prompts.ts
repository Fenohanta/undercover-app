export function buildWordPairPrompt(theme: string): string {
  return `Tu es un générateur de paires de mots pour le jeu Undercover.

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
}
