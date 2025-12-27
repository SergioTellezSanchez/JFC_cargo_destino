import { auth } from './firebase';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`API Error [${res.status}] ${url}:`, errorData);
    }

    return res;
}
