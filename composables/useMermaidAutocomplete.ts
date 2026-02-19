import * as monaco from 'monaco-editor';

interface MermaidNode {
    id: string;
    label?: string;
}

export function useMermaidAutocomplete() {
    /**
     * Extracts nodes with their labels from Mermaid code using Regex.
     * Supports:
     * - A[Label]
     * - A((Label))
     * - A{Label}
     * - A>Label]
     * - A
     */
    const extractNodes = (code: string): { id: string, label: string }[] => {
        const nodes = new Map<string, string>();

        // Regex to find node definitions: ID followed by shape with label
        // Matches: A[Label], A((Label)), A{Label}, A>Label], A[/Label/], A[\Label\]
        // Also handles defined nodes without labels if followed by a shape definition immediately
        const definitionPattern = /([a-zA-Z0-9_]+)\s*(?:\[|\(|\{|>|\[\/|\(\|)(.*?)(?:\)|\]|\}|\]\]|\)\)|\\>)/g;

        let match;
        while ((match = definitionPattern.exec(code)) !== null) {
            const id = match[1];
            const label = match[2];
            // Remove quotes from label if present
            const cleanLabel = label ? label.replace(/^["']|["']$/g, '') : '';
            if (id) nodes.set(id, cleanLabel);
        }

        // Regex to find simple node definitions or connections:
        // 1. Definition alone: line starts with ID, maybe space, keeping it simple.
        // 2. Connection start: A -->
        // 3. Connection end: --> B

        // Find single word IDs at start of lines (often used for defining nodes without labels or styling)
        // Fixed range out of order error: a-zA-Z0-9_ instead of a-zA-9_
        const simpleIdPattern = /^\s*([a-zA-Z0-9_]+)\s*$/gm;
        while ((match = simpleIdPattern.exec(code)) !== null) {
            const id = match[1];
            if (id && !nodes.has(id) && !['graph', 'flowchart', 'subgraph', 'end', 'style', 'classDef', 'click'].includes(id)) {
                nodes.set(id, '');
            }
        }

        // Find IDs in relationships: A-->B
        const relationshipPattern = /([a-zA-Z0-9_]+)\s*(?:[-=.]{1,3}[>|)])|(?:[-=.]{1,3}[>|)])\s*([a-zA-Z0-9_]+)/g;
        while ((match = relationshipPattern.exec(code)) !== null) {
            // match[1] is source (A in A-->B)
            if (match[1]) {
                const id = match[1];
                if (!nodes.has(id)) nodes.set(id, '');
            }
            // match[2] is target (B in -->B)
            if (match[2]) {
                const id = match[2];
                if (!nodes.has(id)) nodes.set(id, '');
            }
        }

        // 3. Current word being typed should be considered if it looks like an ID
        // (This helps when you just typed "NewNode" and want to autocomplete it on the next line immediately)
        // We handle this by strictly parsing what is *already* in the text.

        return Array.from(nodes.entries()).map(([id, label]) => ({ id, label: label || id }));
    };

    const MERMAID_ARROWS = [
        { label: '-->', detail: 'Solid Link', documentation: 'A standard arrow connection' },
        { label: '---', detail: 'Solid Line', documentation: 'A connection with no arrow' },
        { label: '-.->', detail: 'Dotted Link', documentation: 'A dotted arrow connection' },
        { label: '==>', detail: 'Thick Link', documentation: 'A thick arrow connection' },
        { label: '--o', detail: 'Circle Link', documentation: 'A link ending with a circle' },
        { label: '<-->', detail: 'Double Arrow', documentation: 'A standard double arrow connection' },
        { label: 'x-x', detail: 'Cross Link', documentation: 'A link ending with crosses' },
    ];

    const MERMAID_SHAPES = [
        { label: '[]', insertText: '[${1:Label}]', detail: 'Rectangle', documentation: 'Square rectangle node' },
        { label: '(())', insertText: '((${1:Label}))', detail: 'Circle', documentation: 'Circle node' },
        { label: '([])', insertText: '([${1:Label}])', detail: 'Stadium', documentation: 'Stadium-shaped node' },
        { label: '[[]]', insertText: '[[${1:Label}]]', detail: 'Subroutine', documentation: 'Subroutine node' },
        { label: '[()]', insertText: '[(${1:Label})]', detail: 'Database', documentation: 'Cylindrical database node' },
        { label: '(())', insertText: '((${1:Label}))', detail: 'Circle', documentation: 'Circle node' },
        { label: '>>]', insertText: '>${1:Label}]', detail: 'Flag', documentation: 'Asymmetric shape' },
        { label: '{}', insertText: '{${1:Label}}', detail: 'Rhombus', documentation: 'Rhombus (Decision) node' },
        { label: '{{}}', insertText: '{{${1:Label}}}', detail: 'Hexagon', documentation: 'Hexagon node' },
        { label: '[//]', insertText: '[/${1:Label}/]', detail: 'Parallelogram', documentation: 'Parallelogram node (Lean Right)' },
        { label: '[\\\\]', insertText: '[\\${1:Label}\\]', detail: 'Parallelogram Alt', documentation: 'Parallelogram node (Lean Left)' },
    ];

    const MERMAID_KEYWORDS = [
        // Diagram Types
        { label: 'graph', detail: 'Diagram Type', documentation: 'Start a flowchart' },
        { label: 'flowchart', detail: 'Diagram Type', documentation: 'Start a flowchart' },
        { label: 'sequenceDiagram', detail: 'Diagram Type', documentation: 'Start a sequence diagram' },
        { label: 'classDiagram', detail: 'Diagram Type', documentation: 'Start a class diagram' },
        { label: 'stateDiagram-v2', detail: 'Diagram Type', documentation: 'Start a state diagram' },
        { label: 'erDiagram', detail: 'Diagram Type', documentation: 'Start an entity relationship diagram' },
        { label: 'gantt', detail: 'Diagram Type', documentation: 'Start a Gantt chart' },
        { label: 'pie', detail: 'Diagram Type', documentation: 'Start a pie chart' },
        { label: 'gitGraph', detail: 'Diagram Type', documentation: 'Start a git graph' },
        { label: 'journey', detail: 'Diagram Type', documentation: 'Start a user journey map' },
        { label: 'mindmap', detail: 'Diagram Type', documentation: 'Start a mindmap' },

        // Sequence Diagram
        { label: 'participant', detail: 'Keyword', documentation: 'Define a participant' },
        { label: 'actor', detail: 'Keyword', documentation: 'Define an actor' },
        { label: 'activate', detail: 'Keyword', documentation: 'Activate a participant' },
        { label: 'deactivate', detail: 'Keyword', documentation: 'Deactivate a participant' },
        { label: 'loop', detail: 'Keyword', documentation: 'Start a loop block' },
        { label: 'alt', detail: 'Keyword', documentation: 'Start an alternate path block' },
        { label: 'opt', detail: 'Keyword', documentation: 'Start an optional path block' },
        { label: 'par', detail: 'Keyword', documentation: 'Start a parallel block' },
        { label: 'critical', detail: 'Keyword', documentation: 'Start a critical block' },
        { label: 'rect', detail: 'Keyword', documentation: 'Start a colored rectangle block' },

        // Class Diagram
        { label: 'class', detail: 'Keyword', documentation: 'Define a class' },
        { label: 'classDef', detail: 'Keyword', documentation: 'Define a class style' },
        { label: 'style', detail: 'Keyword', documentation: 'Apply style to a node' },
        { label: 'click', detail: 'Keyword', documentation: 'Add click event to a node' },

        // Common
        { label: 'subgraph', detail: 'Keyword', documentation: 'Start a subgraph' },
        { label: 'end', detail: 'Keyword', documentation: 'End a block' },
        { label: 'direction', detail: 'Keyword', documentation: 'Set diagram direction (TB, LR, etc.)' },
    ];

    /**
     * Monaco CompletionItemProvider
     */
    const completionProvider: monaco.languages.CompletionItemProvider = {
        triggerCharacters: ['>', '-', '[', '(', '{', '=', '.'],
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const fullText = model.getValue();
            const nodes = extractNodes(fullText);

            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const nodeSuggestions: monaco.languages.CompletionItem[] = nodes.map(node => ({
                label: node.id,
                kind: monaco.languages.CompletionItemKind.Variable,
                detail: node.label || 'Node',
                documentation: node.label ? `Reference to node: ${node.label}` : 'Mermaid Node',
                insertText: node.id,
                range: range,
                sortText: '0' + node.id // High priority
            }));

            // If the word being typed looks like a new Node ID, we should ensure it's suggested
            // This aids in "confirming" the node creation visually
            const currentWord = word.word;
            if (currentWord && !nodes.some(n => n.id === currentWord) && /^[a-zA-Z0-9_]+$/.test(currentWord)) {
                nodeSuggestions.push({
                    label: currentWord,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    detail: 'New Node',
                    documentation: 'Create a new node',
                    insertText: currentWord,
                    range: range,
                    sortText: '00' + currentWord // Top priority
                });
            }


            const arrowSuggestions: monaco.languages.CompletionItem[] = MERMAID_ARROWS.map(arrow => ({
                label: arrow.label,
                kind: monaco.languages.CompletionItemKind.Operator,
                detail: arrow.detail,
                documentation: arrow.documentation,
                insertText: arrow.label,
                range: range,
                sortText: '1' + arrow.label
            }));

            const shapeSuggestions: monaco.languages.CompletionItem[] = MERMAID_SHAPES.map(shape => ({
                label: shape.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                detail: shape.detail,
                documentation: shape.documentation,
                insertText: shape.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
                sortText: '2' + shape.label
            }));

            const keywordSuggestions: monaco.languages.CompletionItem[] = MERMAID_KEYWORDS.map(kw => ({
                label: kw.label,
                kind: monaco.languages.CompletionItemKind.Keyword,
                detail: kw.detail,
                documentation: kw.documentation,
                insertText: kw.label,
                range: range,
                sortText: '3' + kw.label
            }));

            return {
                suggestions: [...nodeSuggestions, ...arrowSuggestions, ...shapeSuggestions, ...keywordSuggestions]
            };
        }
    };

    return {
        completionProvider,
        extractNodes
    };
}
