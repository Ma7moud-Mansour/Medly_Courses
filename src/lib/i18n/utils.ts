export function getLocalizedField<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string,
  lang: "ar" | "en"
): string {
  if (!item) return "";
  const baseValue = item[field] ?? "";
  
  if (lang === "ar") {
    return String(baseValue);
  }

  const enField = `${field}En`;
  const enValue = item[enField];

  // Fallback to base (Arabic) if English is empty
  if (enValue !== undefined && enValue !== null && String(enValue).trim() !== "") {
    return String(enValue);
  }

  return String(baseValue);
}
