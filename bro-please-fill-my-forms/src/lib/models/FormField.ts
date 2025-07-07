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
  options?: string[]; // for selects/radios/checkboxes
};

export type ScrapedForm = {
  fields: FormField[];
};
