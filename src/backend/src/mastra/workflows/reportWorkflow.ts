import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Explicit schemas for API registry
export const ReportInputSchema = z.object({
  input: z.string(),
});
export const ReportOutputSchema = z.object({
  report: z.string().optional(),
  completed: z.boolean(),
});

const researchAndReportStep = createStep({
  id: 'research-and-report',
  inputSchema: ReportInputSchema,
  outputSchema: ReportOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const { input } = inputData;

    try {
      // Run research agent
      const researchAgent = mastra.getAgent('fullResearchAgent');
      const researchPrompt = `Research the following topic thoroughly using the two-phase process: "${input}".

      Phase 1: Search for 2-3 initial queries about this topic
      Phase 2: Search for follow-up questions from the learnings (then STOP)

      Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`;

      const researchResult = await researchAgent.generate(
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

      // Generate report from research result
      const reportAgent = mastra.getAgent('fullReportAgent');
      const reportResponse = await reportAgent.generate([
        {
          role: 'user',
          content: `Generate a report based on this research: ${JSON.stringify(researchResult.object)}`,
        },
      ]);

      return {
        report: reportResponse.text,
        completed: true,
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return { completed: false };
    }
  },
});

export const generateReportWorkflow = createWorkflow({
  id: 'generate-report-workflow',
  inputSchema: ReportInputSchema,
  outputSchema: ReportOutputSchema,
})
.then(researchAndReportStep)
.commit();
