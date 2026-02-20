<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useShareState } from '~/composables/useShareState';
import { Link, Code, Check, X, Copy, FileText } from 'lucide-vue-next';
import { useClipboard } from '@vueuse/core';

const { isShareOpen } = useEditorState();
const { getShareUrl, getEmbedHtml, getMermaidInkUrl } = useShareState();

const activeTab = ref<'link' | 'embed' | 'markdown'>('link');
const shareUrl = ref('');
const embedCode = ref('');
const markdownCode = ref('');
const markdownFormat = ref<'image' | 'native'>('image');
const pinMermaidVersion = ref(true);
const BUNDLED_MERMAID_VERSION = '11.12.3';
const { code } = useEditorState();

const { copy: copyText, copied: copiedLink } = useClipboard();
const copiedEmbed = ref(false);
const copiedMarkdown = ref(false);

const generateMarkdown = () => {
    const badge = `[![Edit on Graphlet](https://img.shields.io/badge/Edit%20on-Graphlet-blue)](${shareUrl.value})`;

    if (markdownFormat.value === 'native') {
        markdownCode.value = "```mermaid\n" + code.value + "\n```\n\n" + badge;
    } else {
        const inkUrl = getMermaidInkUrl();
        markdownCode.value = `[![Diagram](${inkUrl})](${shareUrl.value})\n\n${badge}`;
    }
};

// Regenerate URLs when parameters change
watch([isShareOpen, markdownFormat, pinMermaidVersion], ([open]) => {
    if (open) {
        shareUrl.value = getShareUrl();
        const version = pinMermaidVersion.value ? BUNDLED_MERMAID_VERSION : undefined;
        embedCode.value = getEmbedHtml(version);
        generateMarkdown();
    }
});

const handleCopyLink = () => {
    copyText(shareUrl.value);
};

const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode.value);
    copiedEmbed.value = true;
    setTimeout(() => copiedEmbed.value = false, 2000);
};

const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdownCode.value);
    copiedMarkdown.value = true;
    setTimeout(() => copiedMarkdown.value = false, 2000);
};

const close = () => {
    isShareOpen.value = false;
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isShareOpen" class="modal-backdrop" @click.self="close">
                <div class="modal-card">
                    <!-- Header -->
                    <div class="modal-header">
                        <h3>Share Diagram</h3>
                        <button class="close-btn" @click="close" aria-label="Close">
                            <X :size="16" />
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="tabs">
                        <button class="tab" :class="{ active: activeTab === 'link' }" @click="activeTab = 'link'">
                            <Link :size="14" />
                            Share Link
                        </button>
                        <button class="tab" :class="{ active: activeTab === 'embed' }" @click="activeTab = 'embed'">
                            <Code :size="14" />
                            Embed
                        </button>
                        <!-- <button class="tab" :class="{ active: activeTab === 'markdown' }"
                            @click="activeTab = 'markdown'">
                            <FileText :size="14" />
                            Badge
                        </button> -->
                    </div>

                    <!-- Share Link Tab -->
                    <div v-if="activeTab === 'link'" class="tab-content">
                        <p class="description">Anyone with this link will see your diagram exactly as it appears now.
                        </p>
                        <div class="url-box">
                            <input type="text" :value="shareUrl" readonly class="url-input"
                                @focus="($event.target as HTMLInputElement).select()" />
                            <button class="copy-btn" @click="handleCopyLink">
                                <Check v-if="copiedLink" :size="14" class="success-icon" />
                                <Copy v-else :size="14" />
                                {{ copiedLink ? 'Copied!' : 'Copy' }}
                            </button>
                        </div>
                    </div>

                    <!-- Embed Tab -->
                    <div v-if="activeTab === 'embed'" class="tab-content">
                        <p class="description">Paste this code into any HTML page to embed your diagram.</p>
                        <div class="embed-options">
                            <label class="option-label">Mermaid version:</label>
                            <div class="toggle-group">
                                <button class="toggle-btn" :class="{ active: pinMermaidVersion }"
                                    @click="pinMermaidVersion = true">
                                    Pin v{{ BUNDLED_MERMAID_VERSION }}
                                </button>
                                <button class="toggle-btn" :class="{ active: !pinMermaidVersion }"
                                    @click="pinMermaidVersion = false">
                                    Always latest
                                </button>
                            </div>
                        </div>
                        <div class="code-box">
                            <pre class="embed-code">{{ embedCode }}</pre>
                            <button class="copy-btn" @click="handleCopyEmbed">
                                <Check v-if="copiedEmbed" :size="14" class="success-icon" />
                                <Copy v-else :size="14" />
                                {{ copiedEmbed ? 'Copied!' : 'Copy' }}
                            </button>
                        </div>
                    </div>

                    <!-- Markdown / Badge Tab -->
                    <!-- <div v-if="activeTab === 'markdown'" class="tab-content">
                        <p class="description">Add this badge to your README to let others edit this diagram.</p>
                        <div class="markdown-options">
                            <label class="option-label">Format:</label>
                            <div class="toggle-group">
                                <button class="toggle-btn" :class="{ active: markdownFormat === 'image' }"
                                    @click="markdownFormat = 'image'">Image (mermaid.ink)</button>
                                <button class="toggle-btn" :class="{ active: markdownFormat === 'native' }"
                                    @click="markdownFormat = 'native'">Native (GitHub)</button>
                            </div>
                        </div>

                        <div class="preview-box" v-if="markdownFormat === 'image'">
                            <span class="preview-label">Preview:</span>
                            <img src="https://img.shields.io/badge/Edit%20on-Graphlet-blue" alt="Edit on Graphlet" />
                        </div>
                        <div class="code-box">
                            <pre class="embed-code">{{ markdownCode }}</pre>
                            <button class="copy-btn" @click="handleCopyMarkdown">
                                <Check v-if="copiedMarkdown" :size="14" class="success-icon" />
                                <Copy v-else :size="14" />
                                {{ copiedMarkdown ? 'Copied!' : 'Copy' }}
                            </button>
                        </div>
                    </div> -->
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-card {
    width: 480px;
    max-width: 90vw;
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
}

.close-btn {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

/* Tabs */
.tabs {
    display: flex;
    gap: 4px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 20px;
}

.tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.tab:hover {
    color: rgba(255, 255, 255, 0.8);
}

.tab.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

/* Tab Content */
.tab-content {
    animation: fadeIn 0.15s ease;
}

.description {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 16px 0;
    line-height: 1.5;
}

.url-box,
.code-box,
.preview-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.preview-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 12px;
    align-items: center;
    justify-content: center;
}

.preview-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    align-self: flex-start;
    margin-bottom: 4px;
}

.embed-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.markdown-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.option-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
}

.toggle-group {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 2px;
}

.toggle-btn {
    background: transparent;
    border: none;
    padding: 4px 10px;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-btn:hover {
    color: rgba(255, 255, 255, 0.8);
}

.toggle-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.url-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px 14px;
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s;
}

.url-input:focus {
    border-color: #007AFF;
}

.embed-code {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 14px;
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    overflow-x: auto;
}

.copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    background: #007AFF;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-end;
}

.copy-btn:hover {
    background: #006ADC;
}

.success-icon {
    color: #34C759;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-card {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
}

.modal-leave-to .modal-card {
    transform: scale(0.97);
    opacity: 0;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
