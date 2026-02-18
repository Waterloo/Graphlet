<script setup lang="ts">
import { useDiagramStore, getDiagramType } from '~/composables/useDiagramStore';
import { X, Plus, Trash2, PanelLeftClose } from 'lucide-vue-next';

const { diagrams, activeId, isSidebarOpen, switchDiagram, createDiagram, deleteDiagram, renameDiagram } = useDiagramStore();

// Inline rename state
const renamingId = ref<string | null>(null);
const renameInput = ref('');
const renameRef = ref<HTMLInputElement | null>(null);

// Delete confirmation modal
const pendingDeleteId = ref<string | null>(null);
const pendingDeleteTitle = ref('');

const startRename = (id: string, currentTitle: string) => {
    renamingId.value = id;
    renameInput.value = currentTitle;
    nextTick(() => {
        renameRef.value?.focus();
        renameRef.value?.select();
    });
};

const commitRename = () => {
    if (renamingId.value) {
        renameDiagram(renamingId.value, renameInput.value);
        renamingId.value = null;
    }
};

const cancelRename = () => {
    renamingId.value = null;
};

const handleDelete = (id: string, title: string) => {
    pendingDeleteId.value = id;
    pendingDeleteTitle.value = title || 'Untitled';
};

const confirmDelete = () => {
    if (pendingDeleteId.value) {
        deleteDiagram(pendingDeleteId.value);
    }
    pendingDeleteId.value = null;
    pendingDeleteTitle.value = '';
};

const cancelDelete = () => {
    pendingDeleteId.value = null;
    pendingDeleteTitle.value = '';
};

const handleNew = () => {
    createDiagram();
};

const timeAgo = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Close on Escape
const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        if (pendingDeleteId.value) {
            cancelDelete();
        } else if (renamingId.value) {
            cancelRename();
        } else {
            isSidebarOpen.value = false;
        }
    }
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
    <Transition name="sidebar">
        <aside v-if="isSidebarOpen" class="sidebar">
            <!-- Header -->
            <div class="sidebar-header">
                <h2 class="sidebar-title">Diagrams</h2>
                <div class="sidebar-header-actions">
                    <button class="sidebar-icon-btn" title="New Diagram" @click="handleNew">
                        <Plus :size="16" />
                    </button>
                    <button class="sidebar-icon-btn" title="Close Sidebar" @click="isSidebarOpen = false">
                        <PanelLeftClose :size="16" />
                    </button>
                </div>
            </div>

            <!-- Diagram List -->
            <div class="sidebar-list">
                <button v-for="d in diagrams" :key="d.id" class="diagram-card" :class="{ active: d.id === activeId }"
                    @click="switchDiagram(d.id)" @dblclick="startRename(d.id, d.title)">
                    <!-- Type Icon -->
                    <span class="diagram-icon">
                        <component :is="getDiagramType(d.code).icon" :size="16" />
                    </span>

                    <div class="diagram-info">
                        <!-- Title (or rename input) -->
                        <template v-if="renamingId === d.id">
                            <input ref="renameRef" v-model="renameInput" class="rename-input"
                                @keydown.enter="commitRename" @keydown.escape="cancelRename" @blur="commitRename"
                                @click.stop />
                        </template>
                        <template v-else>
                            <span class="diagram-title">{{ d.title || 'Untitled' }}</span>
                        </template>

                        <span class="diagram-meta">
                            {{ getDiagramType(d.code).label }} · {{ timeAgo(d.updatedAt) }}
                        </span>
                    </div>

                    <!-- Delete Button -->
                    <button v-if="diagrams.length > 1" class="delete-btn" title="Delete"
                        @click.stop="handleDelete(d.id, d.title)">
                        <Trash2 :size="12" />
                    </button>
                </button>
            </div>

            <!-- Footer -->
            <div class="sidebar-footer">
                <span class="diagram-count">{{ diagrams.length }} diagram{{ diagrams.length !== 1 ? 's' : '' }}</span>
            </div>
        </aside>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="pendingDeleteId" class="modal-overlay" @click.self="cancelDelete">
                <div class="modal-dialog">
                    <div class="modal-icon">
                        <Trash2 :size="20" />
                    </div>
                    <h3 class="modal-title">Delete diagram?</h3>
                    <p class="modal-desc">
                        <strong>{{ pendingDeleteTitle }}</strong> will be permanently deleted. This action cannot be
                        undone.
                    </p>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-cancel" @click="cancelDelete">Cancel</button>
                        <button class="modal-btn modal-btn-delete" @click="confirmDelete">Delete</button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.sidebar {
    width: 280px;
    height: 100%;
    background: rgba(19, 19, 31, 0.97);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 30;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

/* Transition */
.sidebar-enter-active,
.sidebar-leave-active {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

/* Header */
.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin: 0;
}

.sidebar-header-actions {
    display: flex;
    gap: 4px;
}

.sidebar-icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.15s;
}

.sidebar-icon-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.08);
}

/* Diagram List */
.sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sidebar-list::-webkit-scrollbar {
    width: 4px;
}

.sidebar-list::-webkit-scrollbar-track {
    background: transparent;
}

.sidebar-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
}

/* Diagram Card */
.diagram-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
    text-align: left;
    color: inherit;
    position: relative;
}

.diagram-card:hover {
    background: rgba(255, 255, 255, 0.04);
}

.diagram-card.active {
    background: rgba(0, 122, 255, 0.08);
    border-color: rgba(0, 122, 255, 0.15);
}

.diagram-card.active .diagram-title {
    color: #fff;
}

.diagram-icon {
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    flex-shrink: 0;
}

.diagram-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.diagram-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.diagram-meta {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.25);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Rename Input */
.rename-input {
    width: 100%;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(0, 122, 255, 0.4);
    border-radius: 4px;
    padding: 2px 6px;
    outline: none;
}

/* Delete Button */
.delete-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.15);
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s;
}

.diagram-card:hover .delete-btn {
    opacity: 1;
}

.delete-btn:hover {
    background: rgba(255, 69, 58, 0.1);
    color: #FF453A;
}

/* Modal Overlay — :global needed because Teleport moves these outside scoped DOM */
:global(.modal-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

:global(.modal-dialog) {
    background: rgba(30, 30, 46, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 24px;
    width: 320px;
    max-width: 90vw;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

:global(.modal-icon) {
    width: 44px;
    height: 44px;
    margin: 0 auto 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(255, 69, 58, 0.12);
    color: #FF453A;
}

:global(.modal-title) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px;
}

:global(.modal-desc) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
    margin: 0 0 20px;
    line-height: 1.5;
}

:global(.modal-desc strong) {
    color: rgba(255, 255, 255, 0.7);
}

:global(.modal-actions) {
    display: flex;
    gap: 8px;
}

:global(.modal-btn) {
    flex: 1;
    padding: 9px 16px;
    border-radius: 8px;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}

:global(.modal-btn-cancel) {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

:global(.modal-btn-cancel:hover) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

:global(.modal-btn-delete) {
    background: rgba(255, 69, 58, 0.15);
    color: #FF453A;
}

:global(.modal-btn-delete:hover) {
    background: rgba(255, 69, 58, 0.25);
}

/* Modal Transition */
:global(.modal-enter-active),
:global(.modal-leave-active) {
    transition: opacity 0.2s ease;
}

:global(.modal-enter-active .modal-dialog),
:global(.modal-leave-active .modal-dialog) {
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

:global(.modal-enter-from),
:global(.modal-leave-to) {
    opacity: 0;
}

:global(.modal-enter-from .modal-dialog),
:global(.modal-leave-to .modal-dialog) {
    transform: scale(0.95);
    opacity: 0;
}

/* Footer */
.sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.diagram-count {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.2);
}
</style>
