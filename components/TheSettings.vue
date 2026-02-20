<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { X, Plus, Trash2 } from 'lucide-vue-next';

const {
    themes,
    themeId,
    isSettingsOpen,
    badges,
    currentTheme
} = useEditorState();

const newBadge = ref('');

const addBadge = () => {
    if (newBadge.value.trim()) {
        badges.value.push(newBadge.value.trim());
        newBadge.value = '';
    }
};

const removeBadge = (index: number) => {
    badges.value.splice(index, 1);
};

// Helper for pill styles
const getPillStyle = (theme: any, isActive: boolean) => ({
    background: isActive ? theme.pillActive.bg : theme.pill.bg,
    borderColor: isActive ? theme.pillActive.border : theme.pill.border,
    color: isActive ? theme.pillActive.text : theme.pill.text
});
</script>

<template>
    <div v-if="isSettingsOpen" class="settings-panel" @mousedown.stop @wheel.stop>
        <div class="header">
            <h3>Settings</h3>
            <button class="close-btn" @click="isSettingsOpen = false" aria-label="Close settings">
                <X :size="16" />
            </button>
        </div>

        <div class="section">
            <label>Theme</label>
            <div class="theme-grid">
                <button v-for="theme in themes" :key="theme.id" class="theme-pill"
                    :style="getPillStyle(theme, themeId === theme.id)" @click="themeId = theme.id"
                    :aria-label="`Select theme ${theme.label}`" :aria-pressed="themeId === theme.id">
                    {{ theme.label }}
                </button>
            </div>
        </div>

        <div class="section">
            <label>Tags</label>
            <div class="tags-list">
                <div v-for="(badge, i) in badges" :key="i" class="tag-item">
                    <span>{{ badge }}</span>
                    <button class="delete-tag" @click="removeBadge(i)" :aria-label="`Delete tag ${badge}`">
                        <Trash2 :size="12" />
                    </button>
                </div>
            </div>
            <div class="add-tag">
                <input v-model="newBadge" placeholder="New Tag..." @keyup.enter="addBadge" />
                <button class="add-btn" @click="addBadge" :disabled="!newBadge.trim()" aria-label="Add tag">
                    <Plus :size="14" />
                </button>
            </div>
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

.section {
    margin-bottom: 24px;
}

.section:last-child {
    margin-bottom: 0;
}

label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.theme-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.theme-pill {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.05em;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.2s ease;
    text-align: center;
    background: transparent;
}

.theme-pill:hover {
    transform: translateY(-1px);
}

.theme-pill:focus-visible {
    outline: 2px solid #007AFF;
    outline-offset: 2px;
}

/* Tags */
.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.tag-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: #ddd;
}

.delete-tag {
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
}

.delete-tag:hover {
    color: #FF453A;
    background: rgba(255, 69, 58, 0.1);
}

.delete-tag:focus-visible {
    outline: 2px solid #FF453A;
    outline-offset: 1px;
    border-radius: 4px;
}

.add-tag {
    display: flex;
    gap: 8px;
}

.add-tag input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 12px;
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s;
}

.add-tag input:focus {
    border-color: #007AFF;
}

.add-btn:focus-visible {
    outline: 2px solid #007AFF;
    outline-offset: 2px;
}

.add-btn {
    width: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #007AFF;
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s;
}

.add-btn:hover:not(:disabled) {
    background: #006ADC;
}

.add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
