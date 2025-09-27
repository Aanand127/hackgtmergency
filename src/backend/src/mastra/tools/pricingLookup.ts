import { createTool } from "@mastra/core";
import { z } from "zod";

export const pricingLookupTool = createTool({
  id: "pricing-lookup",
  description: "Fetches drug cost and availability",
  inputSchema: z.object({
    drug: z.string()
  }),
  outputSchema: z.object({
    name: z.string(),
    cost: z.string(),
    availability: z.string()
  }),
  execute: async ({ context }) => {
    const { drug } = context;

    // TODO: Integrate with GoodRx or mock dataset
    return {
      name: drug,
      cost: "$10 - $15 (OTC estimate)",
      availability: "OTC"
    };
  }
});
