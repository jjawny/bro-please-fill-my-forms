export interface FormField {
  id?: string;
  name?: string;
  type: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  value?: string;
  options?: string[]; // for select/radio/checkbox
  selector: string; // CSS selector to find the element
}

export interface ScrapedForm {
  fields: FormField[];
  formAction?: string;
  formMethod?: string;
}

export interface GeminiResponse {
  fields: Record<string, string>;
}
