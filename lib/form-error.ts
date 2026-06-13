export function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const error = (data as { error?: unknown }).error;

  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    const firstFieldError = fieldErrors && Object.values(fieldErrors).flat().find(Boolean);
    if (firstFieldError) return firstFieldError;

    const formErrors = (error as { formErrors?: string[] }).formErrors;
    if (formErrors?.length) return formErrors[0];
  }

  return fallback;
}
