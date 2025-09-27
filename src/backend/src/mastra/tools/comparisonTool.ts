import { createTool } from "@mastra/core";
import { z } from "zod";

export const comparisonTool = createTool({
  id: "comparison-tool",
  description: "Compares multiple medicines side by side",
  inputSchema: z.object({
    products: z.array(z.string())
  }),
  outputSchema: z.object({
    comparison: z.string() // could later be structured JSON table
  }),
  execute: async ({ context }) => {
    const { products } = context;

    // TODO: actually pull from Product Lookup Agent for real comparisons
    return {
      comparison: `Comparison of ${products.join(" vs ")} (mock data).`
    };
  }
});
