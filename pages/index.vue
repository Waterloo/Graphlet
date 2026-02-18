<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useShareState } from '~/composables/useShareState';
import { useWindowSize, useLocalStorage } from '@vueuse/core';

// Components
import TheToolbar from '~/components/TheToolbar.vue';
import TheEditor from '~/components/TheEditor.vue';
import ThePreview from '~/components/ThePreview.vue';
import TheShareModal from '~/components/TheShareModal.vue';
import TheWelcome from '~/components/TheWelcome.vue';
import TheKeyboardShortcuts from '~/components/TheKeyboardShortcuts.vue';

const { width } = useWindowSize();
const { currentTheme, isSettingsOpen, isWelcomeOpen, isShortcutsOpen } = useEditorState();
const { loadFromUrl } = useShareState();

const previewRef = ref<InstanceType<typeof ThePreview> | null>(null);

// Loading state
const isLoaded = ref(false);

// Split Pane Logic
const splitPosition = useLocalStorage('graphlet-split', 40);
const isDragging = ref(false);

// Mobile: stacked layout with tab toggle
const isMobile = computed(() => width.value < 768);
const mobileTab = ref<'editor' | 'preview'>('editor');

const startDrag = () => {
    if (isMobile.value) return;
    isDragging.value = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return;
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

    if (mod && e.key === '/') {
        e.preventDefault();
        isShortcutsOpen.value = !isShortcutsOpen.value;
    }
    if (mod && e.key === ',') {
        e.preventDefault();
        isSettingsOpen.value = !isSettingsOpen.value;
    }
    if (mod && e.key === 'n') {
        e.preventDefault();
        isWelcomeOpen.value = true;
    }
    if (mod && e.key === '0') {
        e.preventDefault();
        previewRef.value?.fitToScreen?.();
    }
};

onMounted(() => {
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('keydown', handleGlobalShortcuts);

    // Load state from URL if ?state= param is present
    loadFromUrl();

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

        <!-- Mobile Tab Bar -->
        <div v-if="isMobile" class="mobile-tabs">
            <button :class="{ active: mobileTab === 'editor' }" @click="mobileTab = 'editor'">
                Editor
            </button>
            <button :class="{ active: mobileTab === 'preview' }" @click="mobileTab = 'preview'">
                Preview
            </button>
        </div>

        <!-- Main Content -->
        <main class="main-content" :class="{ mobile: isMobile }">
            <!-- Desktop: side by side -->
            <template v-if="!isMobile">
                <div class="pane editor-pane" :style="{ width: `${splitPosition}%` }">
                    <TheEditor />
                </div>
                <div class="resizer" @mousedown="startDrag"></div>
                <div class="pane preview-pane" :style="{ width: `${100 - splitPosition}%` }">
                    <ThePreview ref="previewRef" />
                </div>
            </template>

            <!-- Mobile: stacked with tab switch -->
            <template v-else>
                <div v-show="mobileTab === 'editor'" class="pane mobile-pane">
                    <TheEditor />
                </div>
                <div v-show="mobileTab === 'preview'" class="pane mobile-pane">
                    <ThePreview ref="previewRef" />
                </div>
            </template>
        </main>

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
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #13131f;
    color: #f0eeff;
    transition: background var(--transition-smooth);
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

.mobile-pane {
    width: 100% !important;
    flex: 1;
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

.preview-pane {
    overflow: hidden;
}

/* Mobile Tab Bar */
.mobile-tabs {
    display: flex;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
}

.mobile-tabs button {
    flex: 1;
    padding: 10px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.mobile-tabs button.active {
    color: #fff;
}

.mobile-tabs button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    background: #007AFF;
    border-radius: 2px 2px 0 0;
}
</style>
