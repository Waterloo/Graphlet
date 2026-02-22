<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { X } from 'lucide-vue-next';

const {
    themes,
    themeId,
    isSettingsOpen,
    badges,
    currentTheme
} = useEditorState();

// Helper for pill styles
const getPillStyle = (theme: any, isActive: boolean) => ({
    background: isActive ? theme.pillActive.bg : theme.pill.bg,
    borderColor: isActive ? theme.pillActive.border : theme.pill.border,
    color: isActive ? theme.pillActive.text : theme.pill.text
});
</script>

<template>
    <div v-if="isSettingsOpen" class="settings-panel">
        <div class="header">
            <h3>Settings</h3>
            <button class="close-btn" @click="isSettingsOpen = false" aria-label="Close settings">
                <X :size="16" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.settings-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 280px;
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
    z-index: 100;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
}

.close-btn {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.close-btn:focus-visible {
    outline: 2px solid #007AFF;
    outline-offset: 2px;
}
</style>
