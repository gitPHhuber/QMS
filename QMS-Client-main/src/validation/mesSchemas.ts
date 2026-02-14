/**
 * Zod Validation Schemas for MES Forms
 * ISO 13485 compliant form validation
 */

import { z } from "zod";

// ═══ DMR Schema ═══

export const createDmrSchema = z.object({
  productId: z.coerce.number().min(1, "Выберите изделие"),
  title: z.string().min(3, "Минимум 3 символа").max(500),
  description: z.string().optional(),
});

export type CreateDmrFormData = z.input<typeof createDmrSchema>;

// ═══ BOM Item Schema ═══

export const BOM_CATEGORIES = [
  "COMPONENT",
  "RAW_MATERIAL",
  "SUBASSEMBLY",
  "PACKAGING",
  "LABEL",
  "CONSUMABLE",
] as const;

export const createBomItemSchema = z.object({
  partNumber: z.string().min(1, "Обязательное поле"),
  description: z.string().min(1).max(500),
  category: z.enum(BOM_CATEGORIES, { message: "Выберите категорию" }),
  quantityPer: z.coerce.number().min(0.001),
  unit: z.string().default("шт"),
});

export type CreateBomItemFormData = z.input<typeof createBomItemSchema>;

// ═══ Work Order Schema ═══

export const createWorkOrderSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  dmrId: z.coerce.number().min(1, "Выберите DMR"),
  targetQty: z.coerce.number().min(1, "Минимум 1"),
  batchNumber: z.string().optional(),
  serialNumberPrefix: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.coerce.number().optional(),
  yieldTarget: z.coerce.number().min(0).max(100).optional(),
});

export type CreateWorkOrderFormData = z.input<typeof createWorkOrderSchema>;

// ═══ Acceptance Test Schema ═══

export const createAcceptanceTestSchema = z.object({
  productId: z.coerce.number().min(1, "Выберите изделие"),
  serialNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  templateId: z.coerce.number().optional(),
});

export type CreateAcceptanceTestFormData = z.input<typeof createAcceptanceTestSchema>;

// ═══ Route Step Schema ═══

export const createRouteStepSchema = z.object({
  name: z.string().min(1, "Обязательное поле").max(300),
  description: z.string().optional(),
  estimatedDuration: z.coerce.number().min(0).optional(),
});

export type CreateRouteStepFormData = z.input<typeof createRouteStepSchema>;

// ═══ Checklist Item Schema ═══

export const CHECKLIST_TYPES = [
  "CHECKBOX",
  "NUMERIC",
  "TEXT",
  "PASS_FAIL",
  "MEASUREMENT",
  "PHOTO",
] as const;

export const createChecklistItemSchema = z.object({
  label: z.string().min(1, "Обязательное поле").max(500),
  type: z.enum(CHECKLIST_TYPES, { message: "Выберите тип" }),
  required: z.boolean().default(true),
  lowerLimit: z.coerce.number().optional(),
  upperLimit: z.coerce.number().optional(),
  nominal: z.coerce.number().optional(),
  unit: z.string().optional(),
});

export type CreateChecklistItemFormData = z.input<typeof createChecklistItemSchema>;

// ═══ Decision Schema (for Acceptance Test) ═══

export const DECISION_OPTIONS = ["PASSED", "FAILED", "CONDITIONAL"] as const;

export const decisionSchema = z.object({
  decision: z.enum(DECISION_OPTIONS, { message: "Выберите решение" }),
  notes: z.string().optional(),
});

export type DecisionFormData = z.input<typeof decisionSchema>;
