/// <reference types="vite/client" />

/**
 * Allow markdown files to be imported as strings
 */
declare module "*.md" {
  const markdown: string;
  export { markdown };
}
