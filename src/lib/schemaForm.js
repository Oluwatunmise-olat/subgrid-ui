// Renders simple MCP tool inputSchemas (JSON Schema draft-07, object-of-primitives)
// as real form fields instead of a raw JSON textarea. Falls back to "advanced JSON"
// for anything with array/object properties - most tool schemas are flat, this
// covers the common case without pretending to be a full JSON Schema form builder.

export const getSchemaFields = (inputSchema) => {
  const properties = inputSchema?.properties || {};
  const required = new Set(inputSchema?.required || []);

  return Object.entries(properties).map(([key, def]) => ({
    key,
    required: required.has(key),
    description: def.description || "",
    enumValues: def.enum || null,
    type: def.enum ? "enum" : def.type || "string",
    defaultValue: def.default,
  }));
};

export const isSimpleSchema = (inputSchema) => {
  const fields = getSchemaFields(inputSchema);
  if (fields.length === 0) return true;
  return fields.every((field) => ["string", "number", "integer", "boolean", "enum"].includes(field.type));
};

export const buildInitialFormValues = (fields) =>
  fields.reduce((acc, field) => {
    if (field.defaultValue !== undefined) acc[field.key] = field.defaultValue;
    else if (field.type === "boolean") acc[field.key] = false;
    else acc[field.key] = "";
    return acc;
  }, {});

export const coerceFormValues = (fields, values) => {
  const result = {};

  for (const field of fields) {
    const raw = values[field.key];
    if (raw === "" || raw === undefined) continue;

    if (field.type === "number" || field.type === "integer") {
      const num = Number(raw);
      if (!Number.isNaN(num)) result[field.key] = num;
    } else if (field.type === "boolean") {
      result[field.key] = Boolean(raw);
    } else {
      result[field.key] = raw;
    }
  }

  return result;
};
