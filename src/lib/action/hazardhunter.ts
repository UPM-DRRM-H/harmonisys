// lib/api.ts
type HazardApiPayload = Record<string, unknown>;

function extractHazardPayload(payload: HazardApiPayload) {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const nested = payload.data;
        if (nested && typeof nested === 'object') {
            return nested;
        }
    }

    return payload;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function fetchToken(): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch('https://api.georisk.gov.ph/generate/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.HAZARDHUNTER_CLIENT_ID,
                client_secret: process.env.HAZARDHUNTER_CLIENT_SECRET,
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
                `Token request failed with status ${res.status}: ${errorText}`
            );
        }

        const data = await res.json();

        cachedToken = data.token || data.access_token;

        if (!cachedToken) {
            throw new Error(
                'Token response did not include a token.'
            );
        }

        tokenExpiry = Date.now() + 1000 * 60 * 50;
        return cachedToken;
    } catch (error: any) {
        if (error.name === 'AbortError' || error instanceof DOMException) {
            throw new Error('GeoRisk Token API timed out.');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function getValidToken(): Promise<string> {
    if (!cachedToken || !tokenExpiry || Date.now() > tokenExpiry) {
        return await fetchToken();
    }
    return cachedToken;
}

export async function fetchHazardAssessment(latitude: number, longitude: number) {
    const payload = JSON.stringify({ latitude, longitude });
    
    try {
        const token = await getValidToken();
        const controller = new AbortController();
        // Increased timeout to 15s to give GeoRisk more time to respond
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch('https://api.georisk.gov.ph/api/assessments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
                signal: controller.signal,
            });

            if (res.status === 401) {
                const newToken = await fetchToken();
                const retryController = new AbortController();
                const retryTimeout = setTimeout(() => retryController.abort(), 15000);

                try {
                    const retryRes = await fetch('https://api.georisk.gov.ph/api/assessments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${newToken}`,
                        },
                        body: payload,
                        signal: retryController.signal,
                    });

                    if (!retryRes.ok) {
                        throw new Error(`Retry failed with status ${retryRes.status}`);
                    }

                    const retryJson = await retryRes.json();
                    return { success: true, data: extractHazardPayload(retryJson) };
                } finally {
                    clearTimeout(retryTimeout);
                }
            }

            if (!res.ok) {
                throw new Error(`Assessment endpoint responded with status ${res.status}`);
            }

            const json = await res.json();
            return { success: true, data: extractHazardPayload(json) };

        } catch (innerError: any) {
            if (innerError.name === 'AbortError') {
                throw new Error('GeoRisk Assessment endpoint timed out.');
            }
            throw innerError;
        } finally {
            clearTimeout(timeout);
        }

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An unexpected error occurred while communicating with GeoRisk API.',
        };
    }
}