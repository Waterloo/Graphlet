import { ref, computed } from 'vue';
import { useEditorState } from '~/composables/useEditorState';
import { useLocalStorage } from '@vueuse/core';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    initialCode: string;
}

export interface TutorialCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    steps: TutorialStep[];
}

export const TUTORIAL_CATEGORIES: TutorialCategory[] = [
    {
        id: 'flowchart',
        name: 'Flowcharts',
        description: 'Nodes, edges, and shapes to represent processes.',
        icon: 'GitCommit',
        steps: [
            {
                id: 'flowchart-1',
                title: 'Flowchart 101: Basics',
                description: `Welcome to the interactive Mermaid tutorial! 🎓\n\nFlowcharts start with a declaration like \`flowchart TD\` (Top-Down) or \`LR\` (Left-Right).\n\nYou define nodes using an ID, optionally followed by text in brackets, e.g., \`A[Start]\`.\n\nYou connect nodes using arrows like \`-->\`.\n\n**Task**: Add a new line connecting \`Start\` to a new node \`B[End]\` using \`-->\`.`,
                initialCode: `flowchart LR\n    A[Start]\n    `,
            },
            {
                id: 'flowchart-2',
                title: 'Flowchart 102: Shapes',
                description: `You can change the shape of nodes by using different brackets:\n- \`[Rectangle]\`\n- \`(Rounded Rectangle)\`\n- \`([Stadium])\`\n- \`{Diamond / Decision}\`\n- \`((Circle))\`\n\n**Task**: Add a Decision node. Connect \`A\` to \`C{Is it true?}\`.`,
                initialCode: `flowchart TD\n    A((Start)) --> B[Process]\n    \n    %% Add your decision node here\n    `,
            },
            {
                id: 'flowchart-3',
                title: 'Flowchart 103: Styling Links',
                description: `Links can have text labels or different styles:\n- \`-- Text --- >\` or \`-->|Text|\` for labels\n- \`-.->\` for dotted links\n- \`==>\` for thick links\n\n**Task**: Change the link between \`A\` and \`B\` to a dotted link \`-.->\` and add a label to the link to \`C\`.`,
                initialCode: `flowchart LR\n    A[Start] --> B[Option 1]\n    A -->|Label| C[Option 2]\n    `,
            }
        ]
    },
    {
        id: 'sequence',
        name: 'Sequence Diagrams',
        description: 'Interactions between processes over time.',
        icon: 'ArrowRightLeft',
        steps: [
            {
                id: 'sequence-1',
                title: 'Sequence 101: Participants',
                description: `Sequence diagrams show interactions over time. Start with \`sequenceDiagram\`.\n\nEntities are defined with \`participant\` or \`actor\`.\n\nSend messages using:\n- \`->>\` (solid line, arrow)\n- \`-->>\` (dotted line, arrow)\n\n**Task**: Make frontend send a \`Login Request\` message to backend: \`Frontend->>Backend: Login Request\`.`,
                initialCode: `sequenceDiagram\n    actor User\n    participant Frontend\n    participant Backend\n    \n    User->>Frontend: Click Login\n    `,
            },
            {
                id: 'sequence-2',
                title: 'Sequence 102: Activations',
                description: `You can show when a participant is active using \`activate\` and \`deactivate\`, or by appending \`+\` / \`-\` to the arrow.\n\nYou can also add notes: \`Note over Actor: text\`.\n\n**Task**: Add a note over the Database stating "Validating credentials".`,
                initialCode: `sequenceDiagram\n    participant Backend\n    participant Database\n    \n    Backend->>+Database: Query User\n    Database-->>-Backend: Response\n    `,
            },
            {
                id: 'sequence-3',
                title: 'Sequence 103: Loops & Alt',
                description: `Use \`loop\` for repetition and \`alt\`/\`else\` for logic.\n\n\`\`\`\nalt is Success\n  A-->>B: OK\nelse is Failure\n  A-->>B: Error\nend\n\`\`\`\n\n**Task**: Add an \`else\` block handling the failure case sending "Invalid Credentials" back to the user.`,
                initialCode: `sequenceDiagram\n    actor User\n    participant Auth\n    \n    User->>Auth: Login\n    alt is Valid\n        Auth-->>User: Token\n    end\n    `,
            }
        ]
    },
    {
        id: 'state',
        name: 'State Diagrams',
        description: 'State machines and transitions.',
        icon: 'CircleDot',
        steps: [
            {
                id: 'state-1',
                title: 'State 101: Basics',
                description: `State diagrams describe how a system moves from one state to another.\n\nThey start with \`stateDiagram-v2\`.\nThe special syntax \`[*]\` indicates the start and end of the state machine.\n\n**Task**: Add a transition from \`Idle\` to \`Processing\` triggered by a \`Task added\` event: \`Idle --> Processing : Task added\`.`,
                initialCode: `stateDiagram-v2\n    [*] --> Idle\n    Processing --> [*]\n    `,
            },
            {
                id: 'state-2',
                title: 'State 102: Nested States',
                description: `States can contain other states.\nUse \`state StateName {\` to define boundaries.\n\n**Task**: Inside the \`Active\` state, add two internal states: \`Reading\` and \`Writing\`, with a transition between them.`,
                initialCode: `stateDiagram-v2\n    [*] --> Active\n    \n    state Active {\n        [*] --> Reading\n    }\n    `,
            }
        ]
    },
    {
        id: 'class',
        name: 'Class Diagrams',
        description: 'Object-oriented structures and relationships.',
        icon: 'Network',
        steps: [
            {
                id: 'class-1',
                title: 'Class 101: Basics',
                description: `Class diagrams define object-oriented structures.\n\nDefine an attribute by listing its type and name (\`+String title\`). Define a method with parentheses (\`+save()\`).\n\n**Task**: Add a \`logout()\` method to the \`User\` class.`,
                initialCode: `classDiagram\n    class User {\n        +String username\n        +login()\n    }\n    class Admin {\n        +banUser()\n    }\n    `,
            },
            {
                id: 'class-2',
                title: 'Class 102: Relationships',
                description: `Relationships connect classes:\n- \`<|--\` (Inheritance)\n- \`*--\` (Composition)\n- \`o--\` (Aggregation)\n- \`-->\` (Association)\n\n**Task**: Make \`Admin\` inherit from \`User\` by adding \`User <|-- Admin\`.`,
                initialCode: `classDiagram\n    class User\n    class Admin\n    \n    %% Add inheritance here\n    `,
            }
        ]
    },
    {
        id: 'er',
        name: 'Entity Relationship',
        description: 'Database schemas and data models.',
        icon: 'Database',
        steps: [
            {
                id: 'er-1',
                title: 'ER 101: Entities & Attributes',
                description: `ER diagrams start with \`erDiagram\`.\nDefine entities and their attributes inside curly braces.\n\n**Task**: Add an \`email\` attribute of type \`string\` to the \`USER\` entity.`,
                initialCode: `erDiagram\n    USER {\n        int id PK\n        string name\n    }\n    `,
            },
            {
                id: 'er-2',
                title: 'ER 102: Relationships',
                description: `Define relationships like \`Entity1 ||--o{ Entity2 : "Label"\`.\n- \`||\` exactly one\n- \`}o\` zero or more\n- \`|o\` zero or one\n- \`}|\` one or more\n\n**Task**: Connect \`USER\` to \`POST\` with a one-to-many relationship (one user has zero or more posts): \`USER ||--o{ POST : writes\`.`,
                initialCode: `erDiagram\n    USER {\n        int id PK\n    }\n    POST {\n        int id PK\n        int user_id FK\n    }\n    \n    %% Add your relationship here\n    `,
            }
        ]
    }
];

// Composable State
const isTutorialActive = ref(false);
const activeCategoryIndex = useLocalStorage('graphlet-tutorial-category', -1);
const activeStepIndexes = useLocalStorage<Record<string, number>>('graphlet-tutorial-steps', {});
const completedCategories = useLocalStorage<string[]>('graphlet-tutorial-completed-categories', []);

export const useTutorial = () => {
    const { code, title, eyebrow, badges } = useEditorState();

    const activeCategory = computed(() => {
        if (activeCategoryIndex.value >= 0 && activeCategoryIndex.value < TUTORIAL_CATEGORIES.length) {
            return TUTORIAL_CATEGORIES[activeCategoryIndex.value];
        }
        return null;
    });

    const currentStepIndex = computed({
        get: () => {
            if (!activeCategory.value) return 0;
            return activeStepIndexes.value[activeCategory.value.id] || 0;
        },
        set: (val) => {
            if (activeCategory.value) {
                activeStepIndexes.value = {
                    ...activeStepIndexes.value,
                    [activeCategory.value.id]: val
                };
            }
        }
    });

    const currentStep = computed(() => {
        if (!activeCategory.value) return null;
        return activeCategory.value.steps[currentStepIndex.value];
    });

    const totalSteps = computed(() => {
        if (!activeCategory.value) return 0;
        return activeCategory.value.steps.length;
    });

    const progress = computed(() => {
        if (totalSteps.value === 0) return 0;
        return ((currentStepIndex.value + 1) / totalSteps.value) * 100;
    });

    const startTutorial = () => {
        isTutorialActive.value = true;
        if (activeCategoryIndex.value !== -1) {
            applyStepCode(currentStepIndex.value);
        }
    };

    const stopTutorial = () => {
        isTutorialActive.value = false;
    };

    const selectCategory = (index: number) => {
        activeCategoryIndex.value = index;
        applyStepCode(currentStepIndex.value);
    };

    const backToMenu = () => {
        activeCategoryIndex.value = -1;
    };

    const applyStepCode = (index: number) => {
        if (!activeCategory.value) return;
        const step = activeCategory.value.steps[index];
        if (step) {
            code.value = step.initialCode;
            title.value = step.title;
            eyebrow.value = 'Tutorial Mode - ' + activeCategory.value.name;
            badges.value = ['Learn', 'Mermaid'];
        }
    };

    const nextStep = () => {
        if (!activeCategory.value) return;

        if (currentStepIndex.value < totalSteps.value - 1) {
            currentStepIndex.value++;
            applyStepCode(currentStepIndex.value);
        } else {
            if (!completedCategories.value.includes(activeCategory.value.id)) {
                completedCategories.value.push(activeCategory.value.id);
            }
            backToMenu();
        }
    };

    const prevStep = () => {
        if (currentStepIndex.value > 0) {
            currentStepIndex.value--;
            applyStepCode(currentStepIndex.value);
        }
    };

    const resetCategoryProgress = () => {
        if (!activeCategory.value) return;
        currentStepIndex.value = 0;
        completedCategories.value = completedCategories.value.filter(id => id !== activeCategory.value?.id);
        applyStepCode(0);
    };

    return {
        isTutorialActive,
        activeCategoryIndex,
        completedCategories,
        activeCategory,
        currentStepIndex,
        currentStep,
        totalSteps,
        progress,
        categories: TUTORIAL_CATEGORIES,

        startTutorial,
        stopTutorial,
        selectCategory,
        backToMenu,
        nextStep,
        prevStep,
        resetCategoryProgress
    };
};
