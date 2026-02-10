import { $authHost } from "./index";

export interface RepairPartType {
  value: string;
  label: string;
}

export const getPartTypes = async (): Promise<RepairPartType[]> => {
  const { data } = await $authHost.get("/api/beryll/extended/defects/part-types");
  return data;
};

export const quickAddPartType = async (label: string): Promise<{ type: RepairPartType; created: boolean }> => {
  const { data } = await $authHost.post("/api/beryll/extended/defects/part-types", { label });
  return data;
};
