export class AllRetriesFailed extends Error {
  constructor(public readonly lastError: unknown) {
    super(`All retries failed: ${String(lastError)}`);
  }
}

export async function callWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryOn?: (error: unknown) => boolean;
  }
): Promise<T> {
  const {
    maxAttempts = 4,
    baseDelay = 500,
    maxDelay = 8000,
    retryOn = () => true,
  } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1 || !retryOn(error)) break;
      const ceiling = Math.min(maxDelay, baseDelay * 2 ** attempt);
      await new Promise((r) => setTimeout(r, Math.random() * ceiling));
    }
  }

  throw new AllRetriesFailed(lastError);
}

export function fetchWithTimeout(
  url: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = 10000, ...fetchOptions } = options ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(
    () => clearTimeout(timeout)
  );
}
