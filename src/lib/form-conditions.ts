import type { FormField } from '../types';

function comparableNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return undefined;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  // Dropdown labels may contain a year together with descriptive text.
  const year = text.match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
  return year ? Number(year) : undefined;
}

export function isFormFieldVisible(
  field: FormField,
  answers: Record<string, unknown>
): boolean {
  if (!field.show_when) return true;
  const sourceValue = answers[field.show_when.field_id];
  if (sourceValue === undefined || sourceValue === null || sourceValue === '') return false;

  const expected = field.show_when.value.trim();
  if (field.show_when.operator === 'equals') {
    return String(sourceValue).trim() === expected;
  }

  const actualNumber = comparableNumber(sourceValue);
  const expectedNumber = comparableNumber(expected);
  if (actualNumber === undefined || expectedNumber === undefined) return false;

  switch (field.show_when.operator) {
    case 'greater_than':
      return actualNumber > expectedNumber;
    case 'greater_than_or_equal':
      return actualNumber >= expectedNumber;
    case 'less_than':
      return actualNumber < expectedNumber;
    case 'less_than_or_equal':
      return actualNumber <= expectedNumber;
    default:
      return false;
  }
}
