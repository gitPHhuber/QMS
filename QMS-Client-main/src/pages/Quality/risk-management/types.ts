import type { RmpStatus, RiskClass, HazardStatus, ControlType } from "../../../api/qmsApi";

export interface PlanRow {
  id: number;
  planNumber: string;
  title: string;
  product: string;
  phase: string;
  status: RmpStatus;
  hazardCount: number;
  version: string;
  [key: string]: unknown;
}

export interface HazardRow {
  id: number;
  number: string;
  category: string;
  description: string;
  harm: string;
  p: number;
  s: number;
  level: number;
  riskClass: RiskClass;
  residualClass: RiskClass | null;
  status: HazardStatus;
  controlCount: number;
  [key: string]: unknown;
}

export interface TraceRow {
  id: string;
  hazardNum: string;
  hazardDesc: string;
  initialRisk: string;
  controlType: ControlType;
  controlDesc: string;
  verifResult: string;
  residualRisk: string;
  braResult: string;
  [key: string]: unknown;
}

export interface BenefitRiskRow {
  id: number;
  hazard: string;
  residualRisk: string;
  benefit: string;
  conclusion: string;
  outweighs: boolean;
  [key: string]: unknown;
}

export interface StatsData {
  totalPlans: number;
  totalHazards: number;
  totalControls: number;
  verifiedControls: number;
  totalBenefitRisk: number;
  hazardsByCategory?: Array<{ category: string; count: number }>;
  [key: string]: unknown;
}

export type TabKey = 'plans' | 'hazards' | 'traceability' | 'benefit-risk';
