<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { X } from 'lucide-vue-next';

const {
    themes,
    themeId,
    isInfoOpen,
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
    <div v-if="isInfoOpen" class="settings-panel">
        <div class="header">
            <h3>Information</h3>
            <button class="close-btn" @click="isInfoOpen = false" aria-label="Close information">
                <X :size="16" />
            </button>
        </div>

        <div class="info-links">
            <a href="/privacy.html" class="info-link" @click="isInfoOpen = false">Privacy Policy</a>
            <a href="/terms.html" class="info-link" @click="isInfoOpen = false">Terms & Conditions</a>
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

.info-links {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-link {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.2s;
    display: inline-block;
}

.info-link:hover {
    color: #fff;
}
</style>
