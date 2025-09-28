import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Explicit schemas for API registry
export const ResearchInputSchema = z.object({
  input: z.string(),
});
export const ResearchOutputSchema = z.object({
  summary: z.string(),
  researchData: z.any(),
});

const researchStep = createStep({
  id: 'research',
  inputSchema: ResearchInputSchema,
  outputSchema: ResearchOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const { input } = inputData;

    try {
      const agent = mastra.getAgent('fullResearchAgent');
      const researchPrompt = `Research the following topic thoroughly using the two-phase process: "${input}".

      Phase 1: Search for 2-3 initial queries about this topic
      Phase 2: Search for follow-up questions from the learnings (then STOP)

      Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`;

      const result = await agent.generate(
        [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        {
          maxSteps: 15,
          experimental_output: z.object({
            queries: z.array(z.string()),
            searchResults: z.array(
              z.object({
                title: z.string(),
                url: z.string(),
                relevance: z.string(),
              }),
            ),
            learnings: z.array(
              z.object({
                learning: z.string(),
                followUpQuestions: z.array(z.string()),
                source: z.string(),
              }),
            ),
            completedQueries: z.array(z.string()),
            phase: z.string().optional(),
          }),
        },
      );

      // Create a nicely formatted summary
      const obj = result.object;
      let summary = `Research completed on "${input}":\n\n`;

      if (obj && obj.queries && obj.queries.length) {
        summary += "## Queries\n";
        obj.queries.forEach((q: string, i: number) => {
          summary += `${i + 1}. ${q}\n`;
        });
        summary += "\n";
      }

      if (obj && obj.searchResults && obj.searchResults.length) {
        summary += "## Search Results\n";
        obj.searchResults.forEach((res: any, i: number) => {
          summary += `${i + 1}. [${res.title}](${res.url}) (${res.relevance})\n`;
        });
        summary += "\n";
      }

      if (obj && obj.learnings && obj.learnings.length) {
        summary += "## Key Learnings\n";
        obj.learnings.forEach((l: any, i: number) => {
          summary += `${i + 1}. ${l.learning}\n   - Source: ${l.source}\n`;
          if (l.followUpQuestions && l.followUpQuestions.length) {
            summary += `   - Follow-up: ${l.followUpQuestions.join("; ")}\n`;
          }
        });
        summary += "\n";
      }

      if (obj && obj.completedQueries && obj.completedQueries.length) {
        summary += "## Completed Queries\n";
        obj.completedQueries.forEach((q: string, i: number) => {
          summary += `${i + 1}. ${q}\n`;
        });
        summary += "\n";
      }

      if (obj && obj.phase) {
        summary += `## Phase\n${obj.phase}\n`;
      }

      return {
        summary,
        researchData: obj,
      };
    } catch (error: any) {
      console.log({ error });
      return {
        summary: `Error: ${error.message}`,
        researchData: { error: error.message },
      };
    }
  },
});

export const researchWorkflow = createWorkflow({
  id: 'research-workflow',
  inputSchema: ResearchInputSchema,
  outputSchema: ResearchOutputSchema,
})
.then(researchStep)
.commit();
