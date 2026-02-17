
import { useRefHistory, useLocalStorage } from '@vueuse/core';
import { THEMES, DEFAULT_THEME } from '~/config/themes';

const DEFAULT_CODE = `sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>+Frontend: Login Request
    Frontend->>+Backend: Authenticate User
    Backend->>+Database: Query User Data
    Database-->>-Backend: Return User Info
    Backend-->>-Frontend: Authentication Result
    Frontend-->>-User: Login Response

    Note over Frontend,Backend: Secure JWT Token Exchange
    Note over Backend,Database: Encrypted Communication`;

// Global State (Singleton)
const code = useLocalStorage('graphlet-code', DEFAULT_CODE);
const themeId = useLocalStorage('graphlet-theme', DEFAULT_THEME);
const title = useLocalStorage('graphlet-title', 'Authentication Flow');
const eyebrow = useLocalStorage('graphlet-eyebrow', 'Sequence Flow');
const badges = useLocalStorage('graphlet-badges', ['JWT', 'TLS']);
const isSettingsOpen = ref(false);
const isShareOpen = ref(false);
const currentSvg = ref<string>('');
const { history, undo, redo } = useRefHistory(code);

export const useEditorState = () => {
    // Derived inside composable to be reactive to state changes
    const currentTheme = computed(() => {
        return THEMES.find(t => t.id === themeId.value) || THEMES[0];
    });

    return {
        code,
        themeId,
        title,
        eyebrow,
        badges,
        currentSvg,
        currentTheme,
        themes: THEMES,
        undo,
        redo,
        isSettingsOpen,
        isShareOpen
    };
};
