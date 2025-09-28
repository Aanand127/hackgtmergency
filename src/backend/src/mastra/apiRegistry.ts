import { registerApiRoute } from '@mastra/core/server';
import { Workflow } from '@mastra/core/workflows';
import { ChatInputSchema, ChatOutput, chatWorkflow } from './workflows/chatWorkflow';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createSSEStream } from '../utils/streamUtils';

import { medicineWorkflow, MedicineInputSchema, MedicineOutputSchema } from './workflows/medicineWorkflow';
import { researchWorkflow, ResearchInputSchema, ResearchOutputSchema } from './workflows/researchWorkflow';
import { generateReportWorkflow, ReportInputSchema, ReportOutputSchema } from './workflows/reportWorkflow';

// Helper function
function toOpenApiSchema(schema: Parameters<typeof zodToJsonSchema>[0]) {
  return zodToJsonSchema(schema) as Record<string, unknown>;
}

export const apiRoutes = [
  // ... (your existing /chat and /chat/stream routes are unchanged) ...
  registerApiRoute('/chat', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: { 'application/json': { schema: toOpenApiSchema(ChatInputSchema) } },
      },
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = ChatInputSchema.parse(body);
        const run = await chatWorkflow.createRunAsync();
        const result = await run.start({ inputData: parsedBody });
        if (result.status === 'success') {
          return c.json<ChatOutput>(result.result as ChatOutput);
        }
        throw new Error('Workflow did not complete successfully');
      } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  registerApiRoute('/chat/stream', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: { 'application/json': { schema: toOpenApiSchema(ChatInputSchema) } },
      },
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = ChatInputSchema.parse(body);
        return createSSEStream(async (controller) => {
          const run = await chatWorkflow.createRunAsync();
          const result = await run.start({
            inputData: { ...parsedBody, streamController: controller },
          });
          if (result.status !== 'success') {
            throw new Error(`Workflow failed: ${result.status}`);
          }
        });
      } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  registerApiRoute('/workflows/medicine', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: { 'application/json': { schema: toOpenApiSchema(MedicineInputSchema) } },
      },
      responses: {
        200: {
          description: "Successful response",
          content: { 'application/json': { schema: toOpenApiSchema(MedicineOutputSchema) } }
        }
      }
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = MedicineInputSchema.parse(body);
        const run = await medicineWorkflow.createRunAsync();
        const result = await run.start({ inputData: parsedBody });
        if (result.status === 'success') {
          return c.json(result.result);
        }
        if (result.status === 'suspended') {
          return c.json(result);
        }
        throw new Error('Workflow did not complete successfully');
      } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  registerApiRoute('/workflows/research', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: { 'application/json': { schema: toOpenApiSchema(ResearchInputSchema) } },
      },
      responses: {
        200: {
          description: "Successful response",
          content: { 'application/json': { schema: toOpenApiSchema(ResearchOutputSchema) } }
        }
      }
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        // Only support stateless start (no resume)
        const parsedBody = ResearchInputSchema.parse(await c.req.json());
        const run = await researchWorkflow.createRunAsync();
        const result = await run.start({ inputData: parsedBody });
        if (result.status === 'success') {
          return c.json(result.result);
        }
        if (result.status === 'suspended') {
          return c.json(result);
        }
        throw new Error('Workflow did not complete successfully');
      } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  registerApiRoute('/workflows/generate-report', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: { 'application/json': { schema: toOpenApiSchema(ReportInputSchema) } },
      },
      responses: {
        200: {
          description: "Successful response",
          content: { 'application/json': { schema: toOpenApiSchema(ReportOutputSchema) } }
        }
      }
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        // Only support stateless start (no resume)
        const parsedBody = ReportInputSchema.parse(await c.req.json());
        const run = await generateReportWorkflow.createRunAsync();
        const result = await run.start({ inputData: parsedBody });
        if (result.status === 'success') {
          return c.json(result.result);
        }
        if (result.status === 'suspended') {
          return c.json(result);
        }
        throw new Error('Workflow did not complete successfully');
      } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
];
