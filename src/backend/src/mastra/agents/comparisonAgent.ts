import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { comparisonTool } from "../tools/comparisonTool";

export const comparisonAgent = new Agent({
  name: "comparison-agent",
  description: "Compares multiple drugs side by side",
  instructions: "Return a comparison of the given products.",
  model: openai("gpt-4o"),
  tools: {
    comparisonTool,
  }
});
