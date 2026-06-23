const REPLACEMENTS: Record<string, string> = {
  "Ã£": "ã",
  "Ã¡": "á",
  "Ã¢": "â",
  "Ã©": "é",
  "Ãª": "ê",
  "Ã­": "í",
  "Ã³": "ó",
  "Ã´": "ô",
  "Ãº": "ú",
  "Ã§": "ç",
  "NÃ£": "Não",
};

export function normalizeText(text: string): string {
  let result = text;
  for (const [from, to] of Object.entries(REPLACEMENTS)) {
    result = result.replaceAll(from, to);
  }
  return result;
}
