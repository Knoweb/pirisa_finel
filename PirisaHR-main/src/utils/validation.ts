export const isNonEmpty = (value: string | null | undefined): boolean => {
  return Boolean(value && value.trim().length > 0);
};

export const isEmail = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

export const isPhone = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
};

export const toNumberSafe = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(num) ? num : null;
};

export const isNonNegativeNumber = (value: unknown): boolean => {
  const num = toNumberSafe(value);
  return num !== null && num >= 0;
};

export const isPositiveAmount = (value: unknown): boolean => {
  const num = toNumberSafe(value);
  return num !== null && num > 0;
};
