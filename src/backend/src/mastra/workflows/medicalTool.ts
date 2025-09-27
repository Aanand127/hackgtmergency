import { createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';

export const TestMedicalToolInputSchema = z.object({
  drug_name: z.string().describe('The name of the drug to look up.'),
});

export const TestMedicalToolOutputSchema = z.object({
  info: z.string(),
});

const runMedicalAgentStep = createStep({
  id: 'run-medical-agent-via-api',
  inputSchema: TestMedicalToolInputSchema,
  outputSchema: TestMedicalToolOutputSchema,
  execute: async ({ inputData }) => {
    const { drug_name } = inputData;
    
    // 1. Define the agent's API endpoint URL
    // The agent ID 'medicalToolAgent' must match the key you used to register it in src/index.ts
    const agentId = 'medicalToolAgent';
    const apiUrl = `http://localhost:4111/api/agents/${agentId}/generate`;

    try {
      // 2. Make a fetch request to the agent's API
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: drug_name }],
        }),
      });

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        throw new Error(`API call failed with status ${apiResponse.status}: ${errorBody}`);
      }

      // 3. Parse the JSON response from the agent
      const data = await apiResponse.json();

      // The tool's output is in the 'object' property of the agent's response
      const toolOutput = data.object as { info: string };

      if (!toolOutput || typeof toolOutput.info !== 'string') {
        throw new Error('Invalid or missing tool output in agent response');
      }
      
      return { info: toolOutput.info };

    } catch (error) {
      console.error('Error calling agent via fetch:', error);
      throw error; // Propagate the error to the workflow engine
    }
  },
});

export const testMedicalToolWorkflow = createWorkflow({
  id: 'test-medical-tool-workflow-ts',
  description: 'A workflow that calls an agent via fetch to test the medical retrieval tool.',
  inputSchema: TestMedicalToolInputSchema,
  outputSchema: TestMedicalToolOutputSchema,
})
  .then(runMedicalAgentStep)
  .commit();