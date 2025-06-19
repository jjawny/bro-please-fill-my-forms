export type BaseFormField = {
  id: string;
  value?: string;
};

export type FormField = BaseFormField & {
  name?: string;
  type: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  options?: string[]; // for select/radio/checkbox
  selector: string; // CSS selector to find the element
};

export type ScrapedForm = {
  fields: FormField[];
};
