import { z } from "zod";

export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(8, "CEP deve conter 8 dígitos numéricos"));

export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").padStart(8, "0");
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}
