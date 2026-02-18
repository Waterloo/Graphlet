<script setup lang="ts">
import mermaid from 'mermaid';
import panzoom from 'panzoom';
import { useShareState } from '~/composables/useShareState';
import { useEditorState } from '~/composables/useEditorState';
import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { Plus, Minus, Maximize } from 'lucide-vue-next';

const { code, currentTheme, title, eyebrow, badges } = useEditorState();
const { loadFromUrl } = useShareState();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const containerRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const diagramRef = ref<HTMLElement | null>(null);
const error = ref<string | null>(null);
const loaded = ref(false);
let pzInstance: any = null;

// Load state from URL
onMounted(() => {
    const success = loadFromUrl();
    if (!success) {
        error.value = 'Invalid or missing diagram data.';
        return;
    }
    loaded.value = true;

    // Init panzoom
    if (wrapperRef.value) {
        pzInstance = panzoom(wrapperRef.value, {
            maxZoom: 5,
            minZoom: 0.1,
            bounds: false,
            boundsPadding: 0.1,
        });
    }

    renderDiagram();
});

// Render
const renderDiagram = useDebounceFn(async () => {
    if (!diagramRef.value || !code.value) return;

    mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
            ...(currentTheme.value?.mermaid || {}),
            fontFamily: 'DM Mono, monospace',
            fontSize: '14px',
        },
        securityLevel: 'loose',
    });

    try {
        const { svg } = await mermaid.render('embed-graph-' + Date.now(), code.value);
        diagramRef.value.innerHTML = svg;
        error.value = null;

        // Auto-fit after first render
        await nextTick();
        fitToScreen();
    } catch (e: any) {
        console.error('Mermaid render error:', e);
        error.value = e.message || String(e);
    }
}, 200);

watch([code, currentTheme], () => {
    if (loaded.value) renderDiagram();
});

// Fit to screen
const fitToScreen = async () => {
    if (!pzInstance || !containerRef.value || !wrapperRef.value || !diagramRef.value) return;

    await nextTick();
    const svg = diagramRef.value.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return;

    const viewport = containerRef.value.getBoundingClientRect();
    const contentWidth = svg.clientWidth || svg.getBoundingClientRect().width;
    const contentHeight = svg.clientHeight || svg.getBoundingClientRect().height;
    if (!contentWidth || !contentHeight) return;

    const metadataHeight = isMobile.value ? 90 : 0;
    const padding = isMobile.value ? 24 : 100;
    const scaleX = (viewport.width - padding) / contentWidth;
    const scaleY = (viewport.height - padding - metadataHeight) / contentHeight;
    const targetScale = Math.min(scaleX, scaleY, 4);

    const offsetX = (viewport.width - contentWidth * targetScale) / 2;
    const offsetY = metadataHeight + (viewport.height - metadataHeight - contentHeight * targetScale) / 2;

    // Animate to target
    const transform = pzInstance.getTransform();
    const start = { x: transform.x, y: transform.y, scale: transform.scale };
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        pzInstance.zoomAbs(0, 0, start.scale + (targetScale - start.scale) * ease);
        pzInstance.moveTo(
            start.x + (offsetX - start.x) * ease,
            start.y + (offsetY - start.y) * ease,
        );

        if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
};

const zoomIn = () => {
    if (!pzInstance || !containerRef.value) return;
    const { width, height } = containerRef.value.getBoundingClientRect();
    pzInstance.smoothZoom(width / 2, height / 2, 1.25);
};

const zoomOut = () => {
    if (!pzInstance || !containerRef.value) return;
    const { width, height } = containerRef.value.getBoundingClientRect();
    pzInstance.smoothZoom(width / 2, height / 2, 0.8);
};
</script>

<template>
    <div ref="containerRef" class="embed-container"
        :style="{ background: currentTheme?.mermaid?.background || '#13131f' }">
        <!-- Error State -->
        <div v-if="error && !loaded" class="error-state">
            <p>Unable to load diagram.</p>
        </div>

        <template v-else>
            <!-- Metadata Overlay -->
            <div class="metadata-layer">
                <span class="eyebrow-text" :style="{ color: currentTheme?.header?.eyebrow }">{{ eyebrow }}</span>
                <span class="title-text" :style="{ color: currentTheme?.header?.title }">{{ title }}</span>
                <div class="badges" v-if="badges?.length">
                    <span v-for="(badge, i) in badges" :key="i" class="badge" :style="{
                        background: i === 0 ? currentTheme?.badge1?.bg : currentTheme?.badge2?.bg,
                        borderColor: i === 0 ? currentTheme?.badge1?.border : currentTheme?.badge2?.border,
                        color: i === 0 ? currentTheme?.badge1?.text : currentTheme?.badge2?.text
                    }">
                        {{ badge }}
                    </span>
                </div>
            </div>

            <!-- PanZoom Wrapper -->
            <div ref="wrapperRef" class="zoom-wrapper">
                <div ref="diagramRef" class="mermaid-diagram"
                    :style="{ color: currentTheme?.mermaid?.primaryTextColor }">
                </div>
            </div>

            <!-- Zoom Controls -->
            <div class="zoom-controls">
                <button @click="zoomIn" title="Zoom In">
                    <Plus :size="14" />
                </button>
                <button @click="zoomOut" title="Zoom Out">
                    <Minus :size="14" />
                </button>
                <button @click="fitToScreen" title="Fit to Screen">
                    <Maximize :size="14" />
                </button>
            </div>

            <!-- Watermark -->
            <a href="/" target="_blank" class="watermark" :style="{ color: currentTheme?.header?.eyebrow }">
                Made with Graphlet
            </a>
        </template>
    </div>
</template>

<style scoped>
.embed-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    transition: background 0.3s ease;
}

.error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
    font-family: 'DM Mono', monospace;
    font-size: 14px;
}

/* PanZoom */
.zoom-wrapper {
    width: 100%;
    height: 100%;
    outline: none;
}

.mermaid-diagram {
    min-width: 100px;
    min-height: 100px;
}

/* Metadata */
.metadata-layer {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 2px;
    pointer-events: none;
}

.eyebrow-text {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 500;
    transition: color 0.3s ease;
}

.title-text {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    transition: color 0.3s ease;
}

.badges {
    display: flex;
    gap: 6px;
    margin-top: 6px;
}

.badge {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    padding: 3px 8px;
    border-radius: 100px;
    letter-spacing: 0.05em;
    border-width: 1px;
    border-style: solid;
    transition: all 0.3s ease;
}

/* Zoom Controls — subtle, bottom-left */
.zoom-controls {
    position: absolute;
    bottom: 16px;
    left: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 10;
    opacity: 0.3;
    transition: opacity 0.2s;
}

.zoom-controls:hover {
    opacity: 0.8;
}

.zoom-controls button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(28, 28, 30, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
    border-radius: 6px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: all 0.2s;
}

.zoom-controls button:hover {
    background: rgba(255, 255, 255, 0.1);
}

/* Watermark */
.watermark {
    position: absolute;
    bottom: 12px;
    right: 16px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    opacity: 0.4;
    text-decoration: none;
    transition: opacity 0.2s;
    letter-spacing: 0.03em;
    z-index: 5;
}

.watermark:hover {
    opacity: 0.7;
}

@media (max-width: 767px) {
    .metadata-layer {
        top: 16px;
        left: 16px;
        gap: 2px;
    }

    .title-text {
        font-size: 16px;
    }

    .eyebrow-text {
        font-size: 9px;
    }

    .badge {
        font-size: 8px;
        padding: 2px 7px;
    }
}
</style>
