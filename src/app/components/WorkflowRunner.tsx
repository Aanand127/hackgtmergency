// SERVER-BASED WORKFLOW RUNNER (fetch-based)
import ReactMarkdown from "react-markdown";
import React, { useState } from "react";

const WORKFLOWS = [
  {
    id: "medicineWorkflow",
    label: "Medicine Workflow",
    apiRoute: "http://localhost:4111/workflows/medicine",
    needsInput: true,
  },
  {
    id: "researchWorkflow",
    label: "Research Workflow",
    apiRoute: "http://localhost:4111/workflows/research",
    needsInput: true,
  },
  {
    id: "generateReportWorkflow",
    label: "Report Workflow",
    apiRoute: "http://localhost:4111/workflows/generate-report",
    needsInput: true,
  },
];

const WorkflowRunner: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(WORKFLOWS[0].id);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getApiRoute() {
    return WORKFLOWS.find((wf) => wf.id === selectedWorkflow)?.apiRoute || "";
  }

  async function handleRun() {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = { input: inputValue };
      const response = await fetch(getApiRoute(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Workflow request failed with status ${response.status}`);
      }

      const json = await response.json();
      setResult(json);
    } catch (err: any) {
      setError(err.message || "Unknown workflow error");
    } finally {
      setIsRunning(false);
    }
  }

  function extractMainText(result: any) {
    if (!result) return null;
    if (result.output) return result.output;
    if (result.report) return result.report;
    if (result.summary) return result.summary;
    return JSON.stringify(result, null, 2);
  }

  const mainText = extractMainText(result);

  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Workflow Runner (server-based)</h2>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Workflow:</label>
        <select
          value={selectedWorkflow}
          onChange={(e) => setSelectedWorkflow(e.target.value)}
          className="border rounded px-3 py-2"
          disabled={isRunning}
        >
          {WORKFLOWS.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Input:</label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          placeholder="Enter input value"
          disabled={isRunning}
        />
      </div>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleRun}
        disabled={isRunning || !inputValue.trim()}
      >
        {isRunning ? "Running…" : "Run Workflow"}
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {mainText && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Result Text:</h3>
          <div className="bg-gray-100 p-2 rounded text-sm">
            <ReactMarkdown>{mainText}</ReactMarkdown>
          </div>
        </div>
      )}
      {result && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Full Payload:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs max-h-64 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WorkflowRunner;
