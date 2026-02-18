<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useDiagramStore } from '~/composables/useDiagramStore';
import { Download, Share2, Copy, Check, Settings, Plus, PanelLeft } from 'lucide-vue-next';
import TheTooltip from '~/components/TheTooltip.vue';

const { currentTheme, currentSvg, isSettingsOpen, isShareOpen, isWelcomeOpen } = useEditorState();
const { isSidebarOpen } = useDiagramStore();

// Helper: Convert SVG string to Blob (PNG)
const svgToPngBlob = (svgString: string, bgColor: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgEl = svgDoc.querySelector('svg');
        if (!svgEl) { resolve(null); return; }

        const viewBox = svgEl.getAttribute('viewBox');
        let svgWidth = 800, svgHeight = 600;
        if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).map(Number);
            if (parts.length === 4) {
                svgWidth = parts[2] ?? 800;
                svgHeight = parts[3] ?? 600;
            }
        }

        const padding = 60;
        const totalWidth = svgWidth + padding * 2;
        const totalHeight = svgHeight + padding * 2;

        svgEl.setAttribute('width', `${svgWidth}px`);
        svgEl.setAttribute('height', `${svgHeight}px`);
        svgEl.removeAttribute('style');

        const fixedSvgString = new XMLSerializer().serializeToString(svgEl);
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fixedSvgString);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = totalWidth * scale;
            canvas.height = totalHeight * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                resolve(null);
                return;
            }
            ctx.scale(scale, scale);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            ctx.drawImage(img, padding, padding, svgWidth, svgHeight);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        };
        img.onerror = () => {
            resolve(null);
        };
        img.src = url;
    });
};

const copyImage = async () => {
    if (!currentSvg.value) return;
    try {
        const pngBlob = await svgToPngBlob(currentSvg.value, currentTheme.value?.mermaid?.background || '#13131f');
        if (pngBlob) {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob })
            ]);
        }
    } catch (err) {
        console.error('Failed to copy image:', err);
    }
};

const copiedState = ref(false);
const handleCopy = async () => {
    await copyImage();
    copiedState.value = true;
    setTimeout(() => copiedState.value = false, 2000);
}

const downloadImage = async () => {
    if (!currentSvg.value) return;
    const pngBlob = await svgToPngBlob(currentSvg.value, currentTheme.value?.mermaid?.background || '#13131f');
    if (pngBlob) {
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graphlet-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
</script>

<template>
    <div class="toolbar">
        <!-- Brand / Logo Area -->
        <div class="brand">
            <span class="logo-text">Graphlet</span>
        </div>

        <div class="actions">
            <!-- Sidebar Toggle -->
            <TheTooltip text="Diagrams" shortcut="⌘B">
                <button class="icon-btn sidebar-toggle" title="Toggle Sidebar" @click="isSidebarOpen = !isSidebarOpen"
                    :class="{ active: isSidebarOpen }" id="btn-sidebar">
                    <PanelLeft :size="16" />
                </button>
            </TheTooltip>

            <div class="divider"></div>
            <!-- New / Templates -->
            <TheTooltip text="Templates" shortcut="⌘N">
                <button class="icon-btn" title="New Diagram" @click="isWelcomeOpen = true" id="btn-new">
                    <Plus :size="16" />
                    <span class="btn-label">New</span>
                </button>
            </TheTooltip>

            <div class="divider"></div>

            <!-- Settings -->
            <TheTooltip text="Settings" shortcut="⌘,">
                <button class="icon-btn" title="Settings" @click="isSettingsOpen = !isSettingsOpen"
                    :class="{ active: isSettingsOpen }" id="btn-settings">
                    <Settings :size="16" />
                </button>
            </TheTooltip>

            <div class="divider"></div>

            <!-- Copy -->
            <TheTooltip text="Copy Image" shortcut="⌘⇧C">
                <button class="icon-btn" title="Copy to Clipboard" @click="handleCopy" id="btn-copy">
                    <Check v-if="copiedState" :size="16" class="success-icon" />
                    <Copy v-else :size="16" />
                </button>
            </TheTooltip>

            <!-- Download -->
            <TheTooltip text="Download PNG">
                <button class="icon-btn" title="Download PNG" @click="downloadImage" id="btn-download">
                    <Download :size="16" />
                </button>
            </TheTooltip>

            <!-- Share -->
            <button class="button-primary" @click="isShareOpen = true" id="btn-share">
                Share
            </button>
        </div>
    </div>
</template>

<style scoped>
.toolbar {
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: border-color 0.3s;
    background: transparent;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    letter-spacing: -0.02em;
}

.sidebar-toggle {
    background: transparent;
    border-color: transparent;
}

.sidebar-toggle:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.08);
}

.divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 4px;
}

.icon-btn.active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}

.actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 24px;
}

.icon-btn {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: inherit;
    transition: all 0.2s;
    padding: 0 10px;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.btn-label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.button-primary {
    background: #007AFF;
    color: white;
    border: none;
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.button-primary:hover {
    background: #006ADC;
}

.success-icon {
    color: #34C759;
}

/* Hide labels on small screens */
@media (max-width: 900px) {
    .btn-label {
        display: none;
    }
}
</style>
