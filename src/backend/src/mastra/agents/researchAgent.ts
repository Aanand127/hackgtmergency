import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { medicalRetrievalTool } from "../tools/medicalRetrieval";

export const researchAgent = new Agent({
  name: "research-agent",
  description: "Fetches research articles and clinical trials related to a medicine",
  instructions: "Summarize clinical trial and research information with citations.",
  model: openai("gpt-4o"),
  tools: {
    medicalRetrievalTool,
  }
});
