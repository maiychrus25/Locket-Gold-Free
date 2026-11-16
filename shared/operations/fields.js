import { z } from "zod";
export const field = (name, label, schema, type = "text", extra = {}) => ({
  name,
  label,
  schema,
  type,
  ...extra,
});
export const text = (name, label, required = true, max = 250) =>
  field(
    name,
    label,
    required
      ? z.string().trim().min(1).max(max)
      : z.string().trim().max(max).optional(),
    max > 500 ? "textarea" : "text",
    {
      required,
    },
  );
export const id = (name, label, required = true) =>
  field(
    name,
    label,
    required
      ? z
          .string()
          .trim()
          .min(1)
          .max(150)
          .regex(/^[\w@.:-]+$/)
      : z
          .string()
          .trim()
          .max(150)
          .regex(/^[\w@.:-]*$/)
          .optional(),
    "text",
    {
      required,
    },
  );
export const bool = (name, label, value = false) =>
  field(name, label, z.boolean().default(value), "checkbox", {
    default: value,
  });
export const number = (name, label, min, max, value) =>
  field(
    name,
    label,
    z.number().int().min(min).max(max).default(value),
    "number",
    {
      default: value,
      min,
      max,
    },
  );
export const json = (name, label, schema, required = false, value) =>
  field(name, label, required ? schema : schema.optional(), "json", {
    required,
    ...(value === undefined
      ? {}
      : {
          default: value,
        }),
  });
export const date = (name, label, required = false) =>
  field(
    name,
    label,
    required ? z.iso.date() : z.iso.date().optional(),
    "date",
    {
      required,
    },
  );
export const select = (name, label, values, value) =>
  field(name, label, z.enum(values).default(value), "select", {
    default: value,
    options: values.map((value) => ({
      value,
      label: value,
    })),
  });
export const op = (group, method, label, fields = [], options = {}) => ({
  group,
  method,
  label,
  fields,
  ...options,
});
