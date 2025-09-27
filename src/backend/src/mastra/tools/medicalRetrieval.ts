import { createTool } from "@mastra/core";
import { z } from "zod";

export const medicalRetrievalTool = createTool({
  id: "medical-retrieval",
  description: "Fetches general medical info from a vetted dataset or API",
  inputSchema: z.object({
    query: z.string()
  }),
  outputSchema: z.object({
    info: z.string()
  }),
  execute: async ({ context }) => {
    const { query } = context;

    // TODO: Replace with real PubMed / FDA / RxNorm lookup
    return {
      info: `Mock medical info for: ${query}`
    };
  }
});
