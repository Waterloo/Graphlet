<script setup lang="ts">
import mermaid from 'mermaid';
import { useShareState } from '~/composables/useShareState';
import { useEditorState } from '~/composables/useEditorState';
import { useDebounceFn } from '@vueuse/core';

const { code, currentTheme, title, eyebrow, badges } = useEditorState();
const { loadFromUrl } = useShareState();

const diagramRef = ref<HTMLElement | null>(null);
const error = ref<string | null>(null);
const loaded = ref(false);

// Load state from URL
onMounted(() => {
    const success = loadFromUrl();
    if (!success) {
        error.value = 'Invalid or missing diagram data.';
        return;
    }
    loaded.value = true;
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
    } catch (e: any) {
        console.error('Mermaid render error:', e);
        error.value = e.message || String(e);
    }
}, 200);

watch([code, currentTheme], () => {
    if (loaded.value) renderDiagram();
});
</script>

<template>
    <div class="embed-container" :style="{ background: currentTheme?.mermaid?.background || '#13131f' }">
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

            <!-- Diagram -->
            <div class="diagram-wrapper">
                <div ref="diagramRef" class="mermaid-diagram"
                    :style="{ color: currentTheme?.mermaid?.primaryTextColor }">
                </div>
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

/* Metadata */
.metadata-layer {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 2px;
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

/* Diagram */
.diagram-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 1;
    padding: 80px 40px 40px;
}

.mermaid-diagram {
    max-width: 100%;
    max-height: 100%;
}

.mermaid-diagram :deep(svg) {
    max-width: 100%;
    max-height: 100%;
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
}

.watermark:hover {
    opacity: 0.7;
}
</style>
