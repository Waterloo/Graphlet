<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { useEditorState } from '~/composables/useEditorState';
import { useMermaidAutocomplete } from '~/composables/useMermaidAutocomplete';
import { useDiagramStore } from '~/composables/useDiagramStore';
import { Copy, Check, Sparkles, PanelLeft } from 'lucide-vue-next';
import TheAiAssistant from './TheAiAssistant.vue';

const container = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let errorDecorations: string[] = [];
let completionDisposable: monaco.IDisposable | null = null;

const { code, currentTheme, errorLine } = useEditorState();
const { completionProvider } = useMermaidAutocomplete();
const { isSidebarOpen } = useDiagramStore();

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

const isAiOpen = ref(false);

// Initialize Monaco
onMounted(() => {
    if (!container.value) return;

    // Register Mermaid language (basic)
    monaco.languages.register({ id: 'mermaid' });

    // Register Telepathic Autocomplete
    completionDisposable = monaco.languages.registerCompletionItemProvider('mermaid', completionProvider);

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
            'editor.background': '#13131f',
            'editor.foreground': '#f0eeff',
            'editor.lineHighlightBackground': '#ffffff05',
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
        padding: { top: 16, bottom: 32 },
        roundedSelection: true,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        renderLineHighlight: 'line',
        contextmenu: false,
    });

    editor.onDidChangeModelContent(() => {
        code.value = editor?.getValue() || '';
    });

    if (document.fonts) {
        document.fonts.ready.then(() => {
            monaco.editor.remeasureFonts();
        });
    }
});

// Sync external changes back to editor
watch(code, (newVal) => {
    if (editor && editor.getValue() !== newVal) {
        editor.setValue(newVal);
    }
});

// Watch error line and highlight it
watch(errorLine, (line) => {
    if (!editor) return;

    if (line && line > 0) {
        errorDecorations = editor.deltaDecorations(errorDecorations, [
            {
                range: new monaco.Range(line, 1, line, 1),
                options: {
                    isWholeLine: true,
                    className: 'error-line-highlight',
                    glyphMarginClassName: 'error-line-glyph',
                    overviewRuler: {
                        color: '#FF453A',
                        position: monaco.editor.OverviewRulerLane.Full
                    }
                }
            }
        ]);
    } else {
        errorDecorations = editor.deltaDecorations(errorDecorations, []);
    }
});

onUnmounted(() => {
    editor?.dispose();
    completionDisposable?.dispose();
});
</script>

<template>
    <div class="editor-wrapper">
        <div class="editor-header">
            <div class="editor-header-left">
                <!-- Sidebar Toggle -->
                <button class="icon-btn" :class="{ active: isSidebarOpen }" @click="isSidebarOpen = !isSidebarOpen"
                    title="Toggle Sidebar">
                    <PanelLeft :size="16" />
                </button>
            </div>

            <div class="editor-header-right">
                <button class="icon-btn ai-btn" :class="{ active: isAiOpen }" @click="isAiOpen = !isAiOpen"
                    title="AI Assistant">
                    <Sparkles :size="14" />
                </button>
                <button class="icon-btn" :class="{ copied }" @click="copyContent"
                    :title="copied ? 'Copied!' : 'Copy code'">
                    <Check v-if="copied" :size="14" />
                    <Copy v-else :size="14" />
                </button>
            </div>
        </div>

        <div ref="container" class="editor-container"></div>

        <TheAiAssistant :is-open="isAiOpen" @close="isAiOpen = false" />
    </div>
</template>

<style scoped>
.editor-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: transparent;
}

.editor-header {
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.editor-header-left,
.editor-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.editor-container {
    flex: 1;
    min-height: 0;
    width: 100%;
}

.icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s;
}

.icon-btn:hover,
.icon-btn.active {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
}

.icon-btn.ai-btn {
    color: rgba(168, 85, 247, 0.8);
}

.icon-btn.ai-btn:hover,
.icon-btn.ai-btn.active {
    background: rgba(168, 85, 247, 0.15);
    color: #C084FC;
}

.icon-btn.copied {
    color: #34C759;
}
</style>

<style>
/* Global styles for Monaco error decorations (must be unscoped) */
.error-line-highlight {
    background: rgba(255, 69, 58, 0.08) !important;
    border-left: 3px solid #FF453A !important;
}

.error-line-glyph {
    background: #FF453A;
    border-radius: 50%;
    margin-left: 4px;
    width: 8px !important;
    height: 8px !important;
}
</style>
