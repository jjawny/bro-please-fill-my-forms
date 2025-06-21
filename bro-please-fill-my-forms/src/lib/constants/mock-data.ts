import { ScrapedForm } from "~/lib/models/FormField";

export const MOCK_SCRAPED_FORM: ScrapedForm = {
  fields: [
    {
      id: "field_1",
      name: "username",
      label: "What should we call you?",
      type: "text",
    },
    { id: "field_2", name: "xp", label: "Rate your experience", type: "range" },
    {
      id: "field_3",
      name: "email",
      label: "Only accepting Gmail accounts",
      type: "email",
    },
    { id: "field_4", name: "password", label: "Password", type: "password" },
    {
      id: "field_5",
      name: "DoB",
      label: "Date of birth",
      type: "date",
    },
    {
      id: "field_6",
      name: "appointment",
      label: "Appointment (date/time)",
      type: "datetime-local",
    },
    {
      id: "field_7",
      name: "colorChallenge",
      label: "Prove you don't see color",
      type: "color",
    },
    {
      id: "field_8",
      name: "profilePic",
      label: "Upload profile pic",
      type: "file",
    },
    {
      id: "field_9",
      name: "subscribe",
      label: "Subscribe to newsletter?",
      type: "checkbox",
    },
    {
      id: "field_10",
      name: "gender",
      label: "Gender",
      type: "radio",
    },
    {
      id: "field_11",
      name: "contact",
      label: "Contact number",
      type: "tel",
    },
    {
      id: "field_12",
      name: "website",
      label: "Your website",
      type: "url",
    },
    {
      id: "field_13",
      name: "apptTime",
      label: "Preferred time",
      type: "time",
    },
    {
      id: "field_14",
      name: "birthMonth",
      label: "Birth month",
      type: "month",
    },
    {
      id: "field_15",
      name: "birthWeek",
      label: "Birth week of year",
      type: "week",
    },
    {
      id: "field_16",
      name: "country",
      label: "Select your country",
      type: "select-one",
    },
    {
      id: "field_17",
      name: "hobbies",
      label: "Choose your hobbies",
      type: "select-multiple",
    },
  ],
};
