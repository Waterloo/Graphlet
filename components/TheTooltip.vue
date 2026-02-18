<script setup lang="ts">
const props = defineProps<{
    text: string;
    shortcut?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}>();

const pos = computed(() => props.position || 'bottom');
</script>

<template>
    <div class="tooltip-wrapper">
        <slot />
        <div class="tooltip-content" :class="`tooltip-${pos}`">
            <span class="tooltip-text">{{ text }}</span>
            <kbd v-if="shortcut" class="tooltip-kbd">{{ shortcut }}</kbd>
        </div>
    </div>
</template>

<style scoped>
.tooltip-wrapper {
    position: relative;
    display: inline-flex;
}

.tooltip-content {
    position: absolute;
    white-space: nowrap;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 8px;
    background: rgba(28, 28, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.85);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 1000;
}

.tooltip-wrapper:hover .tooltip-content {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.4s;
}

/* Positions */
.tooltip-bottom {
    top: calc(100% + 6px);
    left: 50%;
    translate: -50% 0;
}

.tooltip-top {
    bottom: calc(100% + 6px);
    left: 50%;
    translate: -50% 0;
}

.tooltip-left {
    right: calc(100% + 6px);
    top: 50%;
    translate: 0 -50%;
}

.tooltip-right {
    left: calc(100% + 6px);
    top: 50%;
    translate: 0 -50%;
}

.tooltip-text {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 500;
    letter-spacing: -0.01em;
}

.tooltip-kbd {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.5);
    line-height: 1;
}
</style>
