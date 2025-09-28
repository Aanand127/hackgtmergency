# Mastra Workflow API Integration

This document describes the complete setup for wrapping Mastra workflows in APIs and displaying them on the frontend.

## What We've Built

### 1. Backend API Endpoints (Mastra)
Located in `src/backend/src/mastra/apiRegistry.ts`:
- `/chat` - Chat workflow (existing)
- `/chat/stream` - Streaming chat workflow (existing)
- `/v1/test-medical-tool` - Drug tool workflow (existing)
- `/v1/workflows/medicine` - Medicine workflow (NEW)
- `/v1/workflows/research` - Research workflow (NEW)
- `/v1/workflows/generate-report` - Report generation workflow (NEW)

### 2. Next.js API Routes
Located in `src/app/api/workflows/`:
- `/api/workflows/medicine` - Proxies to Mastra medicine workflow
- `/api/workflows/research` - Proxies to Mastra research workflow
- `/api/workflows/generate-report` - Proxies to Mastra report workflow

### 3. Frontend Components
- **GenericNode Component** (`src/app/components/GenericNode.tsx`):
  - Interactive workflow cards
  - Input form for workflow prompts
  - Real-time execution status
  - Output timeline with results
  - Radial menu for quick workflow selection
  - Cedar-OS integration for context management

### 4. Available Workflows

#### Chat Workflow 💬
- **Purpose**: Default conversation loop
- **Input**: Text prompt
- **API**: Direct to Mastra `/chat`

#### Medicine Workflow 🩺
- **Purpose**: Routes medicine-related queries to specialized agents
- **Input**: Medical query text
- **API**: Next.js `/api/workflows/medicine` → Mastra `/v1/workflows/medicine`

#### Drug Tool Workflow 💊
- **Purpose**: Fetches specific drug information
- **Input**: Drug name
- **API**: Direct to Mastra `/v1/test-medical-tool`

#### Research Workflow 🔍
- **Purpose**: Multi-step research with human approval
- **Input**: None (interactive workflow)
- **API**: Next.js `/api/workflows/research` → Mastra `/v1/workflows/research`

#### Report Workflow 📄
- **Purpose**: Generates reports from approved research
- **Input**: None (uses research workflow output)
- **API**: Next.js `/api/workflows/generate-report` → Mastra `/v1/workflows/generate-report`

## How to Use

### 1. Start the Mastra Backend
```bash
cd src/backend
npm run dev
```
The Mastra server should run on `http://localhost:4111`

### 2. Start the Next.js Frontend
```bash
npm run dev
```
The frontend should run on `http://localhost:3000`

### 3. Environment Variables
Make sure you have the following environment variables set:
- `MASTRA_URL=http://localhost:4111` (for Next.js API routes)
- `NEXT_PUBLIC_MASTRA_URL=http://localhost:4111` (for frontend direct calls)

### 4. Using the Interface
1. Navigate to the homepage
2. Select a workflow card or right-click to open the radial menu
3. Enter a prompt in the text area
4. Click "Run [Workflow Name]" to execute
5. View results in the output timeline below

## Architecture

```
Frontend (Next.js)
├── GenericNode Component
├── Next.js API Routes (/api/workflows/*)
└── Direct calls to Mastra (for chat & drug tool)

Backend (Mastra)
├── Workflow Definitions
├── Agent Implementations
├── Tool Integrations
└── API Registry (HTTP endpoints)
```

## Key Features

- **Unified Interface**: Single component to interact with all workflows
- **Real-time Feedback**: Status messages and error handling
- **Result Persistence**: Timeline of workflow executions
- **Cedar-OS Integration**: Context management and mention providers
- **Responsive Design**: Works on desktop and mobile
- **Type Safety**: Full TypeScript support with Zod schemas

## Extending the System

### Adding a New Workflow

1. **Create the workflow** in `src/backend/src/mastra/workflows/`
2. **Add API endpoint** in `src/backend/src/mastra/apiRegistry.ts`
3. **Create Next.js route** in `src/app/api/workflows/[name]/route.ts` (if needed)
4. **Update GenericNode** to include the new workflow in the `WORKFLOWS` array
5. **Define input/output schemas** and parsing logic

### Customizing the UI

The GenericNode component is highly customizable:
- Modify workflow cards styling
- Add new input types beyond text
- Customize result display formats
- Add workflow-specific UI elements

## Troubleshooting

- **CORS Issues**: Make sure Mastra backend allows requests from your frontend domain
- **Environment Variables**: Double-check that all required env vars are set
- **Port Conflicts**: Ensure Mastra (4111) and Next.js (3000) are running on different ports
- **Workflow Errors**: Check the Mastra backend logs for detailed error messages
