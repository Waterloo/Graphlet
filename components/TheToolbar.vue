<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useDiagramStore } from '~/composables/useDiagramStore';
import { Download, Share2, Copy, Check, Plus, PanelLeft, Palette, X, Info, ChevronDown, Image as ImageIcon } from 'lucide-vue-next';
import TheTooltip from '~/components/TheTooltip.vue';
import { onClickOutside, onKeyStroke } from '@vueuse/core';

const { themes, themeId, currentTheme, currentSvg, isInfoOpen, isShareOpen, isWelcomeOpen, isThemeSwitcherOpen } = useEditorState();
const { isSidebarOpen } = useDiagramStore();

// Close theme switcher when clicking outside
const themeDropdownRef = ref(null);
onClickOutside(themeDropdownRef, () => {
    isThemeSwitcherOpen.value = false;
});

// Export Menu State
const isExportMenuOpen = ref(false);
const exportDropdownRef = ref(null);
onClickOutside(exportDropdownRef, () => {
    isExportMenuOpen.value = false;
});

// Helper: Convert SVG string to Blob (PNG)
// Helper: Convert SVG string to Blob (PNG)
const svgToPngBlob = (svgString: string, opts: {
    bgColor: string;
    title: string;
    eyebrow: string;
    theme: any;
}): Promise<Blob | null> => {
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
        // Increase top padding for header
        const headerHeight = 120; // Increased to 120px for maximum safety
        const topPadding = padding + headerHeight;
        const bottomPadding = padding * 1.5; // Increased for descenders

        // Measure Text Widths
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let minWidth = svgWidth;

        if (ctx) {
            let maxTextWidth = 0;
            // Measure Eyebrow
            if (opts.eyebrow) {
                ctx.font = '500 13px "DM Mono", monospace';
                const m = ctx.measureText(opts.eyebrow.toUpperCase());
                maxTextWidth = Math.max(maxTextWidth, m.width);
            }
            // Measure Title
            if (opts.title) {
                ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
                const m = ctx.measureText(opts.title);
                maxTextWidth = Math.max(maxTextWidth, m.width);
            }
            // Measure Watermark
            const watermarkText = "Made with graphlet.xyz";
            ctx.font = '400 12px "DM Mono", monospace';
            const wm = ctx.measureText(watermarkText);

            // Ensure enough width for text
            minWidth = Math.max(svgWidth, maxTextWidth);

            // Ensure enough width for watermark if svg is tiny
            minWidth = Math.max(minWidth, wm.width + 100);
        }

        // Increase total dimensions
        const totalWidth = minWidth + padding * 2;
        const totalHeight = svgHeight + topPadding + bottomPadding;

        svgEl.setAttribute('width', `${svgWidth}px`);
        svgEl.setAttribute('height', `${svgHeight}px`);
        svgEl.removeAttribute('style');

        const fixedSvgString = new XMLSerializer().serializeToString(svgEl);
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fixedSvgString);

        const img = new Image();
        img.onload = () => {
            const scale = 2; // Retina scale
            canvas.width = totalWidth * scale;
            canvas.height = totalHeight * scale;

            if (!ctx) {
                URL.revokeObjectURL(url);
                resolve(null);
                return;
            }

            // Set scale
            ctx.scale(scale, scale);

            // Draw Background
            if (opts.bgColor !== 'transparent') {
                ctx.fillStyle = opts.bgColor;
                ctx.fillRect(0, 0, totalWidth, totalHeight);
            }

            // --- Draw Header ---
            const textX = padding;
            // Start lower to allow generous ascender space
            let currentY = padding + 20;

            // 1. Eyebrow (Category)
            if (opts.eyebrow) {
                ctx.font = '500 13px "DM Mono", monospace';
                ctx.fillStyle = opts.theme?.header?.eyebrow || 'rgba(255, 255, 255, 0.6)';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(opts.eyebrow.toUpperCase(), textX, currentY);
                // Increased space after eyebrow
                currentY += 14;
            } else {
                // Initial offset if no eyebrow so title isn't at very top
                currentY += 10;
            }

            // 2. Title
            if (opts.title) {
                ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
                ctx.fillStyle = opts.theme?.header?.title || '#ffffff';
                ctx.textBaseline = 'alphabetic';
                // Move down by font size + extra to avoid clash with eyebrow descenders
                currentY += 28; // Reduced from 36
                ctx.fillText(opts.title, textX, currentY);
            }

            // --- Draw Diagram ---
            // Place diagram below the header area
            // If the canvas is wider than the SVG (due to long text), we keep SVG left-aligned to align with text
            ctx.drawImage(img, padding, topPadding, svgWidth, svgHeight);

            // --- Draw Watermark ---
            const watermarkText = "Made with graphlet.xyz";
            ctx.font = '400 12px "DM Mono", monospace';
            // Position: bottom right
            // We draw at baseline = totalHeight - (padding/2). Descenders go into the bottom half of padding.
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = opts.theme?.header?.eyebrow || '#ffffff';
            ctx.fillText(watermarkText, totalWidth - padding / 2, totalHeight - padding / 2);
            ctx.restore();

            canvas.toBlob((blob) => {
                resolve(blob);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
};

const executeDownload = (blob: Blob, extension: string) => {
    const { title } = useEditorState();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.value || 'graphlet-diagram'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    isExportMenuOpen.value = false;
};

const copyImage = async () => {
    if (!currentSvg.value) return;
    try {
        const { title, eyebrow, currentTheme } = useEditorState();
        const pngBlob = await svgToPngBlob(currentSvg.value, {
            bgColor: currentTheme.value?.mermaid?.background || '#13131f',
            title: title.value,
            eyebrow: eyebrow.value,
            theme: currentTheme.value
        });

        if (pngBlob) {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob })
            ]);
            isExportMenuOpen.value = false;
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

const downloadImage = async (transparent = false) => {
    if (!currentSvg.value) return;
    const { title, eyebrow, currentTheme } = useEditorState();

    const pngBlob = await svgToPngBlob(currentSvg.value, {
        bgColor: transparent ? 'transparent' : (currentTheme.value?.mermaid?.background || '#13131f'),
        title: title.value,
        eyebrow: eyebrow.value,
        theme: currentTheme.value
    });

    if (pngBlob) {
        executeDownload(pngBlob, 'png');
    }
};

const downloadSvg = () => {
    if (!currentSvg.value) return;
    const blob = new Blob([currentSvg.value], { type: 'image/svg+xml;charset=utf-8' });
    executeDownload(blob, 'svg');
};

const isMac = computed(() => {
    if (import.meta.client) {
        return navigator.platform.toUpperCase().includes('MAC');
    }
    return false;
});
const modText = computed(() => isMac.value ? '⌘' : 'Ctrl');

// Keyboard shortcuts for export
onKeyStroke((e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadImage(false);
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadSvg();
    }
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'c') {
        const activeElement = document.activeElement;
        const isFocusInEditor = activeElement?.closest('.monaco-editor');

        if (!isFocusInEditor && !window.getSelection()?.toString()) {
            e.preventDefault();
            handleCopy();
        }
    }
});

// Helper for pill styles
const getPillStyle = (theme: any, isActive: boolean) => ({
    background: isActive ? theme.pillActive.bg : theme.pill.bg,
    borderColor: isActive ? theme.pillActive.border : theme.pill.border,
    color: isActive ? theme.pillActive.text : theme.pill.text
});
</script>

<template>
    <div class="toolbar">
        <!-- Brand / Logo Area -->
        <!-- Brand / Logo Area -->
        <div class="brand">
            <span class="logo-text">Graphlet</span>
        </div>

        <div class="actions">
            <!-- Sidebar Toggle -->
            <TheTooltip text="Diagrams" :shortcut="`${modText}\\`">
                <button class="icon-btn sidebar-toggle" title="Toggle Sidebar" @click="isSidebarOpen = !isSidebarOpen"
                    :class="{ active: isSidebarOpen }" id="btn-sidebar">
                    <PanelLeft :size="16" />
                </button>
            </TheTooltip>

            <div class="divider"></div>
            <!-- New / Templates -->
            <TheTooltip text="Templates" :shortcut="`${isMac ? '⌥' : 'Alt'}N`">
                <button class="icon-btn" title="New Diagram" @click="isWelcomeOpen = true" id="btn-new">
                    <Plus :size="16" />
                    <span class="btn-label">New</span>
                </button>
            </TheTooltip>

            <div class="divider"></div>

            <!-- Theme Switcher -->
            <div class="relative" ref="themeDropdownRef">
                <TheTooltip text="Theme">
                    <button class="icon-btn" title="Select Theme" @click="isThemeSwitcherOpen = !isThemeSwitcherOpen"
                        :class="{ active: isThemeSwitcherOpen }" id="btn-theme">
                        <Palette :size="16" />
                        <span class="btn-label theme-label">{{ currentTheme?.label || 'Theme' }}</span>
                    </button>
                </TheTooltip>

                <!-- Theme Popover -->
                <div v-if="isThemeSwitcherOpen" class="theme-popover">
                    <div class="theme-header">
                        <h3>Theme</h3>
                        <button class="close-btn" @click="isThemeSwitcherOpen = false" aria-label="Close themes">
                            <X :size="14" />
                        </button>
                    </div>
                    <div class="theme-grid">
                        <button v-for="theme in themes" :key="theme.id" class="theme-pill"
                            :style="getPillStyle(theme, themeId === theme.id)" @click="themeId = theme.id"
                            :aria-label="`Select theme ${theme.label}`" :aria-pressed="themeId === theme.id">
                            {{ theme.label }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="divider"></div>

            <!-- Info -->
            <TheTooltip text="Information" shortcut="⌘,">
                <button class="icon-btn" title="Information" @click="isInfoOpen = !isInfoOpen"
                    :class="{ active: isInfoOpen }" id="btn-info">
                    <Info :size="16" />
                </button>
            </TheTooltip>

            <!-- Export Menu -->
            <div class="relative" ref="exportDropdownRef">
                <div class="export-button-group">
                    <button class="icon-btn export-main-btn" title="Download PNG" @click="downloadImage(false)">
                        <Download :size="16" />
                    </button>
                    <div class="export-divider"></div>
                    <button class="icon-btn export-chevron-btn" @click="isExportMenuOpen = !isExportMenuOpen"
                        :class="{ active: isExportMenuOpen }">
                        <ChevronDown :size="16" />
                    </button>
                </div>

                <!-- Export Popover -->
                <div v-if="isExportMenuOpen" class="export-popover">
                    <button class="export-item" @click="downloadImage(false)">
                        <div class="export-item-left">
                            <ImageIcon :size="16" class="export-icon" />
                            <span>Save PNG</span>
                        </div>
                        <div class="shortcut-keys">
                            <kbd>{{ modText }}</kbd> <kbd>S</kbd>
                        </div>
                    </button>

                    <button class="export-item" @click="downloadSvg">
                        <div class="export-item-left">
                            <ImageIcon :size="16" class="export-icon" />
                            <span>Save SVG</span>
                        </div>
                        <div class="shortcut-keys">
                            <kbd>{{ modText }}</kbd> <kbd>⇧</kbd> <kbd>S</kbd>
                        </div>
                    </button>

                    <button class="export-item" @click="downloadImage(true)">
                        <div class="export-item-left">
                            <ImageIcon :size="16" class="export-icon" />
                            <span>Save Transparent PNG</span>
                        </div>
                    </button>

                    <div class="export-menu-divider"></div>

                    <button class="export-item" @click="handleCopy">
                        <div class="export-item-left">
                            <Check v-if="copiedState" :size="16" class="success-icon export-icon" />
                            <Copy v-else :size="16" class="export-icon" />
                            <span>{{ copiedState ? 'Copied!' : 'Copy Image' }}</span>
                        </div>
                        <div class="shortcut-keys" v-if="!copiedState">
                            <kbd>{{ modText }}</kbd> <kbd>C</kbd>
                        </div>
                    </button>
                </div>
            </div>

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
    gap: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    letter-spacing: -0.02em;
}

.brand-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
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

.relative {
    position: relative;
}

.theme-popover {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 280px;
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    z-index: 100;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
}

.theme-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.theme-header h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.close-btn {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
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

.theme-label {
    width: 60px;
    text-align: left;
    text-transform: capitalize;
}

/* Export Button Group */
.export-button-group {
    display: flex;
    align-items: center;
    background: rgba(255, 69, 58, 0.1);
    /* Subtle red tint like the screenshot */
    border: 1px solid rgba(255, 69, 58, 0.2);
    border-radius: 8px;
    height: 32px;
    transition: all 0.2s;
}

.export-button-group:hover {
    background: rgba(255, 69, 58, 0.15);
    border-color: rgba(255, 69, 58, 0.3);
}

.export-main-btn {
    border: none;
    background: transparent;
    color: #FF6B6B;
    border-radius: 8px 0 0 8px;
    height: 100%;
}

.export-main-btn:hover {
    background: transparent;
}

.export-divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 69, 58, 0.2);
}

.export-chevron-btn {
    border: none;
    background: transparent;
    color: #FF6B6B;
    border-radius: 0 8px 8px 0;
    height: 100%;
    padding: 0 8px;
}

.export-chevron-btn:hover,
.export-chevron-btn.active {
    background: rgba(255, 69, 58, 0.1);
}

/* Export Popover */
.export-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 240px;
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 8px;
    z-index: 100;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.export-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    transition: all 0.2s;
}

.export-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
}

.export-item-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.export-icon {
    color: rgba(255, 255, 255, 0.5);
}

.export-item:hover .export-icon {
    color: rgba(255, 255, 255, 0.8);
}

.shortcut-keys {
    display: flex;
    gap: 4px;
}

.shortcut-keys kbd {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    min-width: 20px;
    text-align: center;
}

.export-menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 4px 0;
}

/* Hide labels on small screens */
@media (max-width: 900px) {
    .btn-label {
        display: none;
    }
}
</style>
