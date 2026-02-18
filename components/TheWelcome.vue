<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState';
import { useDiagramStore } from '~/composables/useDiagramStore';
import { DIAGRAM_TEMPLATES } from '~/composables/useEditorState';
import { X, Sparkles, Pencil, Eye, Share2, ArrowRight } from 'lucide-vue-next';

const { isWelcomeOpen, hasBeenWelcomed, loadTemplate } = useEditorState();
const { createDiagram } = useDiagramStore();

// Show on first visit
onMounted(() => {
    if (!hasBeenWelcomed.value) {
        isWelcomeOpen.value = true;
    }
});

const selectTemplate = (id: string) => {
    const template = DIAGRAM_TEMPLATES.find(t => t.id === id);
    if (template) {
        createDiagram({
            code: template.code,
            title: template.title,
            eyebrow: template.eyebrow,
            badges: template.badges,
        });
    }
    dismiss();
};

const startScratch = () => {
    createDiagram({ title: 'Untitled' });
    dismiss();
};

const dismiss = () => {
    isWelcomeOpen.value = false;
    hasBeenWelcomed.value = true;
};

// Close on Escape
onMounted(() => {
    const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isWelcomeOpen.value) {
            dismiss();
        }
    };
    window.addEventListener('keydown', handler);
    onUnmounted(() => window.removeEventListener('keydown', handler));
});
</script>

<template>
    <Teleport to="body">
        <Transition name="welcome">
            <div v-if="isWelcomeOpen" class="welcome-backdrop" @click.self="dismiss">
                <div class="welcome-modal">
                    <!-- Close -->
                    <button class="close-btn" @click="dismiss" aria-label="Close welcome">
                        <X :size="18" />
                    </button>

                    <!-- Hero -->
                    <div class="hero">
                        <div class="hero-icon">
                            <Sparkles :size="28" />
                        </div>
                        <h1 class="hero-title">Create beautiful diagrams</h1>
                        <p class="hero-subtitle">
                            Write Mermaid syntax, preview instantly, export &amp; share with the world.
                        </p>
                    </div>

                    <!-- How it works -->
                    <div class="steps">
                        <div class="step">
                            <div class="step-icon">
                                <Pencil :size="16" />
                            </div>
                            <div class="step-label">Write</div>
                        </div>
                        <ArrowRight :size="14" class="step-arrow" />
                        <div class="step">
                            <div class="step-icon">
                                <Eye :size="16" />
                            </div>
                            <div class="step-label">Preview</div>
                        </div>
                        <ArrowRight :size="14" class="step-arrow" />
                        <div class="step">
                            <div class="step-icon">
                                <Share2 :size="16" />
                            </div>
                            <div class="step-label">Share</div>
                        </div>
                    </div>

                    <!-- Template Grid -->
                    <div class="templates-section">
                        <h3 class="section-title">Start with a template</h3>
                        <div class="template-grid">
                            <button v-for="tmpl in DIAGRAM_TEMPLATES" :key="tmpl.id" class="template-card"
                                @click="selectTemplate(tmpl.id)">
                                <span class="template-icon">
                                    <component :is="tmpl.icon" :size="24" />
                                </span>
                                <span class="template-label">{{ tmpl.label }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                        <button class="start-scratch" @click="startScratch">
                            or start from scratch
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Backdrop */
.welcome-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    padding: 24px;
}

/* Modal */
.welcome-modal {
    position: relative;
    width: 100%;
    max-width: 520px;
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 36px 32px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    overflow-y: auto;
    max-height: 90vh;
}

.close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.4);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
}

/* Hero */
.hero {
    text-align: center;
    margin-bottom: 28px;
}

.hero-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(5, 150, 105, 0.15));
    border: 1px solid rgba(79, 70, 229, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: #a78bfa;
}

.hero-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 8px;
    letter-spacing: -0.03em;
}

.hero-subtitle {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
    line-height: 1.5;
}

/* Steps */
.steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 32px;
    padding: 16px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.step-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
}

.step-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.04em;
}

.step-arrow {
    color: rgba(255, 255, 255, 0.15);
    margin-top: -16px;
}

/* Templates */
.templates-section {
    margin-bottom: 20px;
}

.section-title {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 14px;
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.template-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.template-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.14);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.template-icon {
    font-size: 24px;
    line-height: 1;
    color: #fff;
}

.template-label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
}

/* Footer */
.footer {
    text-align: center;
}

.start-scratch {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s;
}

.start-scratch:hover {
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.04);
}

/* Transitions */
.welcome-enter-active {
    transition: opacity 0.3s ease;
}

.welcome-enter-active .welcome-modal {
    animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.welcome-leave-active {
    transition: opacity 0.2s ease;
}

.welcome-leave-active .welcome-modal {
    animation: modalOut 0.2s ease forwards;
}

.welcome-enter-from,
.welcome-leave-to {
    opacity: 0;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes modalOut {
    from {
        opacity: 1;
        transform: scale(1) translateY(0);
    }

    to {
        opacity: 0;
        transform: scale(0.97) translateY(6px);
    }
}

/* Mobile */
@media (max-width: 600px) {
    .welcome-modal {
        padding: 32px 24px 24px;
        border-radius: 20px;
    }

    .template-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .hero-title {
        font-size: 22px;
    }
}
</style>
