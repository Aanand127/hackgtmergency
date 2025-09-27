import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { chatWorkflow } from './workflows/chatWorkflow';
import { apiRoutes } from './apiRegistry';
import { starterAgent } from './agents/starterAgent';
import { classifierAgent } from './agents/classifierAgent';
import { comparisonAgent } from './agents/comparisonAgent';
import { medicineInfoAgent } from './agents/medicineInfoAgent';
import { pricingLookupAgent } from './agents/pricingLookupAgent';
import { researchAgent } from './agents/researchAgent';
import { medicineWorkflow } from './workflows/medicineWorkflow';
import { registerApiRoute } from '@mastra/core/server';
import { testMedicalToolWorkflow } from './workflows/drugTool'; // 1. Import your workflow
import { drugToolAgent } from './agents/drugToolAgent';

/**
 * Main Mastra configuration
 *
 * This is where you configure your agents, workflows, storage, and other settings.
 * The starter template includes:
 * - A basic agent that can be customized
 * - A chat workflow for handling conversations
 * - In-memory storage (replace with your preferred database)
 * - API routes for the frontend to communicate with
 */
export const mastra = new Mastra({
  agents: { starterAgent, classifierAgent, comparisonAgent, medicineInfoAgent, pricingLookupAgent, researchAgent, drugToolAgent },
  workflows: { chatWorkflow, medicineWorkflow,  }, // 2. Register your workflow here
  storage: new LibSQLStore({
    url: ':memory:', // TODO: Replace with your database URL for persistence
  }),
  telemetry: {
    enabled: true,
  },
  server: {
    apiRoutes,
  },
});
