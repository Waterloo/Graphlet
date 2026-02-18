<script setup lang="ts">
import mermaid from 'mermaid';
import panzoom from 'panzoom'; // We need to install this: npm install panzoom
import { useEditorState } from '~/composables/useEditorState';
import { useDebounceFn } from '@vueuse/core';

// Components
import TheSettings from '~/components/TheSettings.vue';

// Icons
import { AlertCircle, Plus, Minus, Maximize } from 'lucide-vue-next';

const { code, currentTheme, title, eyebrow, badges, currentSvg } = useEditorState();

const containerRef = ref<HTMLElement | null>(null);
const diagramRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const error = ref<string | null>(null);
let pzInstance: any = null;
let isFirstRender = true;

// Initialize Panzoom
onMounted(() => {
    if (wrapperRef.value) {
        pzInstance = panzoom(wrapperRef.value, {
            maxZoom: 5,
            minZoom: 0.1,
            bounds: false, // Allow free movement for "infinite canvas" feel
            boundsPadding: 0.1
        });
    }
    renderDiagram();
});

// Debounced Render
const renderDiagram = useDebounceFn(async () => {
    if (!diagramRef.value || !code.value) return;

    // Reset config
    mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
            ...(currentTheme.value?.mermaid || {}),
            fontFamily: 'DM Mono, monospace', // Force mono for consistnecy
            fontSize: '14px',
        },
        securityLevel: 'loose',
    });

    try {
        const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code.value);
        diagramRef.value.innerHTML = svg;
        currentSvg.value = svg; // Update global state
        error.value = null;

        // Auto-fit on first successful render
        if (isFirstRender) {
            isFirstRender = false;
            await nextTick();
            fitToScreen();
        }
    } catch (e: any) {
        console.error('Mermaid render error:', e);
        const message = e.message || String(e);
        error.value = message;

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

    // Use the stable outer container for viewport dimensions
    const viewport = containerRef.value.getBoundingClientRect();

    // Use the SVG's actual rendered layout size (unaffected by panzoom transforms)
    // offsetWidth/Height gives accurate dimensions regardless of viewBox or max-width styles
    const contentWidth = svg.clientWidth || svg.getBoundingClientRect().width;
    const contentHeight = svg.clientHeight || svg.getBoundingClientRect().height;

    if (!contentWidth || !contentHeight) return;

    const padding = 80;
    const scaleX = (viewport.width - padding) / contentWidth;
    const scaleY = (viewport.height - padding) / contentHeight;

    // Choose the smaller scale to fit both dimensions
    const targetScale = Math.min(scaleX, scaleY, 4);

    // Center the content in the viewport
    // Content starts at (0,0) in the wrapper (no flex centering)
    const offsetX = (viewport.width - contentWidth * targetScale) / 2;
    const offsetY = (viewport.height - contentHeight * targetScale) / 2;

    // Animate smoothly to the target transform
    const transform = pzInstance.getTransform();
    const startTransform = { x: transform.x, y: transform.y, scale: transform.scale };
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease-out cubic
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

defineExpose({ fitToScreen, getSvg: () => diagramRef.value?.innerHTML });
</script>

<template>
    <div v-if="currentTheme" ref="containerRef" class="preview-container"
        :style="{ background: currentTheme.mermaid.background }">

        <TheSettings />

        <!-- Metadata Overlay (Draggable? Fixed for now) -->
        <!-- We use an absolute overlay for metadata that isn't part of the zoomable canvas 
             OR we put it inside if we want it part of the export. 
             Plan said: 'Edit Mode: Renders the diagram on an infinite-like canvas... Overlays Title/Eyebrow/Badges'
             So we keep it UI-level fixed or absolute, but visually integrated. 
        -->
        <div class="metadata-layer">
            <input v-model="eyebrow" class="input-eyebrow" :style="{ color: currentTheme.header.eyebrow }"
                placeholder="CATEGORY" />
            <input v-model="title" class="input-title" :style="{ color: currentTheme.header.title }"
                placeholder="Diagram Title" />
            <div class="badges">
                <!-- Simple tag input logic could go here, for now just display fixed ones to edit? 
                    Actually, let's just make it a pill list editable. 
                    For v1, let's just assume simple array editing is handled elsewhere or simple text.
               -->
                <span v-for="(badge, i) in badges" :key="i" class="badge" :style="{
                    background: i === 0 ? currentTheme.badge1.bg : currentTheme.badge2.bg,
                    borderColor: i === 0 ? currentTheme.badge1.border : currentTheme.badge2.border,
                    color: i === 0 ? currentTheme.badge1.text : currentTheme.badge2.text
                }">
                    {{ badge }}
                </span>
            </div>
        </div>

        <!-- PanZoom Wrapper -->
        <div ref="wrapperRef" class="zoom-wrapper">
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
        <div v-if="error" class="error-overlay">
            <div class="error-card">
                <div class="error-header">
                    <AlertCircle :size="16" class="error-icon" />
                    <span>Syntax Error</span>
                </div>
                <pre class="error-body">{{ error }}</pre>
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
    /* No flex centering — panzoom manages all positioning */
    outline: none;
}

.mermaid-diagram {
    /* Center it initially */
    min-width: 100px;
    min-height: 100px;
}

/* Metadata Layer - Floating UI */
.metadata-layer {
    position: absolute;
    top: 32px;
    left: 32px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
    /* Let clicks pass through, inputs will re-enable */
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
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.error-body {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    opacity: 0.9;
    margin: 0;
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
