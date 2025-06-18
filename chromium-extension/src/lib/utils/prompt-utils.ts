/**
 * Uses KV pairs to replaces tokens in the format {{KEY}} with the VALUE
 */
export function populatePrompt(prompt: string, vars: Record<string, string>) {
  return prompt.replace(/{{\s*(\w+)\s*}}/g, (_, name) => (name in vars ? vars[name] : `{{${name}}}`));
}
