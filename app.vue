<script setup lang="ts">
import { onMounted } from 'vue'
import { init } from '@plausible-analytics/tracker'

init({
    domain: 'graphlet.xyz',
    endpoint:'https://chitraguptan.graphlet.xyz/api/event'
})

onMounted(() => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((registration) => {
                console.log('SW registered: ', registration);
            }).catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
})
</script>

<template>
    <NuxtPage />
</template>

<style>
/* Global overrides/utilities */
html,
body,
#__nuxt {
    height: 100%;
    margin: 0;
    overflow: hidden;
    /* App-like feel */
    background-color: var(--surface-base);
}

.pane {
    height: 100%;
    overflow: hidden;
    position: relative;
}
</style>
