<script setup lang="ts">
import { Sparkles, ArrowRight, X, Loader2 } from 'lucide-vue-next';
import { useEditorState } from '~/composables/useEditorState';
import { useTextareaAutosize } from '@vueuse/core';

const props = defineProps<{
    isOpen: boolean
}>();

const emit = defineEmits(['close']);

const { code: editorCode } = useEditorState();
const { textarea, input } = useTextareaAutosize();
const isLoading = ref(false);

// Focus input when opened
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        nextTick(() => {
            textarea.value?.focus();
        });
    }
});

const generateId = () => Math.random().toString(36).substring(7);

const handleSubmit = async () => {
    if (!input.value.trim() || isLoading.value) return;

    isLoading.value = true;
    const instruction = input.value;
    // Clear input immediately or keep it? Keeping it allows refinement thoughts, but let's clear for "command" feel.
    // user might want to see what they successfully sent. Let's keep it for now or clear.
    // Clearing it.

    // Construct prompt with context
    const currentCode = editorCode.value;
    const fullPrompt = `Current Mermaid Code:\n\`\`\`mermaid\n${currentCode}\n\`\`\`\n\nInstruction: ${instruction}`;

    const apiMessages = [{ role: 'user', content: fullPrompt }];

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) throw new Error('Failed to fetch');
        if (!response.body) throw new Error('No body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let newCode = '';
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            newCode += chunk;

            // Check for markdown code block
            let cleanCode = newCode;
            const codeBlockMatch = newCode.match(/```mermaid\n?([\s\S]*)/) || newCode.match(/```\n?([\s\S]*)/);

            if (codeBlockMatch && codeBlockMatch[1]) {
                // If we found a block start, use its content
                cleanCode = codeBlockMatch[1];
                // Remove potential closing backticks
                cleanCode = cleanCode.replace(/```$/, '');
                editorCode.value = cleanCode;
            } else {
                // No code block found yet.
                // If the system prompt forces "ONLY Mermaid code", we assume raw text IS the code.
                // However, we avoid updating if it looks like a conversational refusal at the very start.
                if (isFirstChunk && /^(sorry|i cannot|here is|sure)/i.test(newCode.trim())) {
                    // likely conversation, wait for block? or just ignore?
                } else {
                    // Otherwise, stream it in directly as code
                    editorCode.value = cleanCode;
                }
            }

            isFirstChunk = false;
        }

        // Final cleanup
        const finalMatch = newCode.match(/```mermaid\n?([\s\S]*?)```/) || newCode.match(/```\n?([\s\S]*?)```/);
        if (finalMatch && finalMatch[1]) {
            editorCode.value = finalMatch[1].trim();
        } else if (newCode && (!editorCode.value || editorCode.value === newCode)) {
            // If we were updating raw, just ensure we trim
            editorCode.value = newCode.trim();
        }

        input.value = '';
        // emit('close'); // Keep open for follow-up adjustments


        // Let's stay open for follow-up

    } catch (e) {
        console.error(e);
        // Show error state?
    } finally {
        isLoading.value = false;
    }
};

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
};
</script>

<template>
    <div v-if="isOpen" class="ai-inline-bar">
        <div class="input-wrapper">
            <div class="icon-slot">
                <Loader2 v-if="isLoading" :size="18" class="animate-spin text-purple" />
                <Sparkles v-else :size="18" class="text-purple" />
            </div>

            <textarea ref="textarea" v-model="input" placeholder="Ask AI to edit this diagram..." class="ai-input"
                @keydown="handleKeydown" :disabled="isLoading" rows="1"></textarea>

            <button v-if="input" @click="handleSubmit" class="action-btn enter-btn" :disabled="isLoading">
                <ArrowRight :size="16" />
            </button>
            <button v-else @click="$emit('close')" class="action-btn close-btn">
                <X :size="16" />
            </button>
        </div>
        <!-- Optional: Show loading status text or preview snippet here if needed -->
    </div>
</template>

<style scoped>
.ai-inline-bar {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    max-width: 90%;
    z-index: 100;
    pointer-events: auto;
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    /* Align to bottom so it grows upwards */
    background: #1C1C1E;
    border: 1px solid rgba(168, 85, 247, 0.3);
    /* Purple tint border */
    border-radius: 12px;
    padding: 4px 6px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.1);
    transition: all 0.2s ease;
    backdrop-filter: blur(12px);
}

.input-wrapper:focus-within {
    border-color: rgba(168, 85, 247, 0.6);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(168, 85, 247, 0.2);
    /* transform: translateY(-2px); // Removed to avoid jumping when resizing */
}

.icon-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: #A855F7;
    flex-shrink: 0;
    margin-bottom: 2px;
    /* Optical alignment with single line text */
}

.ai-input {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 10px 8px;
    outline: none;
    min-height: 40px;
    max-height: 200px;
    resize: none;
    overflow-y: auto;
    line-height: 1.4;
}

.ai-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: #888;
    flex-shrink: 0;
    margin-bottom: 4px;
    /* Align with input bottom */
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.enter-btn {
    background: rgba(168, 85, 247, 0.2);
    color: #C084FC;
}

.enter-btn:hover {
    background: rgba(168, 85, 247, 0.4);
    color: white;
}

.text-purple {
    color: #A855F7;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
