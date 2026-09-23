/**
 * Utility to execute a Gemini API call with exponential backoff retries
 * for transient errors (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, 5xx server errors).
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Check if error is transient (503 high demand, 429 rate limit, 500/502/504)
      const isTransient =
        errorMessage.includes("503") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("500") ||
        errorMessage.includes("502") ||
        errorMessage.includes("504") ||
        errorMessage.toLowerCase().includes("high demand") ||
        errorMessage.toLowerCase().includes("temporarily unavailable");

      if (isTransient && attempt <= maxRetries) {
        console.warn(
          `[Gemini Retry] Attempt ${attempt}/${maxRetries} failed with transient error: ${errorMessage}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw err;
      }
    }
  }
}
