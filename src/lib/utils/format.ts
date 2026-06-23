export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").padStart(8, "0");
  if (digits.length < 8) return raw;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function formatPhone(phone: string | null): string {
  if (!phone || phone === "Não informado") return "Não informado";
  return phone;
}
