<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { useEditorState } from '~/composables/useEditorState';
import { Copy, Check } from 'lucide-vue-next';

const container = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const { code, currentTheme } = useEditorState();

const copied = ref(false);
const copyContent = async () => {
    if (!editor) return;
    const selection = editor.getSelection();
    const selectedText = selection && !selection.isEmpty()
        ? editor.getModel()?.getValueInRange(selection) ?? ''
        : editor.getValue();
    await navigator.clipboard.writeText(selectedText);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
};

// Initialize Monaco
onMounted(() => {
    if (!container.value) return;

    // Register Mermaid language (basic)
    monaco.languages.register({ id: 'mermaid' });
    monaco.languages.setMonarchTokensProvider('mermaid', {
        keywords: [
            'graph', 'td', 'flowchart', 'gantt', 'classDiagram', 'stateDiagram', 'erDiagram',
            'journey', 'pie', 'sequenceDiagram', 'mindmap', 'timeline', 'gitGraph', 'c4Context',
            'subgraph', 'end', 'click', 'style', 'linkStyle', 'classDef', 'class', 'callback',
            'participant', 'actor', 'boundary', 'box', 'note', 'loop', 'alt', 'else', 'opt',
            'par', 'and', 'rect', 'critical', 'break', 'loop', 'limit', 'title', 'accTitle',
            'accDescr', 'section', 'dateFormat', 'axisFormat', 'todayMarker', 'excludes',
            'includes', 'open', 'done', 'active', 'crit', 'after', 'milestone', 'order'
        ],
        tokenizer: {
            root: [
                [/\[/, 'delimiter.bracket'],
                [/\]/, 'delimiter.bracket'],
                [/[a-zA-Z][\w$]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }],
                [/[{}()\[\]]/, '@brackets'],
                [/".*?"/, 'string'],
            ]
        }
    });

    // Define keywords for syntax highlighting
    monaco.languages.setLanguageConfiguration('mermaid', {
        comments: {
            lineComment: '%%',
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ]
    });

    // Define a static dark theme (Midnight)
    monaco.editor.defineTheme('graphlet-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#13131f', // Midnight bg
            'editor.foreground': '#f0eeff', // Midnight primary text
            'editor.lineHighlightBackground': '#ffffff05', // Subtle highlight
        }
    });

    editor = monaco.editor.create(container.value, {
        value: code.value,
        language: 'mermaid',
        theme: 'graphlet-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'DM Mono', monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        padding: { top: 32, bottom: 32 }, // More breathing room
        roundedSelection: true,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        renderLineHighlight: 'line',
        contextmenu: false, // Custom feel
    });

    editor.onDidChangeModelContent(() => {
        code.value = editor?.getValue() || '';
    });
});

// Sync external changes (if any) back to editor
watch(code, (newVal) => {
    if (editor && editor.getValue() !== newVal) {
        editor.setValue(newVal);
    }
});

onUnmounted(() => {
    editor?.dispose();
});
</script>

<template>
    <div class="editor-wrapper">
        <div ref="container" class="editor-container"></div>
        <button class="copy-btn" :class="{ copied }" @click="copyContent" :title="copied ? 'Copied!' : 'Copy code'">
            <Check v-if="copied" :size="14" />
            <Copy v-else :size="14" />
        </button>
    </div>
</template>

<style scoped>
.editor-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.editor-container {
    width: 100%;
    height: 100%;
}

.copy-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(19, 19, 31, 0.8);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity 0.2s, color 0.2s, border-color 0.2s;
}

.editor-wrapper:hover .copy-btn {
    opacity: 1;
}

.copy-btn:hover {
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
}

.copy-btn.copied {
    opacity: 1;
    color: #34C759;
    border-color: rgba(52, 199, 89, 0.3);
}
</style>
