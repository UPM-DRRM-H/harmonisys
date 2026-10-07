export async function fetchRedasData(params: URLSearchParams) {
    const base = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!base) throw new Error('REDAS training data is not configured.');
    const url = new URL(base);
    if (url.protocol !== 'https:')
        throw new Error('REDAS requires a secure provider URL.');
    for (const key of ['sheetName', 'label', 'place', 'count']) {
        const value = params.get(key);
        if (value) url.searchParams.set(key, value);
    }
    const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
    });
    if (!response.ok)
        throw new Error('REDAS training data is temporarily unavailable.');
    return response.json();
}
export async function withTimeout<T>(
    promise: Promise<T>,
    ms = 8000
): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    try {
        return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error('Source timed out.')),
                    ms
                );
            }),
        ]);
    } finally {
        clearTimeout(timer!);
    }
}
