import type { FormField } from '../types';
import { extractSubNumber } from './selection-category';

function comparableNumber(value: unknown, preferSub: boolean): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return undefined;
  if (preferSub) {
    const sub = extractSubNumber(text);
    if (sub) return Number(sub);
  }
  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  // Dropdown labels may contain a year together with descriptive text.
  const year = text.match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
  return year ? Number(year) : undefined;
}

function normalizedBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim().toLocaleLowerCase('pt-BR');
  if (['true', 'sim', 'yes', '1', 'on'].includes(text)) return true;
  if (['false', 'não', 'nao', 'no', '0', 'off'].includes(text)) return false;
  return undefined;
}

function equalsExpected(sourceValue: unknown, expected: string): boolean {
  const values = Array.isArray(sourceValue) ? sourceValue : [sourceValue];
  const expectedBoolean = normalizedBoolean(expected);
  return values.some((value) => {
    const actualBoolean = normalizedBoolean(value);
    if (expectedBoolean !== undefined && actualBoolean !== undefined) {
      return actualBoolean === expectedBoolean;
    }
    return String(value).trim().toLocaleLowerCase('pt-BR') === expected.toLocaleLowerCase('pt-BR');
  });
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
    return equalsExpected(sourceValue, expected);
  }

  const compareAsSub = Boolean(extractSubNumber(expected));
  const actualNumber = comparableNumber(sourceValue, compareAsSub);
  const expectedNumber = comparableNumber(expected, compareAsSub);
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
