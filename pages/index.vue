<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useShareState } from '~/composables/useShareState';
import { useWindowSize, useLocalStorage } from '@vueuse/core';
import { Code2, Eye } from 'lucide-vue-next';

// Components
import TheToolbar from '~/components/TheToolbar.vue';
import TheEditor from '~/components/TheEditor.vue';
import ThePreview from '~/components/ThePreview.vue';
import TheShareModal from '~/components/TheShareModal.vue';

const { width } = useWindowSize();
const { currentTheme } = useEditorState();
const { loadFromUrl } = useShareState();

const isMobile = computed(() => width.value < 768);
// 'editor' | 'preview'
const mobilePanel = ref<'editor' | 'preview'>('editor');

// Split Pane Logic
const splitPosition = useLocalStorage('graphlet-split', 40); // Persistent split
const isDragging = ref(false);

const startDrag = () => {
    isDragging.value = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return;
    const percentage = (e.clientX / width.value) * 100;
    // Clamp
    splitPosition.value = Math.min(Math.max(percentage, 20), 80);
};

const stopDrag = () => {
    isDragging.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

onMounted(() => {
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);

    // Load state from URL if ?state= param is present
    loadFromUrl();
});

onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
    <div class="app-layout">
        <!-- Toolbar -->
        <header class="header">
            <TheToolbar />
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Left: Editor -->
            <div class="pane editor-pane"
                :style="isMobile ? {} : { width: `${splitPosition}%` }"
                :class="{ 'mobile-hidden': isMobile && mobilePanel !== 'editor' }">
                <TheEditor />
            </div>

            <!-- Resizer (desktop only) -->
            <div v-if="!isMobile" class="resizer" @mousedown="startDrag"></div>

            <!-- Right: Preview -->
            <div class="pane preview-pane"
                :style="isMobile ? {} : { width: `${100 - splitPosition}%` }"
                :class="{ 'mobile-hidden': isMobile && mobilePanel !== 'preview' }">
                <ThePreview />
            </div>

            <!-- Mobile Panel Toggle -->
            <div v-if="isMobile" class="mobile-toggle">
                <button
                    :class="['toggle-btn', { active: mobilePanel === 'editor' }]"
                    @click="mobilePanel = 'editor'">
                    <Code2 :size="14" />
                    Code
                </button>
                <button
                    :class="['toggle-btn', { active: mobilePanel === 'preview' }]"
                    @click="mobilePanel = 'preview'">
                    <Eye :size="14" />
                    Preview
                </button>
            </div>
        </main>

        <!-- Share Modal -->
        <TheShareModal />
    </div>
</template>

<style scoped>
.app-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #13131f;
    color: #f0eeff;
    transition: background var(--transition-smooth);
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

.pane {
    height: 100%;
    overflow: hidden;
    position: relative;
}

.editor-pane {
    /* Monaco needs a container that doesn't inadvertently scroll */
    overflow: hidden;
}

.resizer {
    width: 4px;
    /* Grabbable area */
    background: rgba(255, 255, 255, 0.05);
    cursor: col-resize;
    z-index: 10;
    transition: background 0.2s;
    flex-shrink: 0;
    margin-left: -2px;
    /* Overlap slightly for aesthetics */
    margin-right: -2px;
    position: relative;
}

.resizer:hover,
.resizer:active {
    background: #007AFF;
}

.preview-pane {
    /* background handled by component */
    overflow: hidden;
}

/* Mobile */
.mobile-hidden {
    display: none;
}

@media (max-width: 767px) {
    .pane {
        width: 100% !important;
    }

    .mobile-toggle {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 30;
        display: flex;
        gap: 2px;
        background: rgba(19, 19, 31, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 100px;
        padding: 4px;
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 16px;
        border-radius: 100px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.45);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .toggle-btn.active {
        background: #007AFF;
        color: #fff;
    }
}
</style>
