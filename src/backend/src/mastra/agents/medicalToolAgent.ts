import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { medicalRetrievalTool } from '../tools/medicalRetrieval'; // Adjust path if needed

export const medicalToolAgent = new Agent({
  name: 'Medical Tool Agent',
  instructions: `
    You are a specialized assistant. Your only job is to use the medical-retrieval tool
    to answer the user's query about a drug.
  `,
  model: openai('gpt-4o-mini'),
  // Give the agent access to your tool
  tools: {
    medicalRetrievalTool,
  },
});