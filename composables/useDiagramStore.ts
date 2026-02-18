import { useLocalStorage, useDebounceFn } from '@vueuse/core';
import { useEditorState } from './useEditorState';
import { DEFAULT_THEME } from '~/config/themes';

// ─── Types ───────────────────────────────────────────────────────────
export interface SavedDiagram {
    id: string;
    title: string;
    code: string;
    themeId: string;
    eyebrow: string;
    badges: string[];
    createdAt: number;
    updatedAt: number;
}

// ─── Diagram Type Detection ──────────────────────────────────────────
import {
    Workflow,
    ArrowLeftRight,
    Box,
    CircleDot,
    Database,
    Calendar,
    PieChart,
    Network,
    GitBranch,
    Clock,
    Map,
    LayoutTemplate,
    FileText
} from 'lucide-vue-next';

// ─── Diagram Type Detection ──────────────────────────────────────────
const DIAGRAM_TYPE_MAP: Record<string, { icon: any; label: string }> = {
    flowchart: { icon: Workflow, label: 'Flowchart' },
    graph: { icon: Workflow, label: 'Flowchart' },
    sequencediagram: { icon: ArrowLeftRight, label: 'Sequence' },
    classdiagram: { icon: Box, label: 'Class' },
    statediagram: { icon: CircleDot, label: 'State' },
    'statediagram-v2': { icon: CircleDot, label: 'State' },
    erdiagram: { icon: Database, label: 'ER Diagram' },
    gantt: { icon: Calendar, label: 'Gantt' },
    pie: { icon: PieChart, label: 'Pie Chart' },
    mindmap: { icon: Network, label: 'Mind Map' },
    gitgraph: { icon: GitBranch, label: 'Git Graph' },
    timeline: { icon: Clock, label: 'Timeline' },
    journey: { icon: Map, label: 'Journey' },
    c4context: { icon: LayoutTemplate, label: 'C4 Diagram' },
};

export const getDiagramType = (code: string): { icon: any; label: string } => {
    const firstLine = code.trim().split('\n')[0]?.trim().toLowerCase() || '';
    // Match the first word/keyword
    const keyword = firstLine.split(/[\s{(]/)[0] || '';
    return DIAGRAM_TYPE_MAP[keyword] || { icon: FileText, label: 'Diagram' };
};

// ─── Singleton State ─────────────────────────────────────────────────
const diagrams = useLocalStorage<SavedDiagram[]>('graphlet-diagrams', []);
const activeId = useLocalStorage<string>('graphlet-active-id', '');
const isSidebarOpen = ref(false);
let migrated = false;

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
};

// ─── Migration from legacy keys ──────────────────────────────────────
const safeParse = <T>(raw: string | null, fallback: T): T => {
    if (raw === null) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        // If it's not valid JSON, return raw string as-is for string types
        return raw as unknown as T;
    }
};

const migrateIfNeeded = () => {
    if (migrated) return;
    migrated = true;

    // Already migrated
    if (diagrams.value.length > 0) return;

    // Only run in browser
    if (typeof window === 'undefined') return;

    // Read legacy keys (these may or may not exist)
    const legacyCode = localStorage.getItem('graphlet-code');
    const legacyTheme = localStorage.getItem('graphlet-theme');
    const legacyTitle = localStorage.getItem('graphlet-title');
    const legacyEyebrow = localStorage.getItem('graphlet-eyebrow');
    const legacyBadges = localStorage.getItem('graphlet-badges');

    const now = Date.now();
    const firstDiagram: SavedDiagram = {
        id: generateId(),
        title: safeParse(legacyTitle, 'Getting Started'),
        code: safeParse(legacyCode, ''),
        themeId: safeParse(legacyTheme, DEFAULT_THEME),
        eyebrow: safeParse(legacyEyebrow, 'Welcome'),
        badges: safeParse<string[]>(legacyBadges, ['Graphlet', 'Mermaid']),
        createdAt: now,
        updatedAt: now,
    };

    diagrams.value = [firstDiagram];
    activeId.value = firstDiagram.id;
};

// ─── Composable ──────────────────────────────────────────────────────
export const useDiagramStore = () => {
    const editorState = useEditorState();

    // Run migration on first use
    migrateIfNeeded();

    // Active diagram computed
    const activeDiagram = computed(() =>
        diagrams.value.find(d => d.id === activeId.value) || diagrams.value[0] || null
    );

    // Auto-save: sync editor state → active diagram (debounced)
    const autoSave = useDebounceFn(() => {
        if (!activeId.value) return;
        const idx = diagrams.value.findIndex(d => d.id === activeId.value);
        if (idx === -1) return;

        const existing = diagrams.value[idx];
        if (!existing) return;

        const updated: SavedDiagram = {
            ...existing,
            code: editorState.code.value,
            title: editorState.title.value,
            eyebrow: editorState.eyebrow.value,
            badges: [...editorState.badges.value],
            themeId: editorState.themeId.value,
            updatedAt: Date.now(),
        };

        // Only write if something actually changed
        if (
            existing.code !== updated.code ||
            existing.title !== updated.title ||
            existing.eyebrow !== updated.eyebrow ||
            existing.themeId !== updated.themeId ||
            JSON.stringify(existing.badges) !== JSON.stringify(updated.badges)
        ) {
            const copy = [...diagrams.value];
            copy[idx] = updated;
            diagrams.value = copy;
        }
    }, 1000);

    // Watch editor state changes for auto-save
    watch(
        [editorState.code, editorState.title, editorState.eyebrow, editorState.badges, editorState.themeId],
        () => { autoSave(); },
        { deep: true }
    );

    // Load a diagram into the editor
    const loadDiagramIntoEditor = (diagram: SavedDiagram) => {
        editorState.code.value = diagram.code;
        editorState.title.value = diagram.title;
        editorState.eyebrow.value = diagram.eyebrow;
        editorState.badges.value = [...diagram.badges];
        editorState.themeId.value = diagram.themeId;
    };

    // Switch to a diagram
    const switchDiagram = (id: string) => {
        if (id === activeId.value) return;

        // Force an immediate save of current state
        autoSave();

        const target = diagrams.value.find(d => d.id === id);
        if (!target) return;

        activeId.value = id;
        loadDiagramIntoEditor(target);
    };

    // Create a new blank diagram
    const createDiagram = (opts?: { code?: string; title?: string; eyebrow?: string; badges?: string[] }) => {
        // Save current first
        autoSave();

        const now = Date.now();
        const newDiagram: SavedDiagram = {
            id: generateId(),
            title: opts?.title || 'Untitled',
            code: opts?.code || '',
            themeId: editorState.themeId.value, // inherit current theme
            eyebrow: opts?.eyebrow || '',
            badges: opts?.badges || [],
            createdAt: now,
            updatedAt: now,
        };

        diagrams.value = [newDiagram, ...diagrams.value];
        activeId.value = newDiagram.id;
        loadDiagramIntoEditor(newDiagram);

        return newDiagram.id;
    };

    // Delete a diagram
    const deleteDiagram = (id: string) => {
        const idx = diagrams.value.findIndex(d => d.id === id);
        if (idx === -1) return;

        const copy = [...diagrams.value];
        copy.splice(idx, 1);
        diagrams.value = copy;

        // If we deleted the active one, switch to the nearest
        if (id === activeId.value) {
            const next = diagrams.value[Math.min(idx, diagrams.value.length - 1)];
            if (next) {
                activeId.value = next.id;
                loadDiagramIntoEditor(next);
            } else {
                // All deleted — create a fresh one
                createDiagram({ title: 'Untitled' });
            }
        }
    };

    // Rename a diagram
    const renameDiagram = (id: string, newTitle: string) => {
        const idx = diagrams.value.findIndex(d => d.id === id);
        if (idx === -1) return;

        const copy = [...diagrams.value];
        const entry = copy[idx];
        if (!entry) return;
        copy[idx] = { ...entry, title: newTitle.trim() || 'Untitled', updatedAt: Date.now() };
        diagrams.value = copy;

        // If renaming the active one, also sync the editor title
        if (id === activeId.value) {
            editorState.title.value = copy[idx]!.title;
        }
    };

    // Sorted diagrams (most recently updated first)
    const sortedDiagrams = computed(() =>
        [...diagrams.value].sort((a, b) => b.updatedAt - a.updatedAt)
    );

    return {
        diagrams: sortedDiagrams,
        activeId: readonly(activeId),
        activeDiagram,
        isSidebarOpen,
        switchDiagram,
        createDiagram,
        deleteDiagram,
        renameDiagram,
        getDiagramType,
    };
};
