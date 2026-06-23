import { callWithBackoff, fetchWithTimeout } from "@/lib/utils/retry";
import type { CepResult } from "@/types";
import { z } from "zod";

const viaCepResponseSchema = z.object({
  cep: z.string(),
  logradouro: z.string().default(""),
  bairro: z.string().default(""),
  localidade: z.string(),
  uf: z.string(),
  erro: z.boolean().optional(),
});

export async function validateCep(
  cep: string
): Promise<{ valid: true; data: CepResult } | { valid: false; error: string }> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return {
      valid: false,
      error: "CEP inválido. Deve conter 8 dígitos numéricos (ex: 20210150).",
    };
  }

  try {
    const data = await callWithBackoff(
      async () => {
        const res = await fetchWithTimeout(
          `https://viacep.com.br/ws/${digits}/json/`,
          { timeoutMs: 10000 }
        );
        if (!res.ok) throw new Error(`ViaCEP HTTP ${res.status}`);
        return res.json();
      },
      { maxAttempts: 3, retryOn: isTransient }
    );

    const parsed = viaCepResponseSchema.parse(data);
    if (parsed.erro) {
      return { valid: false, error: "CEP não encontrado." };
    }

    return {
      valid: true,
      data: {
        cep: parsed.cep,
        logradouro: parsed.logradouro,
        bairro: parsed.bairro,
        localidade: parsed.localidade,
        uf: parsed.uf,
      },
    };
  } catch {
    return {
      valid: false,
      error: "Erro de conexão com a API ViaCEP. Tente novamente.",
    };
  }
}

function isTransient(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") return true;
  if (error instanceof Error && error.message.includes("5")) return true;
  return true;
}
