<script setup lang="ts">
import mermaid from 'mermaid';
import panzoom from 'panzoom';
import { useEditorState } from '~/composables/useEditorState';
import { DIAGRAM_TEMPLATES } from '~/composables/useEditorState';
import { useDebounceFn } from '@vueuse/core';

// Components
import TheSettings from '~/components/TheSettings.vue';

// Icons
import { AlertCircle, Plus, Minus, Maximize, FileCode2, ExternalLink } from 'lucide-vue-next';

const { code, currentTheme, title, eyebrow, badges, currentSvg, errorLine, loadTemplate } = useEditorState();

const containerRef = ref<HTMLElement | null>(null);
const diagramRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const error = ref<string | null>(null);
const showErrorDetails = ref(false);
let pzInstance: any = null;
let isFirstRender = true;

// Is editor empty?
const isEmpty = computed(() => !code.value || !code.value.trim());

// Returns true if the event target is inside an element with data-no-panzoom
const isNoPanzoom = (e: Event) =>
    !!(e.target as Element)?.closest('[data-no-panzoom]');

// Initialize Panzoom
onMounted(() => {
    if (wrapperRef.value) {
        pzInstance = panzoom(wrapperRef.value, {
            maxZoom: 5,
            minZoom: 0.1,
            bounds: false,
            boundsPadding: 0.1,
            beforeMouseDown: isNoPanzoom,
            beforeWheel: isNoPanzoom,
        });
    }
    renderDiagram();
});

// Debounced Render
const renderDiagram = useDebounceFn(async () => {
    if (!diagramRef.value || !code.value) return;

    const mermaidConfig = currentTheme.value?.mermaid || {};
    mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
            ...mermaidConfig,
            fontFamily: 'DM Mono, monospace',
            fontSize: '14px',
        },
        themeCSS: (mermaidConfig as any).themeCSS,
        securityLevel: 'loose',
    });

    try {
        const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code.value);
        diagramRef.value.innerHTML = svg;

        // Fix clipping by expanding viewBox
        const svgEl = diagramRef.value.querySelector('svg');
        if (svgEl) {
            const viewBox = svgEl.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/\s+/).map(Number);
                if (parts.length === 4 && parts.every(p => !isNaN(p))) {
                    const x = parts[0]!;
                    const y = parts[1]!;
                    const w = parts[2]!;
                    const h = parts[3]!;
                    const padding = 20;
                    svgEl.setAttribute('viewBox', `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`);
                }
            }
            // Update the string for export to match what we see
            currentSvg.value = diagramRef.value.innerHTML;
        } else {
            currentSvg.value = svg;
        }

        error.value = null;
        errorLine.value = null;

        if (isFirstRender) {
            isFirstRender = false;
            await nextTick();
            fitToScreen();
        }

        // Post-process for ER diagram row coloring
        // We do this in a requestAnimationFrame to ensure the DOM has calculated layout
        requestAnimationFrame(() => {
            postProcessMermaid();
        });
    } catch (e: any) {
        console.error('Mermaid render error:', e);
        const message = e.message || String(e);
        error.value = message;

        // Try to extract line number from error message
        const lineMatch = message.match(/line\s+(\d+)/i);
        if (lineMatch) {
            errorLine.value = parseInt(lineMatch[1]);
        }
    }
}, 500);

// Watchers
watch([code, currentTheme], () => {
    renderDiagram();
});

// Fit to screen helper
const fitToScreen = async () => {
    if (!pzInstance || !containerRef.value || !wrapperRef.value || !diagramRef.value) return;

    await nextTick();
    const svg = diagramRef.value.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return;

    const viewport = containerRef.value.getBoundingClientRect();
    const contentWidth = svg.clientWidth || svg.getBoundingClientRect().width;
    const contentHeight = svg.clientHeight || svg.getBoundingClientRect().height;

    if (!contentWidth || !contentHeight) return;

    const padding = 80;
    const scaleX = (viewport.width - padding) / contentWidth;
    const scaleY = (viewport.height - padding) / contentHeight;
    const targetScale = Math.min(scaleX, scaleY, 4);

    const offsetX = (viewport.width - contentWidth * targetScale) / 2;
    const offsetY = (viewport.height - contentHeight * targetScale) / 2;

    const transform = pzInstance.getTransform();
    const startTransform = { x: transform.x, y: transform.y, scale: transform.scale };
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        const currentScale = startTransform.scale + (targetScale - startTransform.scale) * ease;
        const currentX = startTransform.x + (offsetX - startTransform.x) * ease;
        const currentY = startTransform.y + (offsetY - startTransform.y) * ease;

        pzInstance.zoomAbs(0, 0, currentScale);
        pzInstance.moveTo(currentX, currentY);

        if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
};

const zoomIn = () => {
    if (!pzInstance || !wrapperRef.value) return;
    const { width, height } = wrapperRef.value.getBoundingClientRect();
    pzInstance.smoothZoom(width / 2, height / 2, 1.25);
};

const zoomOut = () => {
    if (!pzInstance || !wrapperRef.value) return;
    const { width, height } = wrapperRef.value.getBoundingClientRect();
    pzInstance.smoothZoom(width / 2, height / 2, 0.8);
};

const loadRandomTemplate = () => {
    if (DIAGRAM_TEMPLATES.length === 0) return;
    const random = DIAGRAM_TEMPLATES[Math.floor(Math.random() * DIAGRAM_TEMPLATES.length)]!;
    loadTemplate(random.id);
};


const postProcessMermaid = () => {
    if (!diagramRef.value) return;

    // Helper to get vertical center of an element
    const getCenterY = (rect: DOMRect) => rect.top + rect.height / 2;

    const svg = diagramRef.value.querySelector('svg');
    if (!svg) return;

    // 1. Find all row background rectangles
    const oddRects = Array.from(svg.querySelectorAll('.row-rect-odd'));
    const evenRects = Array.from(svg.querySelectorAll('.row-rect-even'));

    // 2. Find all potential text groups (attributes)
    // Mermaid ER attributes usually have these classes
    const textGroups = Array.from(svg.querySelectorAll('g.attribute-type, g.attribute-name, g.attribute-keys, g.attribute-comment'));

    if (textGroups.length === 0 || (oddRects.length === 0 && evenRects.length === 0)) return;

    // 3. Map rects to their vertical bounds for hit testing
    const rows = [
        ...oddRects.map(el => ({ el, rect: el.getBoundingClientRect(), type: 'odd' })),
        ...evenRects.map(el => ({ el, rect: el.getBoundingClientRect(), type: 'even' }))
    ];

    // 4. Assign classes to text groups based on overlap
    textGroups.forEach(group => {
        const groupRect = group.getBoundingClientRect();
        const centerY = getCenterY(groupRect);

        // Find the row that contains this text group
        const matchingRow = rows.find(row =>
            centerY >= row.rect.top && centerY <= row.rect.bottom
        );

        if (matchingRow) {
            group.classList.add(`row-text-${matchingRow.type}`);

            // Also add to any child text elements to be safe
            const texts = group.querySelectorAll('text');
            texts.forEach(t => t.classList.add(`row-text-${matchingRow.type}`));
        }
    });

    // Update currentSvg with the modified DOM so exports work
    currentSvg.value = diagramRef.value.innerHTML;
};

defineExpose({ fitToScreen, getSvg: () => diagramRef.value?.innerHTML });
</script>

<template>
    <div v-if="currentTheme" ref="containerRef" class="preview-container"
        :style="{ background: currentTheme.mermaid.background }">

        <TheSettings />

        <!-- Metadata Overlay -->
        <div class="metadata-layer">
            <input v-model="eyebrow" class="input-eyebrow" :style="{ color: currentTheme.header.eyebrow }"
                placeholder="CATEGORY" />
            <input v-model="title" class="input-title" :style="{ color: currentTheme.header.title }"
                placeholder="Diagram Title" />
            <div class="badges">
                <span v-for="(badge, i) in badges" :key="i" class="badge" :style="{
                    background: i === 0 ? currentTheme.badge1.bg : currentTheme.badge2.bg,
                    borderColor: i === 0 ? currentTheme.badge1.border : currentTheme.badge2.border,
                    color: i === 0 ? currentTheme.badge1.text : currentTheme.badge2.text
                }">
                    {{ badge }}
                </span>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="isEmpty && !error" class="empty-state">
            <div class="empty-icon">
                <FileCode2 :size="32" />
            </div>
            <h3 class="empty-title">No diagram yet</h3>
            <p class="empty-desc">Start typing Mermaid syntax in the editor to see your diagram appear here.</p>
            <button class="empty-action" @click="loadRandomTemplate">
                Load an example
            </button>
        </div>

        <!-- PanZoom Wrapper -->
        <div v-show="!isEmpty" ref="wrapperRef" class="zoom-wrapper">
            <div ref="diagramRef" class="mermaid-diagram" :style="{ color: currentTheme.mermaid.primaryTextColor }">
            </div>
        </div>

        <!-- Zoom Controls -->
        <div class="zoom-controls">
            <button @click="zoomIn" title="Zoom In">
                <Plus :size="16" />
            </button>
            <button @click="zoomOut" title="Zoom Out">
                <Minus :size="16" />
            </button>
            <button @click="fitToScreen" title="Reset View">
                <Maximize :size="16" />
            </button>
        </div>

        <!-- Error Overlay -->
        <div v-if="error" class="error-overlay" data-no-panzoom>
            <div class="error-card">
                <div class="error-header">
                    <AlertCircle :size="16" class="error-icon" />
                    <span>Couldn't render — check your syntax</span>
                </div>
                <button class="error-toggle" @click="showErrorDetails = !showErrorDetails">
                    {{ showErrorDetails ? 'Hide' : 'Show' }} details
                </button>
                <pre v-if="showErrorDetails" class="error-body">{{ error }}</pre>
                <a href="https://mermaid.js.org/intro/syntax-reference.html" target="_blank" rel="noopener"
                    class="error-link">
                    <ExternalLink :size="12" />
                    Mermaid Syntax Reference
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.preview-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background 0.3s ease;
}

.zoom-wrapper {
    width: 100%;
    height: 100%;
    outline: none;
}

.mermaid-diagram {
    min-width: 100px;
    min-height: 100px;
}

/* Empty State */
.empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 5;
    gap: 12px;
    animation: fadeIn 0.4s ease;
}

.empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 4px;
}

.empty-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
}

.empty-desc {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
    margin: 0;
    text-align: center;
    max-width: 280px;
    line-height: 1.5;
}

.empty-action {
    margin-top: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #007AFF;
    background: rgba(0, 122, 255, 0.08);
    border: 1px solid rgba(0, 122, 255, 0.2);
    border-radius: 100px;
    padding: 8px 20px;
    cursor: pointer;
    transition: all 0.2s;
}

.empty-action:hover {
    background: rgba(0, 122, 255, 0.14);
    transform: translateY(-1px);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Metadata Layer */
.metadata-layer {
    position: absolute;
    top: 32px;
    left: 32px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
}

.metadata-layer input {
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    margin: 0;
    font-family: 'DM Mono', monospace;
    pointer-events: auto;
    transition: color 0.3s ease;
}

.metadata-layer input::placeholder {
    color: currentColor;
    opacity: 0.4;
}

.input-eyebrow {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 500;
}

.input-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    width: 600px;
    padding-bottom: 0;
    line-height: 48px;
    height: 48px;
    /* Fixed generous height */
    display: flex;
    align-items: center;
}

.badges {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    pointer-events: auto;
}

.badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 100px;
    letter-spacing: 0.05em;
    border-width: 1px;
    border-style: solid;
    transition: all 0.3s ease;
}

/* Error Overlay */
.error-overlay {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 20;
    max-width: 400px;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.error-card {
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    color: #FF453A;
}

.error-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: -0.01em;
}

.error-toggle {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.35);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    padding: 4px 0;
    margin-bottom: 4px;
    transition: color 0.2s;
}

.error-toggle:hover {
    color: rgba(255, 255, 255, 0.6);
}

.error-body {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    opacity: 0.7;
    margin: 4px 0 8px;
    padding: 8px;
    background: rgba(255, 69, 58, 0.06);
    border-radius: 6px;
    border: 1px solid rgba(255, 69, 58, 0.1);
}

.error-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: rgba(255, 255, 255, 0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px;
    text-decoration: none;
    transition: color 0.2s;
}

.error-link:hover {
    color: #007AFF;
}

@keyframes slideUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.zoom-controls {
    position: absolute;
    bottom: 32px;
    left: 32px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
}

.zoom-controls button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(28, 28, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    border-radius: 8px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: all 0.2s;
}

.zoom-controls button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
}
</style>
