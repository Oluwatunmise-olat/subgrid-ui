import { useState } from "react";
import { AlertTriangle, Code2, X } from "lucide-react";

import { buildInitialFormValues, coerceFormValues, getSchemaFields, isSimpleSchema } from "../lib/schemaForm";

const FIELD =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-blue-500/50";

function SchemaField({ field, value, onChange }) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-blue-500"
        />
        {field.key}
      </label>
    );
  }

  if (field.type === "enum") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} required={field.required}>
        <option value="" disabled>
          Select...
        </option>
        {field.enumValues.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type === "number" || field.type === "integer" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
      className={`${FIELD} font-mono`}
    />
  );
}

export default function ToolRunDialog({ tool, onClose, onRun, isRunning }) {
  const fields = getSchemaFields(tool.inputSchema);
  const simple = isSimpleSchema(tool.inputSchema);

  const [formValues, setFormValues] = useState(() => buildInitialFormValues(fields));
  const [advancedOpen, setAdvancedOpen] = useState(!simple);
  const [jsonText, setJsonText] = useState("{}");
  const [error, setError] = useState(null);

  const handleRun = (approved) => {
    let input;

    if (advancedOpen) {
      try {
        input = jsonText.trim() ? JSON.parse(jsonText) : {};
      } catch {
        setError("Input must be valid JSON");
        return;
      }
    } else {
      input = coerceFormValues(fields, formValues);
    }

    setError(null);
    onRun({ toolName: tool.name, input, approved });
  };

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-scale-in panel-solid w-full max-w-lg p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-mono text-sm font-medium text-zinc-100">{tool.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {tool.description && <p className="mb-4 text-xs leading-relaxed text-zinc-500">{tool.description}</p>}

        {!advancedOpen && fields.length === 0 && (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-xs text-zinc-500">
            This tool takes no input — it's ready to run.
          </p>
        )}

        {!advancedOpen && fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  {field.key}
                  {field.required && <span className="text-rose-400"> *</span>}
                  {field.description && <span className="ml-1.5 font-normal text-zinc-700">{field.description}</span>}
                </label>
                <SchemaField
                  field={field}
                  value={formValues[field.key]}
                  onChange={(v) => setFormValues((prev) => ({ ...prev, [field.key]: v }))}
                />
              </div>
            ))}
          </div>
        )}

        {advancedOpen && (
          <>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Input (JSON)</label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={6}
              spellCheck={false}
              className={`${FIELD} font-mono text-xs`}
            />
          </>
        )}

        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}

        {fields.some((f) => !["string", "number", "integer", "boolean", "enum"].includes(f.type)) || !simple ? null : (
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
          >
            <Code2 size={11} />
            {advancedOpen ? "Use form instead" : "Edit as raw JSON"}
          </button>
        )}

        {tool.requiresApproval && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2.5 text-xs leading-relaxed text-amber-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            This looks like a destructive action. Run it once to request approval, then run again to confirm.
          </div>
        )}

        <button
          type="button"
          disabled={isRunning}
          onClick={() => handleRun(tool.requiresApproval)}
          className="mt-4 w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? "Running..." : "Run tool"}
        </button>
      </div>
    </div>
  );
}
