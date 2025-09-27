import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { pricingLookupTool } from "../tools/pricingLookup";

export const productLookupAgent = new Agent({
  name: "product-lookup-agent",
  description: "Fetches detailed info about a specific drug/product",
  instructions: "Look up drug information including cost, availability, and alternatives.",
  model: openai("gpt-4o"),
  tools: {
    pricingLookupTool,
}
});
