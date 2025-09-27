import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

export const classifierAgent = new Agent({
  name: "classifier-agent",
  description: "Classifies queries into general_need, product_lookup, compare, or research",
  instructions: `
    You are a classifier. Categorize the query into one of:
    - "general_need"
    - "product_lookup"
    - "compare"
    - "research"
  `,
  model: openai("gpt-4o")
});
