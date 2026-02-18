<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { X } from 'lucide-vue-next';

const { isShortcutsOpen } = useEditorState();

const isMac = computed(() => {
    if (import.meta.client) {
        return navigator.platform.toUpperCase().includes('MAC');
    }
    return false;
});
const mod = computed(() => isMac.value ? '⌘' : 'Ctrl');

const shortcuts = computed(() => [
    { action: 'Undo', keys: `${mod.value}Z` },
    { action: 'Redo', keys: `${mod.value}⇧Z` },
    { action: 'Zoom In', keys: `${mod.value}+` },
    { action: 'Zoom Out', keys: `${mod.value}−` },
    { action: 'Fit to Screen', keys: `${mod.value}0` },
    { action: 'Toggle Settings', keys: `${mod.value},` },
    { action: 'New / Templates', keys: `${mod.value}N` },
    { action: 'Toggle Diagrams', keys: `${mod.value}B` },
    { action: 'Show Shortcuts', keys: `${mod.value}/` },
    { action: 'Close Modal', keys: 'Esc' },
]);

const dismiss = () => {
    isShortcutsOpen.value = false;
};

// Close on Escape
onMounted(() => {
    const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isShortcutsOpen.value) {
            dismiss();
        }
    };
    window.addEventListener('keydown', handler);
    onUnmounted(() => window.removeEventListener('keydown', handler));
});
</script>

<template>
    <Teleport to="body">
        <Transition name="shortcuts">
            <div v-if="isShortcutsOpen" class="shortcuts-backdrop" @click.self="dismiss">
                <div class="shortcuts-modal">
                    <div class="header">
                        <h3>Keyboard Shortcuts</h3>
                        <button class="close-btn" @click="dismiss" aria-label="Close shortcuts">
                            <X :size="16" />
                        </button>
                    </div>

                    <div class="shortcuts-list">
                        <div v-for="s in shortcuts" :key="s.action" class="shortcut-row">
                            <span class="shortcut-action">{{ s.action }}</span>
                            <kbd class="shortcut-keys">{{ s.keys }}</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.shortcuts-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
    padding: 24px;
}

.shortcuts-modal {
    width: 100%;
    max-width: 380px;
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 16px 60px rgba(0, 0, 0, 0.5);
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

h3 {
    margin: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
}

.close-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
}

.shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.shortcut-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.15s;
}

.shortcut-row:hover {
    background: rgba(255, 255, 255, 0.04);
}

.shortcut-action {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
}

.shortcut-keys {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
}

/* Transitions */
.shortcuts-enter-active {
    transition: opacity 0.2s ease;
}

.shortcuts-enter-active .shortcuts-modal {
    animation: shortcutsIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.shortcuts-leave-active {
    transition: opacity 0.15s ease;
}

.shortcuts-leave-active .shortcuts-modal {
    animation: shortcutsOut 0.15s ease forwards;
}

.shortcuts-enter-from,
.shortcuts-leave-to {
    opacity: 0;
}

@keyframes shortcutsIn {
    from {
        opacity: 0;
        transform: scale(0.96) translateY(8px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes shortcutsOut {
    from {
        opacity: 1;
        transform: scale(1);
    }

    to {
        opacity: 0;
        transform: scale(0.97);
    }
}
</style>
