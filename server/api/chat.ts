import { createAiGateway } from 'ai-gateway-provider';
import { createUnified } from 'ai-gateway-provider/providers/unified';
import { streamText, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const aigateway = createAiGateway({
    accountId: 'e282e294029278edfe4b237da4d9d1bb',
    gateway: 'graphlet',
    apiKey: process.env.CF_AIG_TOKEN,
});

const unified = createUnified();

const systemPrompt = `You are an expert diagram generator.
Your task is to generate ONLY valid Mermaid.js code.
Strict rules:
- Output ONLY Mermaid code.
- Do NOT include explanations.
- Do NOT wrap in markdown.
- Do NOT add comments unless explicitly requested.
- Ensure the syntax is 100% valid and renders without errors.
- Use clean, readable node labels.
- Avoid unnecessary complexity.
- Use consistent indentation.
- Prefer minimal, professional styling.

Diagram type: <sequenceDiagram | flowchart | classDiagram | erDiagram | stateDiagram | gantt | journey, architecture-beta>

Context:

Requirements:
- Keep layout clean and readable
- Avoid crossing lines if possible
- Use logical grouping
- Use subgraphs if helpful
- Follow Mermaid best practices
- Pay close attention to activation and deactivation of nodes
- Use correct mermaid syntax

1. Special Characters in Labels
Avoid ( ), < >, { }, /, &, # inside node labels or edge text. They confuse the parser.
❌  B[Notify Customer (Invalid Order)]
✅  B[Notify Customer - Invalid Order]
2. Parentheses in Edge Labels
❌  A -- Backorder (2 weeks) --> B
✅  A -- Backorder 2 weeks --> B
3. Reusing Node IDs with Different Shapes
Once you define a node ID with a shape, don't redefine it differently later.
❌  A[Start] ... A((End))
✅  A[Start] ... Z((End))
4. Spaces in Node IDs
❌  Order Received((Start))
✅  A((Order Received))
5. Missing Quotes on Complex Labels
If you must use special characters, wrap the label in quotes.
❌  A[Check stock & payment]
✅  A["Check stock & payment"]
6. Long Edge Labels Without Quotes
❌  A -- Payment was declined by bank --> B
✅  A -- Payment declined --> B
   or
✅  A -- "Payment was declined by bank" --> B
7. Avoid SemiColons

Return only the Mermaid code.`

export default defineEventHandler(async (event) => {
    const { messages } = await readBody(event);

    const token = process.env.CF_AIG_TOKEN || '';
    console.log(`[AI Request] Token Masked: ${token.slice(0, 5)}...${token.slice(-4)}`);

    const model = process.env.NODE_ENV === 'development'
        ? wrapLanguageModel({
            model: aigateway(unified('google-ai-studio/gemini-2.5-flash')),
            middleware: devToolsMiddleware()
        })
        : aigateway(unified('google-ai-studio/gemini-2.5-flash'));

    const result = streamText({
        model,
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
});
