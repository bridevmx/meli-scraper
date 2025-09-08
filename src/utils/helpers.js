
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const nowIso = () => new Date().toISOString();

export async function withRetries(fn, { tries = 10, baseMs = 400, label = 'task' } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const jitter = Math.floor(Math.random() * 200);
      const backoff = Math.min(30_000, baseMs * Math.pow(2, attempt)) + jitter;
      if (attempt === tries - 1) break;
      console.warn(`↩️  Retry ${label} (${attempt + 1}/${tries}) in ${backoff}ms:`, err?.message || err);
      await sleep(backoff);
    }
  }
  const error = new Error(`Failed after ${tries} retries: ${label}`);
  error.cause = lastErr;
  throw error;
}
