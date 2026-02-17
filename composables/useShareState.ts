import pako from 'pako';
import { useEditorState } from '~/composables/useEditorState';

interface SharePayload {
    code: string;
    themeId: string;
    title: string;
    eyebrow: string;
    badges: string[];
}

// Encode state to URL-safe Base64
const encodeState = (payload: SharePayload): string => {
    const json = JSON.stringify(payload);
    const compressed = pako.deflate(json);
    // Convert Uint8Array to base64url
    const base64 = btoa(String.fromCharCode(...compressed))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return base64;
};

// Decode URL-safe Base64 back to state
const decodeState = (encoded: string): SharePayload | null => {
    try {
        // Restore standard base64
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        // Pad if needed
        while (base64.length % 4) base64 += '=';

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const json = pako.inflate(bytes, { to: 'string' });
        return JSON.parse(json) as SharePayload;
    } catch (e) {
        console.error('Failed to decode share state:', e);
        return null;
    }
};

export const useShareState = () => {
    const { code, themeId, title, eyebrow, badges } = useEditorState();

    const getPayload = (): SharePayload => ({
        code: code.value,
        themeId: themeId.value,
        title: title.value,
        eyebrow: eyebrow.value,
        badges: badges.value,
    });

    const getShareUrl = (): string => {
        const encoded = encodeState(getPayload());
        return `${window.location.origin}?state=${encoded}`;
    };

    const getEmbedUrl = (): string => {
        const encoded = encodeState(getPayload());
        return `${window.location.origin}/embed?state=${encoded}`;
    };

    const getEmbedHtml = (): string => {
        const url = getEmbedUrl();
        return `<iframe src="${url}" width="100%" height="500" style="border:none;border-radius:12px;" allowfullscreen></iframe>`;
    };

    const loadFromUrl = (): boolean => {
        const route = useRoute();
        const stateParam = route.query.state as string | undefined;
        if (!stateParam) return false;

        const payload = decodeState(stateParam);
        if (!payload) return false;

        code.value = payload.code;
        themeId.value = payload.themeId;
        title.value = payload.title;
        eyebrow.value = payload.eyebrow;
        badges.value = payload.badges;
        return true;
    };

    return {
        encodeState,
        decodeState,
        getShareUrl,
        getEmbedUrl,
        getEmbedHtml,
        loadFromUrl,
    };
};
