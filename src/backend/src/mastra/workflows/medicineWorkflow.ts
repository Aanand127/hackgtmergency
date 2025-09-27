import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core";
import { classifierAgent } from "../agents/classifierAgent";
import { medicineInfoAgent } from "../agents/medicineInfoAgent";
import { productLookupAgent } from "../agents/productLookupAgent";
import { comparisonAgent } from "../agents/comparisonAgent";
import { researchAgent } from "../agents/researchAgent";

const classifyStep = createStep({
  id: "classify-step",
  description: "Classify user intent",
  inputSchema: z.object({
    input: z.string()
  }),
  outputSchema: z.object({
    intent: z.string(),
    input: z.string()
  }),
  execute: async ({ inputData }) => {
    const { input } = inputData;
    const { text } = await classifierAgent.generate([
      { role: "user", content: input }
    ]);
    return { intent: text.trim(), input: input };
  }
});

const medicalInfoStepAgent = createStep(medicineInfoAgent);

const handleStep = createStep({
  id: "handle-step",
  description: "Route to appropriate agent",
  inputSchema: z.object({
    input: z.string(),
    intent: z.string()
  }),
  outputSchema: z.object({
    output: z.string()
  }),
  execute: async ({ inputData }) => {
    const { input, intent } = inputData;

    let response;
    switch (intent.toLowerCase()) {
      case "general_need":
        response = await medicineInfoAgent.generate([{ role: "user", content: input }]);
        break;
      case "product_lookup":
        response = await productLookupAgent.generate([{ role: "user", content: input }]);
        break;
      case "compare":
        response = await comparisonAgent.generate([{ role: "user", content: input }]);
        break;
      case "research":
        response = await researchAgent.generate([{ role: "user", content: input }]);
        break;
      default:
        response = { text: "Sorry, I couldn't classify your request." };
    }

    return { output: response.text };
  }
});

export const medicineWorkflow = createWorkflow({
  id: "medicine-workflow",
  description: "Routes user queries to the correct medicine-related agent",
  inputSchema: z.object({
    input: z.string(),
  }),
  outputSchema: z.object({
    output: z.string()
  })
})
.then(classifyStep)
.map(async ({ inputData }) => {
  const { input } = inputData;
  return {
    prompt: `Provide options for ${ input }`
  }
})
  .then(medicalInfoStepAgent)
  .commit();
