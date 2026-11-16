const supportedHosts = new Set([
  "api.locketcamera.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
  "firebasestorage.googleapis.com",
]);

export function useLocalUpstream(base) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, options) => {
    const url = new URL(typeof input === "string" ? input : input.url || input);
    if (supportedHosts.has(url.hostname))
      return originalFetch(
        `${base}/${url.hostname}${url.pathname}${url.search}`,
        options,
      );
    if (!["127.0.0.1", "localhost"].includes(url.hostname))
      throw new Error("Test refuses all unmodeled external requests");
    return originalFetch(input, options);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}
