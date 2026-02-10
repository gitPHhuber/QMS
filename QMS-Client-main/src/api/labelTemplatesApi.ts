import { $authHost } from "./index";

export type LabelElementType = "TEXT" | "QR" | "RECTANGLE" | "LINE" | "IMAGE" | "COUNTER" | "ICON";

export interface LabelElement {
  id: string;
  type: LabelElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  content?: string;
  fontSize?: number;
  isBold?: boolean;
  align?: "left" | "center" | "right";
  counterFormat?: string;
  imageUrl?: string;
  imageName?: string;
  iconType?: string;
  strokeWidth?: number;
}

export interface LabelTemplateModel {
  id: number;
  name: string;
  type: string;
  width: number;
  height: number;
  layout?: LabelElement[];
  elements: LabelElement[];
  createdAt: string;
  updatedAt: string;
}

export const fetchLabelTemplates = async (): Promise<LabelTemplateModel[]> => {
  const { data } = await $authHost.get("api/warehouse/label-templates");
  return data;
};

export const createLabelTemplate = async (
  name: string,
  width: number,
  height: number,
  elements: LabelElement[]
): Promise<LabelTemplateModel> => {
  const { data } = await $authHost.post("api/warehouse/label-templates", {
    name,
    width,
    height,
    elements,
  });
  return data;
};

export const deleteLabelTemplate = async (id: number): Promise<void> => {
  await $authHost.delete(`api/warehouse/label-templates/${id}`);
};
