<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useDiagramStore } from '~/composables/useDiagramStore';
import { useShareState } from '~/composables/useShareState';
import { useWindowSize, useLocalStorage, useDebounceFn } from '@vueuse/core';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next';

// Components
import TheToolbar from '~/components/TheToolbar.vue';
import TheEditor from '~/components/TheEditor.vue';
import ThePreview from '~/components/ThePreview.vue';
import TheShareModal from '~/components/TheShareModal.vue';
import TheWelcome from '~/components/TheWelcome.vue';
import TheKeyboardShortcuts from '~/components/TheKeyboardShortcuts.vue';
import TheDiagramSidebar from '~/components/TheDiagramSidebar.vue';

const { width } = useWindowSize();
const { currentTheme, isInfoOpen, isWelcomeOpen, isShortcutsOpen } = useEditorState();
const { isSidebarOpen } = useDiagramStore();
const { loadFromUrl, syncToUrl } = useShareState();

const previewRef = ref<InstanceType<typeof ThePreview> | null>(null);

// Loading state
const isLoaded = ref(false);

// Split Pane Logic
const splitPosition = useLocalStorage('graphlet-split', 40);
const isDragging = ref(false);

// Pane collapse: null = split view, 'editor' = editor hidden, 'preview' = preview hidden
const collapsedPane = ref<null | 'editor' | 'preview'>(null);

const editorWidth = computed(() => {
    if (collapsedPane.value === 'editor') return 0;
    if (collapsedPane.value === 'preview') return 100;
    return splitPosition.value;
});

// '<' moves the divider left: collapse editor, or restore a collapsed preview
const nudgeLeft = () => {
    collapsedPane.value = collapsedPane.value === 'preview' ? null : 'editor';
};

// '>' moves the divider right: collapse preview, or restore a collapsed editor
const nudgeRight = () => {
    collapsedPane.value = collapsedPane.value === 'editor' ? null : 'preview';
};

// Mobile: full-screen preview with a collapsible code drawer
const isMobile = computed(() => width.value < 768);
const isCodeOpen = ref(false);

const startDrag = () => {
    if (isMobile.value) return;
    isDragging.value = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return;
    // Dragging restores the split view from a collapsed state
    if (collapsedPane.value) collapsedPane.value = null;
    const percentage = (e.clientX / width.value) * 100;
    splitPosition.value = Math.min(Math.max(percentage, 20), 80);
};

const stopDrag = () => {
    isDragging.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

// Global keyboard shortcuts
const handleGlobalShortcuts = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    const target = e.target as HTMLElement | null;
    const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (mod && e.code === 'Slash' && !isInput) {
        e.preventDefault();
        isShortcutsOpen.value = !isShortcutsOpen.value;
    }
    if (mod && e.code === 'Comma' && !isInput) {
        e.preventDefault();
        isInfoOpen.value = !isInfoOpen.value;
    }
    if (e.altKey && e.code === 'KeyN' && !isInput) {
        e.preventDefault();
        isWelcomeOpen.value = true;
    }
    if (e.shiftKey && e.code === 'Digit1' && !isInput) {
        e.preventDefault();
        previewRef.value?.fitToScreen?.();
    }
    if (mod && e.code === 'Backslash' && !isInput) {
        e.preventDefault();
        isSidebarOpen.value = !isSidebarOpen.value;
    }
};

onMounted(() => {
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('keydown', handleGlobalShortcuts);

    // Load state from URL if ?state= param is present
    loadFromUrl();

    // Auto-sync state to URL
    const { code, themeId, title, eyebrow, badges } = useEditorState();
    const debouncedSync = useDebounceFn(() => {
        syncToUrl();
    }, 1000);

    watch([code, themeId, title, eyebrow, badges], () => {
        debouncedSync();
    }, { deep: true });

    // Mark as loaded after a brief delay (allows splash to show)
    setTimeout(() => {
        isLoaded.value = true;
    }, 100);
});

onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('keydown', handleGlobalShortcuts);
});
</script>

<template>
    <!-- Loading Splash -->
    <Transition name="splash">
        <div v-if="!isLoaded" class="splash-screen">
            <div class="splash-content">
                <span class="splash-logo">Graphlet</span>
                <div class="splash-loader"></div>
            </div>
        </div>
    </Transition>

    <div class="app-layout" :class="{ loaded: isLoaded }">
        <!-- Toolbar -->
        <header class="header">
            <TheToolbar />
        </header>

        <!-- Mobile Code Drawer Bar -->
        <div v-if="isMobile" class="code-drawer-bar" @click="isCodeOpen = !isCodeOpen">
            <button class="code-drawer-toggle" :class="{ open: isCodeOpen }" aria-label="Toggle code editor"
                :aria-expanded="isCodeOpen">
                <ChevronDown :size="20" />
            </button>
            <span class="code-drawer-label">Code</span>
        </div>

        <!-- Body: Sidebar + Main Content -->
        <div class="body-layout">
            <!-- Sidebar -->
            <TheDiagramSidebar />

            <!-- Main Content -->
            <main class="main-content" :class="{ mobile: isMobile, dragging: isDragging }">
                <!-- Desktop: side by side -->
                <template v-if="!isMobile">
                    <div class="pane editor-pane" :style="{ width: `${editorWidth}%` }">
                        <TheEditor />
                    </div>
                    <div class="resizer" :class="{
                        collapsed: collapsedPane,
                        'collapsed-left': collapsedPane === 'editor',
                        'collapsed-right': collapsedPane === 'preview'
                    }" @mousedown="startDrag">
                        <div class="resizer-handle" @mousedown.stop>
                            <!-- Editor collapsed: restore it -->
                            <button v-if="collapsedPane === 'editor'" class="resizer-btn restore-btn"
                                title="Show code" @click="nudgeRight">
                                <ChevronRight :size="14" />
                                <span class="resizer-label">Code</span>
                            </button>
                            <!-- Preview collapsed: restore it -->
                            <button v-else-if="collapsedPane === 'preview'" class="resizer-btn restore-btn"
                                title="Show preview" @click="nudgeLeft">
                                <ChevronLeft :size="14" />
                                <span class="resizer-label">Preview</span>
                            </button>
                            <!-- Split view: collapse either side -->
                            <template v-else>
                                <button class="resizer-btn" title="Collapse editor" @click="nudgeLeft">
                                    <ChevronLeft :size="14" />
                                </button>
                                <button class="resizer-btn" title="Collapse preview" @click="nudgeRight">
                                    <ChevronRight :size="14" />
                                </button>
                            </template>
                        </div>
                    </div>
                    <div class="pane preview-pane" :style="{ width: `${100 - editorWidth}%` }">
                        <ThePreview ref="previewRef" />
                    </div>
                </template>

                <!-- Mobile: preview with collapsible editor drawer -->
                <template v-else>
                    <div v-show="isCodeOpen" class="pane mobile-editor-pane">
                        <TheEditor />
                    </div>
                    <div class="pane mobile-pane">
                        <ThePreview ref="previewRef" />
                    </div>
                </template>
            </main>
        </div>

        <!-- Modals -->
        <TheShareModal />
        <TheWelcome />
        <TheKeyboardShortcuts />
    </div>
</template>

<style scoped>
/* Splash Screen */
.splash-screen {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background-color: #13131f;
    display: flex;
    align-items: center;
    justify-content: center;
}

.splash-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}

.splash-logo {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 32px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: -0.03em;
}

.splash-loader {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: #007AFF;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.splash-enter-active,
.splash-leave-active {
    transition: opacity 0.4s ease;
}

.splash-leave-to {
    opacity: 0;
}

/* App Layout */
.app-layout {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: #13131f;
    color: #f0eeff;
    opacity: 0;
    transition: opacity 0.3s ease 0.1s;
}

.app-layout.loaded {
    opacity: 1;
}

.header {
    flex-shrink: 0;
    z-index: 20;
}

/* Body: sidebar + main */
.body-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
}

.main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
}

.main-content.mobile {
    flex-direction: column;
}

.pane {
    height: 100%;
    overflow: hidden;
    position: relative;
}

/* Smooth pane collapse/expand (disabled while dragging the divider) */
.main-content:not(.mobile):not(.dragging) .pane {
    transition: width 0.25s ease;
}

.mobile-pane {
    width: 100% !important;
    flex: 1;
}

.mobile-editor-pane {
    width: 100% !important;
    height: 45%;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.editor-pane {
    overflow: hidden;
}

.resizer {
    width: 4px;
    background: rgba(255, 255, 255, 0.05);
    cursor: col-resize;
    z-index: 10;
    transition: background 0.2s;
    flex-shrink: 0;
    margin-left: -2px;
    margin-right: -2px;
    position: relative;
}

.resizer:hover,
.resizer:active {
    background: #007AFF;
}

/* Collapse handle on the divider */
.resizer-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    background: #16162a;
    border: 1px solid rgba(139, 122, 255, 0.7);
    border-radius: 12px;
    box-shadow: 0 0 0 3px rgba(139, 122, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 11;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
}

.resizer:hover .resizer-handle,
.resizer.collapsed .resizer-handle {
    opacity: 1;
    pointer-events: auto;
}

/* When a pane is collapsed the divider sits at the screen edge —
   anchor the handle inward so it isn't clipped by overflow:hidden */
.resizer.collapsed-left .resizer-handle {
    left: 8px;
    transform: translateY(-50%);
}

.resizer.collapsed-right .resizer-handle {
    left: auto;
    right: 8px;
    transform: translateY(-50%);
}

.resizer-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    background: none;
    border: none;
    border-radius: 8px;
    color: rgba(240, 238, 255, 0.7);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.resizer-btn:hover {
    background: rgba(139, 122, 255, 0.2);
    color: #fff;
}

/* Vertical edge tab shown when a pane is collapsed */
.resizer-btn.restore-btn {
    width: 28px;
    height: auto;
    flex-direction: column;
    gap: 8px;
    padding: 10px 0;
}

.resizer-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    margin-bottom: -0.25em;
    writing-mode: vertical-rl;
    color: rgba(170, 165, 210, 0.85);
    transition: color 0.15s;
    user-select: none;
}

.resizer-btn:hover .resizer-label {
    color: #fff;
}

.preview-pane {
    overflow: hidden;
}

/* Mobile Code Drawer Bar */
.code-drawer-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.code-drawer-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: rgba(139, 122, 255, 0.06);
    border: 2px solid rgba(139, 122, 255, 0.8);
    border-radius: 14px;
    box-shadow: 0 0 0 4px rgba(139, 122, 255, 0.12);
    color: #cfc8ff;
    cursor: pointer;
    flex-shrink: 0;
}

.code-drawer-toggle svg {
    transition: transform 0.25s ease;
}

.code-drawer-toggle.open svg {
    transform: rotate(180deg);
}

.code-drawer-label {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    color: rgba(170, 165, 210, 0.75);
    user-select: none;
}
</style>
