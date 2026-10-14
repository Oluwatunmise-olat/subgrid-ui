import { useState } from "react";

import { AlertTriangle, Code2, X } from "lucide-react";

import {
  buildInitialFormValues,
  coerceFormValues,
  getSchemaFields,
  isSimpleSchema,
} from "../lib/schemaForm";

const FIELD =
  "w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] outline-none transition-colors focus:border-[color:var(--brand)]";

function SchemaField({ field, value, onChange }) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-[color:var(--text-dim)]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-[color:var(--border-strong)] accent-[#4F46E5]"
        />
        {field.key}
      </label>
    );
  }

  if (field.type === "enum") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
        required={field.required}
      >
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
      type={
        field.type === "number" || field.type === "integer" ? "number" : "text"
      }
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

  const [formValues, setFormValues] = useState(() =>
    buildInitialFormValues(fields),
  );

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
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="animate-scale-in panel-solid w-full max-w-lg p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-mono text-sm font-medium text-[color:var(--text)]">
            {tool.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[color:var(--text-faint)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text-dim)]"
          >
            <X size={16} />
          </button>
        </div>

        {tool.description && (
          <p className="mb-4 text-xs leading-relaxed text-[color:var(--text-dim)]">
            {tool.description}
          </p>
        )}

        {!advancedOpen && fields.length === 0 && (
          <p className="well px-3 py-2.5 text-xs text-[color:var(--text-dim)]">
            This tool takes no input — it's ready to run.
          </p>
        )}

        {!advancedOpen && fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-dim)]">
                  {field.key}

                  {field.required && <span className="text-rose-500"> *</span>}

                  {field.description && (
                    <span className="ml-1.5 font-normal text-[color:var(--text-faint)]">
                      {field.description}
                    </span>
                  )}
                </label>
                <SchemaField
                  field={field}
                  value={formValues[field.key]}
                  onChange={(v) =>
                    setFormValues((prev) => ({ ...prev, [field.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {advancedOpen && (
          <>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-dim)]">
              Input (JSON)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={6}
              spellCheck={false}
              className={`${FIELD} font-mono text-xs`}
            />
          </>
        )}

        {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}

        {fields.some(
          (f) =>
            !["string", "number", "integer", "boolean", "enum"].includes(
              f.type,
            ),
        ) || !simple ? null : (
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[color:var(--text-faint)] transition-colors hover:text-[color:var(--text-dim)]"
          >
            <Code2 size={11} />
            {advancedOpen ? "Use form instead" : "Edit as raw JSON"}
          </button>
        )}

        {tool.requiresApproval && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            This looks like a destructive action. Run it once to request
            approval, then run again to confirm.
          </div>
        )}

        <button
          type="button"
          disabled={isRunning}
          onClick={() => handleRun(tool.requiresApproval)}
          className="btn-primary mt-4 w-full justify-center py-2.5"
        >
          {isRunning ? "Running..." : "Run tool"}
        </button>
      </div>
    </div>
  );
}
