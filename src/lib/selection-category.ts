export function extractSubNumbers(value: unknown): string[] {
  const text = String(value ?? '').toUpperCase();
  const match = text.match(/\bSUB\s*[-:]?\s*(\d{2})(?:\s*\/\s*(\d{2}))?/i);
  return match ? [match[1], match[2]].filter((item): item is string => Boolean(item)) : [];
}

export function extractSubNumber(value: unknown): string | undefined {
  return extractSubNumbers(value)[0];
}

export function formatSubCategory(value: unknown): string | undefined {
  const sub = extractSubNumber(value);
  return sub ? `SUB ${sub}` : undefined;
}

export function extractSelectionGender(value: unknown): 'MASCULINO' | 'FEMININO' | undefined {
  const text = String(value ?? '').toUpperCase();
  if (/\bFEMININO\b/.test(text)) return 'FEMININO';
  if (/\bMASCULINO\b/.test(text)) return 'MASCULINO';
  return undefined;
}
