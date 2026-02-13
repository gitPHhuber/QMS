import React from "react";
import Badge from "../../../components/qms/Badge";
import type { RiskClass } from "../../../api/qmsApi";
import type { PlanRow, HazardRow, TraceRow } from "./types";
import {
  rmpStatusColors, rmpStatusLabels,
  riskClassColors,
  hazardStatusColors, hazardStatusLabels,
  controlTypeColors, controlTypeLabels,
} from "./constants";

export const planColumns = [
  {
    key: 'planNumber',
    label: 'Nomer',
    width: '130px',
    render: (r: PlanRow) => <span className="font-mono text-asvo-accent">{r.planNumber}</span>,
  },
  {
    key: 'title',
    label: 'Nazvaniye',
    render: (r: PlanRow) => <span className="text-asvo-text">{r.title}</span>,
  },
  {
    key: 'product',
    label: 'Produkt',
    render: (r: PlanRow) => <span className="text-asvo-text-mid">{r.product}</span>,
  },
  {
    key: 'phase',
    label: 'Faza',
    render: (r: PlanRow) => <span className="text-asvo-text-mid">{r.phase}</span>,
  },
  {
    key: 'hazardCount',
    label: 'Opasnostey',
    align: 'center' as const,
    render: (r: PlanRow) => <span className="text-asvo-text font-mono">{r.hazardCount}</span>,
  },
  {
    key: 'version',
    label: 'Versiya',
    align: 'center' as const,
    render: (r: PlanRow) => <span className="text-asvo-text-dim">v{r.version}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center' as const,
    render: (r: PlanRow) => {
      const c = rmpStatusColors[r.status];
      return <Badge color={c?.color} bg={c?.bg}>{rmpStatusLabels[r.status]}</Badge>;
    },
  },
];

export const hazardColumns = [
  {
    key: 'number',
    label: 'ID',
    width: '90px',
    render: (r: HazardRow) => <span className="font-mono text-asvo-accent">{r.number}</span>,
  },
  {
    key: 'category',
    label: 'Kategoriya',
    width: '120px',
    render: (r: HazardRow) => <span className="text-asvo-text-mid text-xs">{r.category}</span>,
  },
  {
    key: 'description',
    label: 'Opasnost\'',
    render: (r: HazardRow) => <span className="text-asvo-text">{r.description}</span>,
  },
  {
    key: 'harm',
    label: 'Vred',
    render: (r: HazardRow) => <span className="text-[#F06060] text-xs">{r.harm}</span>,
  },
  {
    key: 'level',
    label: 'PxS',
    align: 'center' as const,
    width: '70px',
    render: (r: HazardRow) => <span className="font-mono text-xs text-asvo-text">{r.p}&times;{r.s}={r.level}</span>,
  },
  {
    key: 'riskClass',
    label: 'Klass',
    align: 'center' as const,
    width: '80px',
    render: (r: HazardRow) => {
      const c = riskClassColors[r.riskClass];
      return <Badge color={c?.color} bg={c?.bg}>{r.riskClass}</Badge>;
    },
  },
  {
    key: 'residualClass',
    label: 'Rezid.',
    align: 'center' as const,
    width: '80px',
    render: (r: HazardRow) => {
      if (!r.residualClass) return <span className="text-asvo-text-dim text-xs">-</span>;
      const c = riskClassColors[r.residualClass];
      return <Badge color={c?.color} bg={c?.bg}>{r.residualClass}</Badge>;
    },
  },
  {
    key: 'controlCount',
    label: 'Mery',
    align: 'center' as const,
    width: '60px',
    render: (r: HazardRow) => <span className="font-mono text-asvo-text">{r.controlCount}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center' as const,
    width: '120px',
    render: (r: HazardRow) => {
      const c = hazardStatusColors[r.status];
      return <Badge color={c?.color} bg={c?.bg}>{hazardStatusLabels[r.status]}</Badge>;
    },
  },
];

export const traceColumns = [
  {
    key: 'hazardNum',
    label: 'Opasnost\'',
    width: '90px',
    render: (r: TraceRow) => <span className="font-mono text-asvo-accent">{r.hazardNum}</span>,
  },
  {
    key: 'hazardDesc',
    label: 'Opisaniye',
    render: (r: TraceRow) => <span className="text-asvo-text text-xs">{r.hazardDesc}</span>,
  },
  {
    key: 'initialRisk',
    label: 'Iskhodnyy risk',
    align: 'center' as const,
    width: '120px',
    render: (r: TraceRow) => {
      const cls = r.initialRisk.split(' ')[0] as RiskClass;
      const c = riskClassColors[cls];
      return <Badge color={c?.color} bg={c?.bg}>{r.initialRisk}</Badge>;
    },
  },
  {
    key: 'controlType',
    label: 'Tip mery',
    align: 'center' as const,
    width: '120px',
    render: (r: TraceRow) => {
      const c = controlTypeColors[r.controlType];
      return <Badge color={c?.color} bg={c?.bg}>{controlTypeLabels[r.controlType]}</Badge>;
    },
  },
  {
    key: 'controlDesc',
    label: 'Mera upravleniya',
    render: (r: TraceRow) => <span className="text-asvo-text text-xs">{r.controlDesc}</span>,
  },
  {
    key: 'verifResult',
    label: 'Verifikatsiya',
    align: 'center' as const,
    width: '100px',
    render: (r: TraceRow) => {
      const isPASS = r.verifResult === 'PASS';
      return (
        <Badge
          color={isPASS ? '#2DD4A8' : '#F06060'}
          bg={isPASS ? 'rgba(45,212,168,0.14)' : 'rgba(240,96,96,0.14)'}
        >
          {r.verifResult}
        </Badge>
      );
    },
  },
  {
    key: 'residualRisk',
    label: 'Rezid. risk',
    align: 'center' as const,
    width: '120px',
    render: (r: TraceRow) => {
      const cls = r.residualRisk.split(' ')[0] as RiskClass;
      const c = riskClassColors[cls];
      return <Badge color={c?.color} bg={c?.bg}>{r.residualRisk}</Badge>;
    },
  },
  {
    key: 'braResult',
    label: 'Pol\'za/Risk',
    align: 'center' as const,
    width: '100px',
    render: (r: TraceRow) => {
      if (r.braResult === '-') return <span className="text-asvo-text-dim">-</span>;
      return <Badge color="#2DD4A8" bg="rgba(45,212,168,0.14)">{r.braResult}</Badge>;
    },
  },
];
