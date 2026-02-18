
import { useRefHistory, useLocalStorage } from '@vueuse/core';
import { THEMES, DEFAULT_THEME } from '~/config/themes';
import {
    Workflow,
    ArrowLeftRight,
    Box,
    CircleDot,
    Database,
    Calendar,
    PieChart,
    Network
} from 'lucide-vue-next';

// ─── Diagram Templates ───────────────────────────────────────────────
export interface DiagramTemplate {
    id: string;
    label: string;
    icon: any;
    code: string;
    title: string;
    eyebrow: string;
    badges: string[];
}

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
    {
        id: 'flowchart',
        label: 'Flowchart',
        icon: Workflow,
        title: 'User Onboarding',
        eyebrow: 'Process Flow',
        badges: ['UX', 'Flow'],
        code: `flowchart TD
    Start([🚀 User Visits]) --> Check{Has Account?}
    Check -->|Yes| Login[Login Page]
    Check -->|No| Signup[Create Account]
    Signup --> Verify[📧 Verify Email]
    Verify --> Setup[Setup Profile]
    Login --> Dashboard[📊 Dashboard]
    Setup --> Dashboard
    Dashboard --> Explore[Explore Features]
    Explore --> Done([✨ Happy User])

    style Start fill:#4f46e5,color:#fff,stroke:none
    style Done fill:#059669,color:#fff,stroke:none`
    },
    {
        id: 'sequence',
        label: 'Sequence',
        icon: ArrowLeftRight,
        title: 'Authentication Flow',
        eyebrow: 'Sequence Flow',
        badges: ['JWT', 'TLS'],
        code: `sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>+Frontend: Login Request
    Frontend->>+Backend: Authenticate User
    Backend->>+Database: Query User Data
    Database-->>-Backend: Return User Info
    Backend-->>-Frontend: Authentication Result
    Frontend-->>-User: Login Response

    Note over Frontend,Backend: Secure JWT Token Exchange
    Note over Backend,Database: Encrypted Communication`
    },
    {
        id: 'class',
        label: 'Class',
        icon: Box,
        title: 'E-Commerce Model',
        eyebrow: 'Class Diagram',
        badges: ['OOP', 'Design'],
        code: `classDiagram
    class Product {
        +String name
        +Number price
        +String category
        +getDiscount() Number
    }
    class Cart {
        +Product[] items
        +addItem(Product)
        +removeItem(Product)
        +getTotal() Number
    }
    class Order {
        +String id
        +Date createdAt
        +String status
        +checkout() Boolean
    }
    class User {
        +String name
        +String email
        +Cart cart
        +placeOrder() Order
    }

    User "1" --> "1" Cart
    Cart "1" --> "*" Product
    User "1" --> "*" Order
    Order "*" --> "*" Product`
    },
    {
        id: 'state',
        label: 'State',
        icon: CircleDot,
        title: 'Order Lifecycle',
        eyebrow: 'State Machine',
        badges: ['FSM', 'Logic'],
        code: `stateDiagram-v2
    [*] --> Pending
    Pending --> Processing : Payment Received
    Processing --> Shipped : Items Packed
    Shipped --> Delivered : Arrival Confirmed
    Delivered --> [*]

    Processing --> Cancelled : Customer Cancel
    Pending --> Cancelled : Timeout
    Cancelled --> [*]

    Shipped --> Returned : Return Request
    Returned --> Refunded : Inspection Passed
    Refunded --> [*]`
    },
    {
        id: 'er',
        label: 'ER Diagram',
        icon: Database,
        title: 'Blog Database',
        eyebrow: 'Entity Relationship',
        badges: ['SQL', 'Schema'],
        code: `erDiagram
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : makes
    POST ||--o{ COMMENT : has
    POST ||--|{ TAG : tagged
    USER {
        int id PK
        string username
        string email
        date joined
    }
    POST {
        int id PK
        string title
        text content
        date published
        int author_id FK
    }
    COMMENT {
        int id PK
        text body
        date created
        int user_id FK
        int post_id FK
    }
    TAG {
        int id PK
        string name
        string slug
    }`
    },
    {
        id: 'gantt',
        label: 'Gantt',
        icon: Calendar,
        title: 'Product Launch',
        eyebrow: 'Timeline',
        badges: ['Planning', 'Sprint'],
        code: `gantt
    title Product Launch Timeline
    dateFormat YYYY-MM-DD
    section Design
        Wireframes       :done, d1, 2025-01-01, 14d
        Visual Design    :done, d2, after d1, 10d
        Prototyping      :active, d3, after d2, 7d
    section Development
        Frontend         :dev1, after d3, 21d
        Backend API      :dev2, after d3, 18d
        Integration      :dev3, after dev1, 7d
    section Launch
        Beta Testing     :test, after dev3, 14d
        Launch Day       :milestone, after test, 0d`
    },
    {
        id: 'pie',
        label: 'Pie Chart',
        icon: PieChart,
        title: 'Traffic Sources',
        eyebrow: 'Analytics',
        badges: ['Data', 'Viz'],
        code: `pie title Website Traffic Sources
    "Organic Search" : 42
    "Direct" : 25
    "Social Media" : 18
    "Referral" : 10
    "Email" : 5`
    },
    {
        id: 'mindmap',
        label: 'Mind Map',
        icon: Network,
        title: 'Project Ideas',
        eyebrow: 'Brainstorm',
        badges: ['Ideas', 'Map'],
        code: `mindmap
    root((Project))
        Features
            Auth
            Dashboard
            API
            Search
        Design
            Typography
            Colors
            Layout
            Motion
        Tech Stack
            Frontend
                Vue
                Nuxt
            Backend
                Node
                PostgreSQL
        Launch
            Beta
            Marketing
            Docs`
    }
];

// ─── Default (self-documenting flowchart) ────────────────────────────
const DEFAULT_CODE = `flowchart TD
    A[💡 Your Idea] --> B{Choose a Diagram}
    B --> C[📊 Flowchart]
    B --> D[🔄 Sequence]
    B --> E[📦 Class Diagram]
    B --> F[🗄️ ER Diagram]
    B --> G[📅 Gantt Chart]
    B --> H[🧠 Mind Map]
    C --> I[✨ Export & Share!]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    style A fill:#4f46e5,color:#fff,stroke:none
    style I fill:#059669,color:#fff,stroke:none`;

// ─── Global State (Singleton) ────────────────────────────────────────
const code = useLocalStorage('graphlet-code', DEFAULT_CODE);
const themeId = useLocalStorage('graphlet-theme', DEFAULT_THEME);
const title = useLocalStorage('graphlet-title', 'Getting Started');
const eyebrow = useLocalStorage('graphlet-eyebrow', 'Welcome');
const badges = useLocalStorage('graphlet-badges', ['Graphlet', 'Mermaid']);
const isSettingsOpen = ref(false);
const isShareOpen = ref(false);
const isWelcomeOpen = ref(false);
const isShortcutsOpen = ref(false);
const currentSvg = ref<string>('');
const errorLine = ref<number | null>(null);
const { history, undo, redo } = useRefHistory(code);

// First visit tracking
const hasBeenWelcomed = useLocalStorage('graphlet-welcomed', false);

export const useEditorState = () => {
    const currentTheme = computed(() => {
        return THEMES.find(t => t.id === themeId.value) || THEMES[0];
    });

    const loadTemplate = (templateId: string) => {
        const template = DIAGRAM_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            code.value = template.code;
            title.value = template.title;
            eyebrow.value = template.eyebrow;
            badges.value = [...template.badges];
        }
    };

    return {
        code,
        themeId,
        title,
        eyebrow,
        badges,
        currentSvg,
        currentTheme,
        themes: THEMES,
        undo,
        redo,
        isSettingsOpen,
        isShareOpen,
        isWelcomeOpen,
        isShortcutsOpen,
        errorLine,
        hasBeenWelcomed,
        loadTemplate,
    };
};
