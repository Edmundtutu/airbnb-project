const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const apiVersion = (import.meta.env.VITE_API_VERSION || '').replace(/^\/+|\/+$/g, '');

export const SubscriberService = {
    async subscribe(email: string): Promise<void> {
        const url = `${baseUrl}/${apiVersion}/subscribe`;

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            let data: unknown = null;
            try {
                data = await response.json();
            } catch {
                // ignore non-JSON bodies
            }
            const error: any = new Error(`Subscribe failed (${response.status})`);
            error.status = response.status;
            error.data = data;
            throw error;
        }
    }
}