import { LucideIcon } from "lucide-react";

export type LabelElementType = "TEXT" | "QR" | "RECTANGLE" | "LINE" | "IMAGE" | "COUNTER" | "ICON";

export interface LabelElement {
  id: string;
  type: LabelElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  align?: "left" | "center" | "right";
  strokeWidth?: number;
  imageUrl?: string;
  imageName?: string;
  qrDescription?: string;
  qrSource?: "code" | "name" | "custom" | "serial" | "contract" | "url";
  counterFormat?: string;
  iconType?: string;
}

export interface Props {
  initialName?: string;
  initialWidth?: number;
  initialHeight?: number;
  initialLayout?: LabelElement[];
  onSave?: (name: string, w: number, h: number, layout: LabelElement[]) => void | Promise<void>;
  onClose?: () => void;
}

export interface CustomFont {
  name: string;
  fontFamily: string;
  fontDataUrl: string;
}

export interface CustomIcon {
  type: string;
  label: string;
  imageUrl: string;
}

export interface IconLibraryItem {
  type: string;
  label: string;
  icon: LucideIcon;
  svg: string;
}
