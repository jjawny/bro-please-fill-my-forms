import { BaseFormField } from "~/lib/models/FormField";

export type PopulatedFormFieldsLlmResponse = {
  fields: BaseFormField[];
};

// We need to define this schema AOT because we lose TypeScript types at runtime
// This schema must match the corresponding '...LlmResponse' type so we can safely cast it back later
// Co-locate these as pairs: '...LlmResponse' type and the matching JSON schema

export const PopulatedFormFieldsLlmResponseSchema = {
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
