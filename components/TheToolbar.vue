<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { Download, Share2, Copy, Check, Settings } from 'lucide-vue-next';
import { useClipboard } from '@vueuse/core';

const { currentTheme, currentSvg, isSettingsOpen } = useEditorState();
const { copy, copied } = useClipboard();

// Helper: Convert SVG string to Blob (PNG)
const svgToPngBlob = (svgString: string, bgColor: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
        // Parse SVG to extract viewBox dimensions and set explicit pixel sizes
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgEl = svgDoc.querySelector('svg');
        if (!svgEl) { resolve(null); return; }

        // Extract intrinsic dimensions from viewBox
        const viewBox = svgEl.getAttribute('viewBox');
        let svgWidth = 800, svgHeight = 600; // fallback
        if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).map(Number);
            if (parts.length === 4) {
                svgWidth = parts[2] ?? 800;
                svgHeight = parts[3] ?? 600;
            }
        }

        // Add padding around the diagram
        const padding = 60;
        const totalWidth = svgWidth + padding * 2;
        const totalHeight = svgHeight + padding * 2;

        // Override width/height to explicit pixels so the <img> renders at full size
        svgEl.setAttribute('width', `${svgWidth}px`);
        svgEl.setAttribute('height', `${svgHeight}px`);
        svgEl.removeAttribute('style'); // Remove max-width constraint

        const fixedSvgString = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([fixedSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Scale up for Retina quality
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
            // Fill with theme background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            // Draw the SVG centered with padding
            ctx.drawImage(img, padding, padding, svgWidth, svgHeight);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                resolve(blob);
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
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
            // Manually trigger copied state if useClipboard doesn't handle Blob write automatically
            // actually useClipboard from vueuse is mainly for text. We are using navigator directly.
            // So we need our own 'copied' ref logic or reuse the one from the original component?
            // Original component had `copied` ref. I'll use that.
            // Wait, I imported `useClipboard` but didn't check if it supports blobs.
            // It mostly supports string. I'll use navigator.clipboard.write.
            // I'll keep the manual copied state logic from before but updated.
            // The previous code had `const copied = ref(false)`. I replaced the imports.
            // Let's restore the manual ref for visual feedback.
        }
    } catch (err) {
        console.error('Failed to copy image:', err);
    }
};

// Re-declare copied for manual feedback since we use navigator.clipboard
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
            <button class="icon-btn" title="Settings" @click="isSettingsOpen = !isSettingsOpen"
                :class="{ active: isSettingsOpen }">
                <Settings :size="16" />
            </button>
            <div class="divider"></div>
            <button class="icon-btn" title="Copy to Clipboard" @click="handleCopy">
                <Check v-if="copiedState" :size="16" class="success-icon" />
                <Copy v-else :size="16" />
            </button>
            <button class="icon-btn" title="Download PNG" @click="downloadImage">
                <Download :size="16" />
            </button>
            <button class="button-primary">
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
    /* Assuming overlay or integrated */
}

.brand {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    letter-spacing: -0.02em;
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
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: inherit;
    transition: all 0.2s;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
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
</style>
