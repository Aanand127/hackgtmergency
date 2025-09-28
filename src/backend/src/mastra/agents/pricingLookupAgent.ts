import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { pricingLookupTool } from "../tools/pricingLookup";

export const pricingLookupAgent = new Agent({
  name: "product-lookup-agent",
  description: "Fetches detailed info about a specific drug/product",
  instructions: "You are a specialized assistant. Your only job is to Look up drug cost, availability, and alternatives.",
  model: openai("gpt-4o"),
  tools: {
    pricingLookupTool,
}
});
