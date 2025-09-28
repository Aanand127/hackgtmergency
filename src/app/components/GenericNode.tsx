'use client';

import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  useStateBasedMentionProvider,
  useSubscribeStateToAgentContext,
  useCedarStore,
  useCedarState,
  ActivationMode,
  MouseEvent,
  type ActivationConditions,
} from 'cedar-os';
import Flat3dContainer from '@/cedar/components/containers/Flat3dContainer';
import Container3DButton from '@/cedar/components/containers/Container3DButton';
import RadialMenuSpell, {
  type RadialMenuItem,
} from '@/cedar/components/spells/RadialMenuSpell';

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : uuidv4();

interface WorkflowDefinition {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  apiRoute?: string;
  buildPayload?: (input: string) => unknown;
  parseResult?: (response: unknown) => { title: string; output: string; metadata?: Record<string, unknown> };
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowLabel: string;
  prompt: string;
  output: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'chatWorkflow',
    label: 'Chat Workflow',
    description: 'Default conversation loop for Cedar chat.',
    color: '#60a5fa',
    icon: '💬',
    apiRoute: '/chat',
    buildPayload: (prompt) => ({ prompt }),
    parseResult: (response) => {
      const data = response as { content?: string; object?: { content?: string }; usage?: unknown };
      const content = data.content ?? data.object?.content ?? JSON.stringify(response, null, 2);
      return { title: 'Chat Response', output: content, metadata: { usage: data.usage } };
    },
  },
  {
    id: 'medicineWorkflow',
    label: 'Medicine Workflow',
    description: 'Routes medicine-related intents to specialized agents.',
    color: '#34d399',
    icon: '🩺',
    apiRoute: '/v1/workflows/medicine',
    buildPayload: (prompt) => ({ input: prompt }),
    parseResult: (response) => {
      const data = response as { output?: string };
      return {
        title: 'Medicine Workflow Output',
        output: data.output ?? JSON.stringify(response, null, 2),
      };
    },
  },
  {
    id: 'testMedicalToolWorkflow',
    label: 'Drug Tool Workflow',
    description: 'Fetches drug information via the medical tool agent.',
    color: '#fbbf24',
    icon: '💊',
    apiRoute: '/v1/test-medical-tool',
    buildPayload: (prompt) => ({ drug_name: prompt }),
    parseResult: (response) => {
      const data = response as { info?: string };
      return {
        title: 'Drug Information',
        output: data.info ?? JSON.stringify(response, null, 2),
      };
    },
  },
  {
    id: 'generateReportWorkflow',
    label: 'Report Workflow',
    description: 'Generates narrative reports from approved research.',
    color: '#f472b6',
    icon: '📄',
    apiRoute: '/v1/workflows/generate-report',
    buildPayload: () => ({}),
    parseResult: (response) => {
      const data = response as { report?: string; completed?: boolean };
      return {
        title: 'Generated Report',
        output: data.report ?? JSON.stringify(response, null, 2),
        metadata: { completed: data.completed },
      };
    },
  },
  {
    id: 'researchWorkflow',
    label: 'Research Workflow',
    description: 'Performs multi-step research with human-in-the-loop approval.',
    color: '#c084fc',
    icon: '🔍',
    apiRoute: '/v1/workflows/research',
    buildPayload: () => ({}),
    parseResult: (response) => {
      const data = response as { approved?: boolean; researchData?: unknown };
      return {
        title: data.approved ? 'Approved Research' : 'Pending Research Result',
        output: JSON.stringify(data.researchData ?? response, null, 2),
        metadata: { approved: data.approved },
      };
    },
  },
];

const RADIAL_ACTIVATION: ActivationConditions = {
  events: [MouseEvent.RIGHT_CLICK],
  mode: ActivationMode.HOLD,
};

const AddWorkflowOutputArgsSchema = z.object({
  workflowId: z.string(),
  workflowLabel: z.string().optional(),
  prompt: z.string().optional(),
  output: z.string(),
  metadata: z.record(z.any()).optional(),
});

const GenericNode: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(
    WORKFLOWS[0] ?? null,
  );
  const [workflowOutputs, setWorkflowOutputs] = useCedarState<WorkflowRun[]>({
    key: 'workflowOutputs',
    initialValue: [],
    description: 'Collection of recent workflow executions from the GenericNode component.',
    stateSetters: {
      addWorkflowOutput: {
        name: 'addWorkflowOutput',
        description: 'Append a workflow output to the GenericNode timeline.',
        argsSchema: AddWorkflowOutputArgsSchema,
        execute: (current, setValue, args) => {
          const entry: WorkflowRun = {
            id: makeId(),
            workflowId: args.workflowId,
            workflowLabel: args.workflowLabel ?? args.workflowId,
            prompt: args.prompt ?? '',
            output: args.output,
            metadata: args.metadata,
            createdAt: new Date().toISOString(),
          };
          const next = [...current, entry];
          setValue(next.slice(-30));
        },
      },
      clearWorkflowOutputs: {
        name: 'clearWorkflowOutputs',
        description: 'Remove all stored workflow outputs.',
        execute: (_current, setValue) => {
          setValue([]);
        },
      },
    },
  });
  const [inputValue, setInputValue] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mastraBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_MASTRA_URL ?? 'http://localhost:4111',
    [],
  );

  const addContextEntry = useCedarStore((state) => state.addContextEntry);
  const removeContextEntry = useCedarStore((state) => state.removeContextEntry);

  useStateBasedMentionProvider<WorkflowRun>({
    stateKey: 'workflowOutputs',
    trigger: '@wf',
    labelField: (run) => run.workflowLabel,
    searchFields: ['workflowId', 'workflowLabel', 'prompt', 'output'],
    description: 'Reference previously captured workflow runs.',
    color: '#60a5fa',
    icon: '🗂️',
  });

  useSubscribeStateToAgentContext<WorkflowRun[]>(
    'workflowOutputs',
    (runs) => ({ workflowOutputs: runs }),
    {
      labelField: (run) => run.workflowLabel,
      color: '#60a5fa',
      showInChat: true,
    },
  );

  const handleSelectWorkflow = useCallback(
    (workflow: WorkflowDefinition) => {
      setSelectedWorkflow(workflow);
      setStatusMessage(`Selected ${workflow.label}`);
      setErrorMessage(null);
      removeContextEntry('activeWorkflow', workflow.id);
      addContextEntry('activeWorkflow', {
        id: workflow.id,
        source: 'manual',
        data: workflow,
        metadata: {
          label: workflow.label,
          color: workflow.color,
        },
      });
    },
    [addContextEntry, removeContextEntry],
  );

  const handleRunWorkflow = useCallback(async () => {
    if (!selectedWorkflow) {
      setErrorMessage('Select a workflow to run.');
      return;
    }

    if (!inputValue.trim()) {
      setErrorMessage('Enter a prompt or instructions before running the workflow.');
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setStatusMessage('Triggering workflow…');

    try {
      let title = selectedWorkflow.label;
      let output = `Workflow executed with prompt: ${inputValue.trim()}`;
      let metadata: Record<string, unknown> | undefined;

      if (selectedWorkflow.apiRoute) {
        const payload = selectedWorkflow.buildPayload
          ? selectedWorkflow.buildPayload(inputValue.trim())
          : { prompt: inputValue.trim() };

        // Fire the workflow via the custom Mastra HTTP route exposed in `src/backend/src/mastra/apiRegistry.ts`.
        const response = await fetch(`${mastraBaseUrl}${selectedWorkflow.apiRoute}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Workflow request failed with status ${response.status}`);
        }

        const json = await response.json();
        const parsed = selectedWorkflow.parseResult?.(json);
        if (parsed) {
          title = parsed.title;
          output = parsed.output;
          metadata = parsed.metadata;
        } else {
          output = JSON.stringify(json, null, 2);
        }
      } else {
        // TODO: Replace this simulated output with a direct call into your workflow runner
        // (e.g. invoke a Mastra workflow via SDK or trigger a custom backend route).
        output = `Simulated output for ${selectedWorkflow.label} – connect an API endpoint to fetch real results.`;
      }

      const entry: WorkflowRun = {
        id: makeId(),
        workflowId: selectedWorkflow.id,
        workflowLabel: selectedWorkflow.label,
        prompt: inputValue.trim(),
        output,
        metadata,
        createdAt: new Date().toISOString(),
      };

      setWorkflowOutputs([...workflowOutputs, entry].slice(-30));
      setStatusMessage(`Stored output from ${selectedWorkflow.label}.`);
      setInputValue('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown workflow error');
      setStatusMessage(null);
    } finally {
      setIsRunning(false);
    }
  }, [inputValue, mastraBaseUrl, selectedWorkflow, workflowOutputs]);

  const radialMenuItems = useMemo<RadialMenuItem[]>(
    () =>
      WORKFLOWS.map((workflow) => ({
        title: workflow.label,
        icon: workflow.icon,
        onInvoke: (store) => {
          // Selecting a workflow via radial spell mirrors the card click behavior.
          handleSelectWorkflow(workflow);
          store.setShowChat(false);
        },
      })),
    [handleSelectWorkflow],
  );

  return (
    <div className='mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]'>
      <section className='space-y-4'>
        <header className='flex flex-col gap-2'>
          <h2 className='text-2xl font-semibold text-foreground'>Workflow Nodes</h2>
          <p className='text-sm text-muted-foreground'>
            Select a workflow card or hold <code className='rounded bg-muted px-1 py-0.5'>Right&nbsp;Click</code> to summon the radial spell.
          </p>
        </header>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {WORKFLOWS.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isActive={selectedWorkflow?.id === workflow.id}
              onSelect={handleSelectWorkflow}
            />
          ))}
        </div>

        <WorkflowOutputsTimeline
          outputs={workflowOutputs}
          onSelectWorkflow={(id) => {
            const match = WORKFLOWS.find((wf) => wf.id === id);
            if (match) handleSelectWorkflow(match);
          }}
          onJumpToDetails={(run) => {
            // Hook for drilling into workflow output — extend as needed to show modals, etc.
            console.debug('Selected run details', run);
          }}
        />
      </section>

      <aside className='space-y-4'>
        <Flat3dContainer className='flex flex-col gap-3 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h3 className='text-lg font-medium text-foreground'>Active Workflow</h3>
              <p className='text-xs text-muted-foreground'>
                Workflow selection feeds Cedar context, mention providers, and output logging.
              </p>
            </div>
            {selectedWorkflow && (
              <span
                className='rounded-full px-3 py-1 text-xs font-semibold'
                style={{ backgroundColor: `${selectedWorkflow.color}33`, color: '#111827' }}
              >
                {selectedWorkflow.label}
              </span>
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Describe the node / prompt the workflow
            </label>
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder='e.g. Summarize latest research on pediatric ibuprofen dosing'
              className='min-h-[120px] rounded-lg border border-border bg-background/80 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40'
              disabled={!selectedWorkflow || isRunning}
            />
          </div>

          <Container3DButton
            id='run-workflow'
            onClick={() => {
              if (!selectedWorkflow || isRunning) return;
              handleRunWorkflow();
            }}
            className='justify-center font-medium'
            color={selectedWorkflow?.color}
          >
            {isRunning ? 'Running…' : `Run ${selectedWorkflow?.label ?? 'workflow'}`}
          </Container3DButton>

          {statusMessage && (
            <p className='text-xs text-emerald-600 dark:text-emerald-400'>{statusMessage}</p>
          )}
          {errorMessage && (
            <p className='text-xs text-red-600 dark:text-red-400'>{errorMessage}</p>
          )}
        </Flat3dContainer>

        <ContextSnapshot />
      </aside>

      <RadialMenuSpell
        spellId='workflow-radial-spell'
        items={radialMenuItems}
        activationConditions={RADIAL_ACTIVATION}
      />
    </div>
  );
};

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  isActive: boolean;
  onSelect: (workflow: WorkflowDefinition) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, isActive, onSelect }) => (
  <Flat3dContainer
    id={`workflow-card-${workflow.id}`}
    className={`relative h-full cursor-pointer transition-shadow ${
      isActive ? 'ring-2 ring-offset-2 ring-offset-background ring-primary shadow-lg' : 'hover:shadow-lg'
    }`}
    onClick={() => onSelect(workflow)}
  >
    <div className='flex h-full flex-col gap-2 p-4'>
      <div className='flex items-center gap-2 text-lg font-semibold text-foreground'>
        <span className='text-xl'>{workflow.icon}</span>
        <span>{workflow.label}</span>
      </div>
      <p className='text-sm text-muted-foreground'>{workflow.description}</p>
      <div className='mt-auto flex items-center justify-between text-xs'>
        <span className='font-mono text-muted-foreground'>{workflow.id}</span>
        <span className='rounded-full px-2 py-0.5' style={{ backgroundColor: `${workflow.color}22` }}>
          Radial Spell
        </span>
      </div>
    </div>
  </Flat3dContainer>
);

const WorkflowOutputsTimeline: React.FC<{
  outputs: WorkflowRun[];
  onSelectWorkflow: (workflowId: string) => void;
  onJumpToDetails?: (run: WorkflowRun) => void;
}> = ({ outputs, onSelectWorkflow, onJumpToDetails }) => {
  if (!outputs.length) {
    return (
      <Flat3dContainer className='p-6 text-sm text-muted-foreground'>
        Workflow outputs will appear here once a node chat stores its result.
      </Flat3dContainer>
    );
  }

  const sorted = [...outputs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className='space-y-3'>
      {sorted.map((run) => (
        <Flat3dContainer key={run.id} className='space-y-3 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <button
              className='text-sm font-semibold text-primary underline-offset-2 hover:underline'
              onClick={() => onSelectWorkflow(run.workflowId)}
              type='button'
            >
              {run.workflowLabel}
            </button>
            <time className='text-xs text-muted-foreground'>
              {new Date(run.createdAt).toLocaleString()}
            </time>
          </div>
          {onJumpToDetails && (
            <button
              className='text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground'
              onClick={() => onJumpToDetails(run)}
              type='button'
            >
              View details
            </button>
          )}
          <div className='space-y-1 text-sm'>
            <p className='font-medium text-foreground'>Prompt</p>
            <p className='rounded-md bg-muted/40 p-2 text-muted-foreground'>{run.prompt}</p>
          </div>
          <div className='space-y-1 text-sm'>
            <p className='font-medium text-foreground'>Output</p>
            <pre className='max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-background/80 p-3 text-xs text-muted-foreground'>
              {run.output}
            </pre>
          </div>
        </Flat3dContainer>
      ))}
    </div>
  );
};

const ContextSnapshot: React.FC = () => {
  const stringifyInputContext = useCedarStore((state) => state.stringifyInputContext);
  const contextPreview = stringifyInputContext();

  return (
    <Flat3dContainer className='p-4'>
      <h4 className='mb-2 text-sm font-semibold text-foreground'>Compiled Cedar Context</h4>
      <pre className='max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-background/70 p-3 text-xs text-muted-foreground'>
        {contextPreview}
      </pre>
    </Flat3dContainer>
  );
};

export default GenericNode;