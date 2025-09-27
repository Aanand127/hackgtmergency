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
const productLookupStepAgent = createStep(productLookupAgent);
const comparisonStepAgent = createStep(comparisonAgent)
const researchStepAgent = createStep(researchAgent);

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
  const { input, intent } = inputData;
  return {
    prompt: `${ input }`,
    intent: intent
  };
})
  .branch([
    [async ({ inputData: { intent, prompt }}) => intent == "\"general_need\"", medicalInfoStepAgent],
    [async ({ inputData: { intent, prompt }}) => intent == "\"product_lookup\"", productLookupStepAgent],
    [async ({ inputData: { intent, prompt }}) => intent == "\"compare\"", comparisonStepAgent],
    [async ({ inputData: { intent, prompt }}) => intent == "\"research\"", researchStepAgent],
  ])
  .commit();
