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
};

export type ScrapedForm = {
  fields: FormField[];
};
