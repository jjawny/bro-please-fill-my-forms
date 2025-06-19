import { BaseFormField } from "~/lib/models/FormField";

export type PopulatedFormFieldsLlmResponse = {
  fields: BaseFormField[];
};

// We need to define a schema AOT because we lose TypeScript types at runtime
// This schema must match the corresponding *GeminiResponse type so we can safely cast as later
// If we change the GeminiResponse type, use a tool or just GPT to get the new schema
// Co-locate these as pairs (*GeminiResponse type, matching JSON schema)

export const PopulatedFormFieldsLlmResponse_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          value: { type: "string" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  required: ["fields"],
  additionalProperties: false,
};
