<script setup lang="ts">
import { useTutorial } from '~/composables/useTutorial';
import {
    X, ChevronRight, ChevronLeft, RotateCcw, ArrowLeft,
    GitCommit, ArrowRightLeft, CircleDot, Network, Database, Check
} from 'lucide-vue-next';

// Map icon strings to the actual Lucide components dynamically
const iconMap: Record<string, any> = {
    GitCommit,
    ArrowRightLeft,
    CircleDot,
    Network,
    Database
};

const {
    isTutorialActive,
    activeCategory,
    categories,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    completedCategories,
    selectCategory,
    backToMenu,
    stopTutorial,
    nextStep,
    prevStep,
    resetCategoryProgress
} = useTutorial();

const parseMarkdown = (text: string | undefined) => {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="tutorial-code-inline">$1</code>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
};
</script>

<template>
    <Transition name="sidebar">
        <aside v-if="isTutorialActive" class="tutorial-sidebar">

            <!-- CATEGORY MENU -->
            <div v-if="!activeCategory" class="tutorial-menu">
                <div class="tutorial-menu-header">
                    <h3 class="tutorial-title">Select a Tutorial</h3>
                    <button class="tutorial-close-btn" @click="stopTutorial" title="Close Tutorial">
                        <X :size="16" />
                    </button>
                </div>

                <div class="tutorial-menu-body">
                    <p class="tutorial-menu-desc">Choose a diagram type to learn.</p>

                    <div class="tutorial-categories">
                        <button v-for="(cat, index) in categories" :key="cat.id" class="tutorial-category-card"
                            @click="selectCategory(index)">
                            <div class="category-icon">
                                <component :is="iconMap[cat.icon]" :size="20" />
                            </div>
                            <div class="category-content">
                                <div class="category-title-row">
                                    <span class="category-title">{{ cat.name }}</span>
                                    <span v-if="completedCategories.includes(cat.id)" class="category-badge">
                                        <Check :size="12" /> Done
                                    </span>
                                </div>
                                <span class="category-desc">{{ cat.description }}</span>
                                <span class="category-steps">{{ cat.steps.length }} Steps</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ACTIVE TUTORIAL PATH -->
            <div v-else class="tutorial-path">
                <div class="tutorial-header">
                    <div class="tutorial-progress-bar">
                        <div class="tutorial-progress-fill" :style="{ width: `${progress}%` }"></div>
                    </div>
                    <div class="tutorial-header-content">
                        <div class="tutorial-title-area">
                            <span class="tutorial-step-count">Step {{ currentStepIndex + 1 }} of {{ totalSteps }} • {{
                                activeCategory.name }}</span>
                            <h3 class="tutorial-title">{{ currentStep?.title }}</h3>
                        </div>
                        <button class="tutorial-close-btn" @click="stopTutorial" title="Close Tutorial">
                            <X :size="16" />
                        </button>
                    </div>
                    <div class="tutorial-header-actions">
                        <button class="tutorial-back-btn" @click="backToMenu">
                            <ArrowLeft :size="12" />
                            Back to Menu
                        </button>
                    </div>
                </div>

                <div class="tutorial-body">
                    <p class="tutorial-desc" v-html="parseMarkdown(currentStep?.description)"></p>
                </div>

                <div class="tutorial-footer">
                    <button class="tutorial-btn tutorial-btn-prev"
                        @click="currentStepIndex === 0 ? resetCategoryProgress() : prevStep()">
                        <template v-if="currentStepIndex === 0">
                            <RotateCcw :size="14" />
                            Restart
                        </template>
                        <template v-else>
                            <ChevronLeft :size="14" />
                            Back
                        </template>
                    </button>

                    <button class="tutorial-btn tutorial-btn-next primary" @click="nextStep()">
                        <template v-if="currentStepIndex === totalSteps - 1">
                            Finish
                            <Check :size="14" />
                        </template>
                        <template v-else>
                            Next
                            <ChevronRight :size="14" />
                        </template>
                    </button>
                </div>
            </div>

        </aside>
    </Transition>
</template>

<style scoped>
.tutorial-sidebar {
    width: 320px;
    height: 100%;
    background: rgba(19, 19, 31, 0.97);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 30;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

@media (max-width: 768px) {
    .tutorial-sidebar {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 50;
    }
}

/* Transition */
.sidebar-enter-active,
.sidebar-leave-active {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

/* Menu Styles */
.tutorial-menu,
.tutorial-path {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.tutorial-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 16px 12px;
}

.tutorial-menu-body {
    padding: 0 16px 16px;
    flex: 1;
    overflow-y: auto;
}

.tutorial-menu-desc {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 20px 0;
}

.tutorial-categories {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tutorial-category-card {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    width: 100%;
}

.tutorial-category-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
}

.category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(0, 122, 255, 0.15);
    color: #007AFF;
    flex-shrink: 0;
}

.category-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.category-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.category-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
}

.category-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #10B981;
    background: rgba(16, 185, 129, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 600;
}

.category-desc {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.4;
}

.category-steps {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 4px;
}

.tutorial-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 0 16px 16px;
    transition: color 0.2s;
}

.tutorial-back-btn:hover {
    color: #fff;
}

/* Path Styles */
.tutorial-progress-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    width: 100%;
}

.tutorial-progress-fill {
    height: 100%;
    background: #007AFF;
    transition: width 0.3s ease;
}

.tutorial-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 16px 12px;
}

.tutorial-title-area {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tutorial-step-count {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #007AFF;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.tutorial-title {
    margin: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
}

.tutorial-close-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-top: -4px;
    margin-right: -4px;
}

.tutorial-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.tutorial-body {
    padding: 0 16px 16px;
    flex: 1;
    overflow-y: auto;
}

.tutorial-desc {
    margin: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
}

:deep(strong) {
    color: #fff;
    font-weight: 600;
}

:deep(.tutorial-code-inline) {
    font-family: 'DM Mono', monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 11px;
    color: #f0eeff;
}

.tutorial-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
}

.tutorial-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    color: rgba(255, 255, 255, 0.7);
}

.tutorial-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.tutorial-btn.primary {
    background: #007AFF;
    color: #fff;
}

.tutorial-btn.primary:hover {
    background: #006ADC;
}
</style>
