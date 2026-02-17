<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useWindowSize, useLocalStorage } from '@vueuse/core';

// Components
import TheToolbar from '~/components/TheToolbar.vue';
import TheEditor from '~/components/TheEditor.vue';
import ThePreview from '~/components/ThePreview.vue';

const { width } = useWindowSize();
const { currentTheme } = useEditorState();

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
            <div class="pane editor-pane" :style="{ width: `${splitPosition}%` }">
                <TheEditor />
            </div>

            <!-- Resizer -->
            <div class="resizer" @mousedown="startDrag"></div>

            <!-- Right: Preview -->
            <div class="pane preview-pane" :style="{ width: `${100 - splitPosition}%` }">
                <ThePreview />
            </div>
        </main>
    </div>
</template>

<style>
/* Global overrides/utilities */
html,
body,
#__nuxt {
    height: 100%;
    margin: 0;
    overflow: hidden;
    /* App-like feel */
    background-color: var(--surface-base);
}

.pane {
    height: 100%;
    overflow: hidden;
    position: relative;
    /* transition: width 0.1s linear; actually no transition for split pane usually */
}
</style>

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
</style>
