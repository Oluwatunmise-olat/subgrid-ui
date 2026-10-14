const tryParse = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export function unwrapToolResult(value) {
  if (value == null) return null;

  if (
    value.result &&
    (value.content ||
      value.structuredContent ||
      value.result.content ||
      value.result.structuredContent)
  )
    return unwrapToolResult(value.result);

  if (Array.isArray(value.content)) {
    const text = value.content
      .map((part) => part?.text)
      .filter(Boolean)
      .join("\n");

    if (text) return tryParse(text);
  }

  if (value.structuredContent) return value.structuredContent;

  return tryParse(value);
}

export function toolResultText(value) {
  const normalized = unwrapToolResult(value);

  if (normalized == null) return "No output returned";

  if (typeof normalized === "string") return normalized;

  return JSON.stringify(normalized, null, 2);
}

export function toolResultSummary(value) {
  const normalized = unwrapToolResult(value);

  if (normalized == null) return "No output returned";

  if (typeof normalized === "string") return normalized;

  if (Array.isArray(normalized)) {
    const count = normalized.length;

    return `${count} result${count === 1 ? "" : "s"} returned`;
  }

  const entries = Object.entries(normalized).slice(0, 3);

  if (!entries.length) return "Completed with no fields";

  return entries.map(formatEntry).join(" · ");
}

function formatEntry([key, item]) {
  const shown = typeof item === "object" ? JSON.stringify(item) : String(item);

  return `${key}: ${shown}`;
}
