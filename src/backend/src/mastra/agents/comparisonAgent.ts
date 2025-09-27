import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { comparisonTool } from "../tools/comparisonTool";

export const comparisonAgent = new Agent({
  name: "comparison-agent",
  description: "Compares multiple drugs side by side",
  instructions: "You are a specialized assistant. Your only job is to use the comparison tool to compare multiple drugs side by side.",
  model: openai("gpt-4o"),
  tools: {
    comparisonTool,
  }
});
