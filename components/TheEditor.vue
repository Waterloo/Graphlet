<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { useEditorState } from '~/composables/useEditorState';

const container = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const { code, currentTheme } = useEditorState();

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
    <div ref="container" class="editor-container"></div>
</template>

<style scoped>
.editor-container {
    width: 100%;
    height: 100%;
    /* overflow: hidden; handled by monaco */
}
</style>
