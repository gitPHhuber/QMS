import type {
  RiskManagementPlanShort,
  HazardShort,
  TraceabilityMatrixRow,
  ControlType,
} from "../../../api/qmsApi";
import type { PlanRow, HazardRow, TraceRow, BenefitRiskRow } from "./types";

export function mapPlan(p: RiskManagementPlanShort): PlanRow {
  return {
    id: p.id,
    planNumber: p.planNumber,
    title: p.title,
    product: p.productName,
    phase: p.lifecyclePhase,
    status: p.status,
    hazardCount: p.hazards?.length ?? 0,
    version: p.version,
  };
}

export function mapHazard(h: HazardShort): HazardRow {
  return {
    id: h.id,
    number: h.hazardNumber,
    category: h.hazardCategory,
    description: h.hazardDescription,
    harm: h.harm,
    p: h.probabilityOfOccurrence,
    s: h.severityOfHarm,
    level: h.riskLevel,
    riskClass: h.riskClass,
    residualClass: h.residualRiskClass,
    status: h.status,
    controlCount: 0,
  };
}

export function mapTraceRow(t: TraceabilityMatrixRow): TraceRow[] {
  if (!t.controlMeasures || t.controlMeasures.length === 0) {
    const iRisk = t.initialRisk;
    const rRisk = t.residualRisk;
    return [{
      id: `${t.hazardId}-0`,
      hazardNum: t.hazardNumber,
      hazardDesc: t.hazardDescription,
      initialRisk: `${iRisk.class} (${iRisk.probability}x${iRisk.severity}=${iRisk.level})`,
      controlType: 'INHERENT_SAFETY' as ControlType,
      controlDesc: '-',
      verifResult: '-',
      residualRisk: rRisk.class
        ? `${rRisk.class} (${rRisk.probability ?? '?'}x${rRisk.severity ?? '?'}=${rRisk.level ?? '?'})`
        : '-',
      braResult: t.benefitRiskAnalysis
        ? (t.benefitRiskAnalysis.benefitOutweighsRisk ? "Pol'za > Risk" : "Risk > Pol'za")
        : '-',
    }];
  }

  return t.controlMeasures.map((cm, idx) => {
    const iRisk = t.initialRisk;
    const rRisk = t.residualRisk;
    return {
      id: `${t.hazardId}-${idx}`,
      hazardNum: t.hazardNumber,
      hazardDesc: t.hazardDescription,
      initialRisk: `${iRisk.class} (${iRisk.probability}x${iRisk.severity}=${iRisk.level})`,
      controlType: cm.type,
      controlDesc: cm.description,
      verifResult: cm.verificationResult,
      residualRisk: rRisk.class
        ? `${rRisk.class} (${rRisk.probability ?? '?'}x${rRisk.severity ?? '?'}=${rRisk.level ?? '?'})`
        : '-',
      braResult: t.benefitRiskAnalysis
        ? (t.benefitRiskAnalysis.benefitOutweighsRisk ? "Pol'za > Risk" : "Risk > Pol'za")
        : '-',
    };
  });
}

export function mapBenefitRisk(bra: any): BenefitRiskRow {
  return {
    id: bra.id,
    hazard: bra.hazard
      ? `${bra.hazard.hazardNumber ?? 'HAZ-???'} — ${bra.hazard.hazardDescription ?? bra.hazardDescription ?? ''}`
      : `BRA-${bra.id}`,
    residualRisk: bra.residualRiskClass ?? bra.residualRisk ?? 'MEDIUM',
    benefit: bra.intendedBenefit ?? bra.benefit ?? '',
    conclusion: bra.conclusion ?? '',
    outweighs: bra.benefitOutweighsRisk ?? false,
  };
}
