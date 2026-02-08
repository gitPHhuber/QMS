import { $authHost } from "./index";


export type LabelElementType = "TEXT" | "QR" | "LINE" | "RECTANGLE";

export interface LabelElement {
    id: string;
    type: LabelElementType;


    x: number;
    y: number;
    width: number;
    height: number;


    fontSize?: number;
    content: string;
    dataSource: "STATIC" | "VARIABLE";
    align?: "left" | "center" | "right";
    isBold?: boolean;


    strokeWidth?: number;
}


export interface LabelTemplateModel {
    id: number;
    name: string;
    width: number;
    height: number;
    layout: LabelElement[];
    createdAt?: string;
}


export const fetchLabelTemplates = async () => {


    return new Promise<LabelTemplateModel[]>((resolve) => {
        const stored = localStorage.getItem("db_label_templates_mock");
        resolve(stored ? JSON.parse(stored) : []);
    });
};


export const createLabelTemplate = async (name: string, width: number, height: number, layout: LabelElement[]) => {


    const stored = JSON.parse(localStorage.getItem("db_label_templates_mock") || "[]");

    const newTemplate: LabelTemplateModel = {
        id: Date.now(),
        name,
        width,
        height,
        layout,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem("db_label_templates_mock", JSON.stringify([...stored, newTemplate]));
    return newTemplate;
};


export const deleteLabelTemplate = async (id: number) => {


    const stored = JSON.parse(localStorage.getItem("db_label_templates_mock") || "[]");
    const filtered = stored.filter((t: LabelTemplateModel) => t.id !== id);
    localStorage.setItem("db_label_templates_mock", JSON.stringify(filtered));
};
