/**
 * Zod Validation Schemas for QMS Forms
 * ISO 13485 compliant form validation
 */

import { z } from "zod";

// ═══ Common helpers ═══

const trimString = z.string().transform((s) => s.trim());
const optionalTrimString = z
  .string()
  .optional()
  .transform((s) => s?.trim() || undefined);

// ═══ NC Schema (§8.3) ═══

export const NC_SOURCES = [
  "INCOMING_INSPECTION",
  "IN_PROCESS",
  "FINAL_INSPECTION",
  "CUSTOMER_COMPLAINT",
  "INTERNAL_AUDIT",
  "EXTERNAL_AUDIT",
  "SUPPLIER",
  "FIELD_RETURN",
  "OTHER",
] as const;

export const NC_CLASSIFICATIONS = ["CRITICAL", "MAJOR", "MINOR"] as const;

export const createNcSchema = z.object({
  title: trimString
    .pipe(z.string().min(3, "Название должно содержать минимум 3 символа").max(500, "Максимум 500 символов")),
  description: optionalTrimString,
  source: z.enum(NC_SOURCES, { message: "Выберите источник обнаружения" }),
  classification: z.enum(NC_CLASSIFICATIONS, { message: "Выберите классификацию" }),
  productType: optionalTrimString,
  productSerialNumber: optionalTrimString,
  lotNumber: optionalTrimString,
  processName: optionalTrimString,
  supplierName: optionalTrimString,
  assignedToId: z.coerce.number().optional().transform((v) => v || undefined),
  dueDate: z.string().optional().transform((v) => v || undefined),
  immediateAction: optionalTrimString,
  capaRequired: z.boolean().default(false),
  totalQty: z.coerce.number().min(0, "Не может быть отрицательным").optional().transform((v) => v || undefined),
  defectQty: z.coerce.number().min(0, "Не может быть отрицательным").optional().transform((v) => v || undefined),
});

export type CreateNcFormData = z.input<typeof createNcSchema>;

// ═══ CAPA Schema (§8.5.2/§8.5.3) ═══

export const CAPA_TYPES = ["CORRECTIVE", "PREVENTIVE"] as const;
export const CAPA_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const createCapaSchema = z.object({
  type: z.enum(CAPA_TYPES, { message: "Выберите тип CAPA" }),
  title: trimString
    .pipe(z.string().min(3, "Название должно содержать минимум 3 символа").max(500, "Максимум 500 символов")),
  description: optionalTrimString,
  priority: z.enum(CAPA_PRIORITIES).default("MEDIUM"),
  nonconformityId: z.coerce.number().optional().transform((v) => v || undefined),
  assignedToId: z.coerce.number().optional().transform((v) => v || undefined),
  dueDate: z.string().optional().transform((v) => v || undefined),
});

export type CreateCapaFormData = z.input<typeof createCapaSchema>;

// ═══ Design Control Schema (§7.3) ═══

export const REGULATORY_CLASSES = ["CLASS_I", "CLASS_IIA", "CLASS_IIB", "CLASS_III"] as const;

export const createDesignProjectSchema = z.object({
  title: trimString
    .pipe(z.string().min(3, "Название должно содержать минимум 3 символа").max(500, "Максимум 500 символов")),
  description: optionalTrimString,
  productType: optionalTrimString,
  regulatoryClass: z.enum(REGULATORY_CLASSES).optional(),
  teamLeadId: z.coerce.number().optional().transform((v) => v || undefined),
  plannedStartDate: z.string().optional().transform((v) => v || undefined),
  plannedEndDate: z.string().optional().transform((v) => v || undefined),
});

export type CreateDesignProjectFormData = z.input<typeof createDesignProjectSchema>;

export const DESIGN_INPUT_CATEGORIES = [
  "FUNCTIONAL", "PERFORMANCE", "SAFETY", "REGULATORY", "STANDARDS", "USABILITY", "OTHER",
] as const;

export const DESIGN_INPUT_PRIORITIES = ["MUST_HAVE", "SHOULD_HAVE", "NICE_TO_HAVE"] as const;

export const addDesignInputSchema = z.object({
  title: trimString.pipe(z.string().min(1, "Обязательное поле")),
  description: optionalTrimString,
  category: z.enum(DESIGN_INPUT_CATEGORIES, { message: "Выберите категорию" }),
  priority: z.enum(DESIGN_INPUT_PRIORITIES).default("MUST_HAVE"),
  source: optionalTrimString,
});

export type AddDesignInputFormData = z.input<typeof addDesignInputSchema>;

// ═══ E-Signature Schema ═══

export const signSchema = z.object({
  entity: z.string().min(1, "Тип сущности обязателен"),
  entityId: z.coerce.number().min(1, "ID сущности обязателен"),
  action: z.string().min(1, "Действие обязательно"),
  meaning: z.string().min(5, "Укажите значение подписи (минимум 5 символов)"),
  password: z.string().min(1, "Введите пароль для подтверждения"),
  reason: optionalTrimString,
});

export type SignFormData = z.input<typeof signSchema>;

export const createSignRequestSchema = z.object({
  entity: z.string().min(1, "Тип сущности обязателен"),
  entityId: z.coerce.number().min(1, "ID сущности обязателен"),
  action: z.string().min(1, "Действие обязательно"),
  title: trimString.pipe(z.string().min(3, "Название минимум 3 символа")),
  description: optionalTrimString,
  signerIds: z.array(z.number()).min(1, "Укажите хотя бы одного подписанта"),
  expiresAt: z.string().optional(),
});

export type CreateSignRequestFormData = z.input<typeof createSignRequestSchema>;
