import type {
  RmpStatus, RiskClass, HazardStatus, ControlType,
} from "../../../api/qmsApi";

export const rmpStatusColors: Record<RmpStatus, { color: string; bg: string }> = {
  DRAFT:     { color: '#8899AB', bg: 'rgba(136,153,171,0.14)' },
  REVIEW:    { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  APPROVED:  { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  EFFECTIVE: { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  REVISION:  { color: '#A06AE8', bg: 'rgba(160,106,232,0.14)' },
  ARCHIVED:  { color: '#3A4E62', bg: 'rgba(58,78,98,0.15)' },
};

export const rmpStatusLabels: Record<RmpStatus, string> = {
  DRAFT: 'Черновик', REVIEW: 'На рассмотрении', APPROVED: 'Утверждён',
  EFFECTIVE: 'Действующий', REVISION: 'Ревизия', ARCHIVED: 'Архив',
};

export const riskClassColors: Record<RiskClass, { color: string; bg: string }> = {
  LOW:      { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  MEDIUM:   { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
  HIGH:     { color: '#E87040', bg: 'rgba(232,112,64,0.14)' },
  CRITICAL: { color: '#F06060', bg: 'rgba(240,96,96,0.14)' },
};

export const hazardStatusLabels: Record<HazardStatus, string> = {
  IDENTIFIED: 'Выявлено', ANALYZED: 'Проанализировано', CONTROLLED: 'Под контролем',
  VERIFIED: 'Верифицировано', ACCEPTED: 'Принято', MONITORING: 'Мониторинг',
};

export const hazardStatusColors: Record<HazardStatus, { color: string; bg: string }> = {
  IDENTIFIED: { color: '#8899AB', bg: 'rgba(136,153,171,0.14)' },
  ANALYZED:   { color: '#A06AE8', bg: 'rgba(160,106,232,0.14)' },
  CONTROLLED: { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  VERIFIED:   { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  ACCEPTED:   { color: '#36B5E0', bg: 'rgba(54,181,224,0.14)' },
  MONITORING: { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
};

export const controlTypeLabels: Record<ControlType, string> = {
  INHERENT_SAFETY: 'Безоп. дизайн',
  PROTECTIVE:      'Защитн. меры',
  INFORMATION:     'Информирование',
};

export const controlTypeColors: Record<ControlType, { color: string; bg: string }> = {
  INHERENT_SAFETY: { color: '#2DD4A8', bg: 'rgba(45,212,168,0.14)' },
  PROTECTIVE:      { color: '#4A90E8', bg: 'rgba(74,144,232,0.14)' },
  INFORMATION:     { color: '#E8A830', bg: 'rgba(232,168,48,0.14)' },
};

export const hazardCategoryColors: Record<string, string> = {
  ENERGY:          '#F06060',
  SOFTWARE:        '#A06AE8',
  MECHANICAL:      '#E87040',
  USE_ERROR:       '#E8A830',
  ELECTROMAGNETIC: '#4A90E8',
  BIOLOGICAL:      '#36B5E0',
  CHEMICAL:        '#2DD4A8',
  OPERATIONAL:     '#8899AB',
  INFORMATION:     '#E8A830',
  ENVIRONMENTAL:   '#6ABF69',
  THERMAL:         '#E87040',
  RADIATION:       '#F06060',
};
