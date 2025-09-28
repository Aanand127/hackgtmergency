import { createTool } from "@mastra/core";
import { z } from "zod";

export const comparisonTool = createTool({
  id: "comparison-tool",
  description: "Fetches and compares information for multiple medicines side-by-side from the openFDA API.",
  inputSchema: z.object({
    products: z.array(z.string()).describe("An array of drug names to compare.")
  }),
  outputSchema: z.object({
    comparison: z.string().describe("A formatted string comparing the requested products.")
  }),
  execute: async ({ context }) => {
    const { products } = context;
    const apiKey = process.env.OPENFDA_API_KEY;

    if (!apiKey) {
      return { comparison: "API Error: OPENFDA_API_KEY is not set." };
    }

    // 1. Use Promise.all to fetch data for all products concurrently
    const productDataPromises = products.map(async (productName) => {
      const searchParams = new URLSearchParams({
        search: `(openfda.generic_name:"${productName}" OR openfda.brand_name:"${productName}") OR (description:"${productName}" OR indications_and_usage:"${productName}")`,
        api_key: apiKey,
        limit: '1'
      });
      const url = `https://api.fda.gov/drug/label.json?${searchParams.toString()}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          // If a single product fails, return an error message for it
          return { name: productName, error: `API request failed with status ${response.status}` };
        }
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const drugInfo = data.results[0];
          return {
            name: productName,
            genericName: drugInfo.openfda?.generic_name?.[0] || 'N/A',
            brandName: drugInfo.openfda?.brand_name?.[0] || 'N/A',
            indications: drugInfo.indications_and_usage?.[0] || 'No indications listed.'
          };
        } else {
          return { name: productName, error: 'No drug label information found.' };
        }
      } catch (error: any) {
        return { name: productName, error: `An error occurred: ${error.message}` };
      }
    });

    // Wait for all API calls to complete
    const results = await Promise.all(productDataPromises);

    // 2. Format the aggregated results into a single comparison string
    let comparisonString = `Here is a comparison of ${products.join(" vs ")}:\n\n`;

    results.forEach(product => {
      comparisonString += `--- ${product.name.toUpperCase()} ---\n`;
      if (product.error) {
        comparisonString += `Error: ${product.error}\n\n`;
      } else {
        comparisonString += `Generic Name: ${product.genericName}\n`;
        comparisonString += `Brand Name: ${product.brandName}\n`;
        comparisonString += `Indications: ${(product.indications || '').substring(0, 200)}...\n\n`;
      }
    });

    return {
      comparison: comparisonString
    };
  }
});