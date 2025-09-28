import { createTool } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const pricingLookupTool = createTool({
  id: "pricing-lookup",
  description: "Fetches an estimated drug cost and its typical availability (e.g., OTC or Prescription).",
  inputSchema: z.object({
    drug: z.string().describe("The name of the drug to look up.")
  }),
  outputSchema: z.object({
    name: z.string(),
    cost: z.string().describe("The estimated price range, e.g., '$10 - $20'."),
    availability: z.string().describe("'OTC' for over-the-counter or 'Prescription'.")
  }),
  execute: async ({ context }) => {
    const { drug } = context;

    // 1. Define a specialized "sub-agent" inside the tool
    const pricingExpertAgent = new Agent({
      name: "pricing-expert-agent",
      instructions: `
        You are a pharmaceutical pricing expert. Given a drug name, provide a realistic, estimated cash price range for it in the United States.
        Also, state whether it is typically available "OTC" (over-the-counter) or "Prescription".
        Respond only with the JSON object.
      `,
      model: openai("gpt-4o-mini") // Using a faster model for tool operations is efficient
    });
    
    // 2. Define the exact JSON structure we want the agent to return
    const expectedOutputSchema = z.object({
      cost: z.string(),
      availability: z.enum(["OTC", "Prescription"]),
    });

    try {
      // 3. Call the sub-agent and force it to return our desired JSON object
      const response = await pricingExpertAgent.generate(
        `What is the price and availability of ${drug}?`, {
          experimental_output: expectedOutputSchema
        }
      );

      if (!response.object) {
        throw new Error("The pricing expert agent failed to return a valid structured response.");
      }

      const { cost, availability } = response.object;
      
      // 4. Return the data in the format required by the tool's main outputSchema
      return {
        name: drug,
        cost,
        availability
      };

    } catch (error) {
      console.error(`Error while getting price estimate for ${drug}:`, error);
      return {
        name: drug,
        cost: "N/A",
        availability: "Unknown"
      };
    }
  }
});