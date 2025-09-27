import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { medicalRetrievalTool } from "../tools/medicalRetrieval";

export const medicineInfoAgent = new Agent({
  name: "medicine-info-agent",
  description: "Provides info based on general health needs (pain relief, cold, etc.)",
  instructions: "Provide precise medical information for general needs.",
  model: openai("gpt-4o"),
  tools: {
    medicalRetrievalTool,
  }
});
