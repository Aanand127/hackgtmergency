import { registerApiRoute } from '@mastra/core/server';
import { ChatInputSchema, ChatOutput, chatWorkflow } from './workflows/chatWorkflow';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createSSEStream } from '../utils/streamUtils';

// ADD THIS IMPORT for Zod
import { z } from 'zod'; 

import { 
  testMedicalToolWorkflow, 
  TestMedicalToolInputSchema,
  TestMedicalToolOutputSchema // We still import the schema object
} from './workflows/medicalTool';

// ADD THIS TYPE DEFINITION using z.infer
type TestMedicalToolOutput = z.infer<typeof TestMedicalToolOutputSchema>;

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

  // Your updated medical tool route
  registerApiRoute('/v1/test-medical-tool', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: {
          'application/json': {
            schema: toOpenApiSchema(TestMedicalToolInputSchema),
          },
        },
      },
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        const { drug_name } = TestMedicalToolInputSchema.parse(body);

        const run = await testMedicalToolWorkflow.createRunAsync();
        const result = await run.start({ inputData: { drug_name } });

        if (result.status === 'success') {
          // FIX: Use the new type 'TestMedicalToolOutput' here
          return c.json<TestMedicalToolOutput>(result.result as TestMedicalToolOutput);
        }

        throw new Error(`Workflow failed with status: ${result.status}`);
      } catch (error) {
        console.error(error);
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
];