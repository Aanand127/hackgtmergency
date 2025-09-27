import { createTool } from "@mastra/core";
import { z } from "zod";

export const medicalRetrievalTool = createTool({
  id: "medical-retrieval",
  description: "Fetches drug label information from the openFDA API.",
  inputSchema: z.object({
    query: z.string().describe("The generic or brand name of the drug to look up.")
  }),
  outputSchema: z.object({
    info: z.string().describe("A summary of the drug information found or an error message.")
  }),
  execute: async ({ context }) => {
    const { query } = context;
    const apiKey = process.env.OPENFDA_API_KEY;

    if (!apiKey) {
      return { info: "API Error: OPENFDA_API_KEY is not set in environment variables." };
    }

    const searchParams = new URLSearchParams({
      search: `(openfda.generic_name:"${query}" OR openfda.brand_name:"${query}") OR (description:"${query}" OR indications_and_usage:"${query}")`,
      api_key: apiKey,
      limit: '1'
    });
    const url = `https://api.fda.gov/drug/label.json?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.error?.message || `API request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const drugInfo = data.results[0];
        const genericName = drugInfo.openfda?.generic_name?.[0] || 'N/A';
        const brandName = drugInfo.openfda?.brand_name?.[0] || 'N/A';
        const indications = drugInfo.indications_and_usage?.[0] || 'No indications listed.';
        const formattedInfo = `Found info for: ${query}. Generic Name: ${genericName}. Brand Name: ${brandName}. Indications: ${indications.substring(0, 300)}...`;
        
        return { info: formattedInfo };
      } else {
        return { info: `No drug label information found for: ${query}` };
      }
    } catch (error: any) {
      console.error("Error fetching from openFDA:", error);
      return { info: `API Error: ${error.message}` };
    }
  }
});