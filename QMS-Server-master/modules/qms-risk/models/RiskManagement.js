const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// =================================================================
// Plan menedzhmenta riskov — ISO 14971 §4.4
// Master-dokument, opredelyayushchiy oblast', kriterii priyemlemosti,
// planiruemye deystviya po verifikatsii i zhiznennyy tsikl
// =================================================================

const RiskManagementPlan = sequelize.define("risk_management_plan", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  planNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "Autogeneriruemyy nomer: RMP-YYYY-NNN",
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  version: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "1.0" },

  // Produkt / primeneniye
  productName: { type: DataTypes.STRING(500), allowNull: false, comment: "Nazvanie MI" },
  productDescription: { type: DataTypes.TEXT, comment: "Opisanie MI i yego prednaznacheniya" },
  intendedUse: { type: DataTypes.TEXT, allowNull: false, comment: "ISO 14971 §5.2 — predpolagaemoye naznacheniye" },
  intendedPatientPopulation: { type: DataTypes.TEXT, comment: "Tselevaya populyatsiya patsiyentov" },

  // Oblast' primeneniya i kriterii
  scope: { type: DataTypes.TEXT, allowNull: false, comment: "Oblast' primeneniya plana menedzhmenta riskov" },
  riskAcceptabilityCriteria: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      acceptableRiskClasses: ["LOW"],
      conditionallyAcceptableRiskClasses: ["MEDIUM"],
      unacceptableRiskClasses: ["HIGH", "CRITICAL"],
      alaRpThreshold: "Nastol'ko nizkiy, naskol'ko prakticheski dostizhimo",
    },
    comment: "ISO 14971 §4.4c — kriterii priyemlemosti riskov",
  },
  verificationPlanSummary: {
    type: DataTypes.TEXT,
    comment: "ISO 14971 §4.4d — plan verifikatsii mer upravleniya riskami",
  },

  // Zhiznennyy tsikl
  lifecyclePhase: {
    type: DataTypes.ENUM(
      "CONCEPT",      // Razrabotka kontseptsii
      "DESIGN",       // Proyektirovaniye
      "VERIFICATION", // Verifikatsiya
      "VALIDATION",   // Validatsiya
      "PRODUCTION",   // Proizvodstvo
      "POST_MARKET"   // Postmarketingovoye nablyudeniye
    ),
    allowNull: false,
    defaultValue: "CONCEPT",
  },

  // Status i utverzhdeniye
  status: {
    type: DataTypes.ENUM("DRAFT", "REVIEW", "APPROVED", "EFFECTIVE", "REVISION", "ARCHIVED"),
    defaultValue: "DRAFT",
  },
  responsiblePersonId: { type: DataTypes.INTEGER, allowNull: true, comment: "Otvetstvenniy za risk management" },
  approvedBy: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
  effectiveDate: { type: DataTypes.DATE, allowNull: true },
  nextReviewDate: { type: DataTypes.DATE, allowNull: true },

  // Ssylki
  relatedProductId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK na product_registry yesli yest'" },
});

// =================================================================
// Analiz opasnostey (Hazard Analysis) — ISO 14971 §5
// Sistematicheskaya identifikatsiya opasnostey, opasnykh situatsiy i vreda
// =================================================================

const Hazard = sequelize.define("hazard", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riskManagementPlanId: { type: DataTypes.INTEGER, allowNull: false },

  hazardNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Autogeneriruemyy: HAZ-NNN",
  },

  // Identifikatsiya opasnosti (ISO 14971 §5.4)
  hazardCategory: {
    type: DataTypes.ENUM(
      "ENERGY",          // Energeticheskiye opasnosti
      "BIOLOGICAL",      // Biologicheskiye
      "CHEMICAL",        // Khimicheskiye
      "OPERATIONAL",     // Operatsionnyye
      "INFORMATION",     // Informatsionnyye
      "ENVIRONMENTAL",   // Okruzhayushchaya sreda
      "ELECTROMAGNETIC", // Elektromagnitnyye
      "MECHANICAL",      // Mekhanicheskiye
      "THERMAL",         // Termicheskiye
      "RADIATION",       // Radiatsiya
      "SOFTWARE",        // Programmnoye obespecheniye
      "USE_ERROR"        // Oshibki pol'zovaniya
    ),
    allowNull: false,
  },
  hazardDescription: { type: DataTypes.TEXT, allowNull: false, comment: "Opisaniye opasnosti" },

  // Posledovatel'nost' sobytiy (ISO 14971 §5.4)
  foreseeableSequence: { type: DataTypes.TEXT, allowNull: false, comment: "Predvidimaya posledovatel'nost' sobytiy" },
  hazardousSituation: { type: DataTypes.TEXT, allowNull: false, comment: "Opasnaya situatsiya" },
  harm: { type: DataTypes.TEXT, allowNull: false, comment: "Potentsial'nyy vred (travma/ushcherb zdorov'yu)" },

  // Otsenka riska (ISO 14971 §5.5)
  severityOfHarm: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
    comment: "Tyazhest' vreda: 1=Nezn., 5=Katastroficheskoye",
  },
  probabilityOfOccurrence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
    comment: "Veroyatnost': 1=Neveroyatnoye, 5=Chastoye",
  },
  probabilityOfHarm: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
    comment: "Veroyatnost' vreda pri opasnoy situatsii (ISO 14971 D.5)",
  },
  riskLevel: { type: DataTypes.INTEGER, allowNull: true, comment: "severity x probability (avtoraschyot)" },
  riskClass: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), allowNull: true },

  // Otsenka posle mer upravleniya (rezidual'nyy risk)
  residualSeverity: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
  residualProbability: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
  residualRiskLevel: { type: DataTypes.INTEGER, allowNull: true },
  residualRiskClass: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), allowNull: true },

  // Status
  status: {
    type: DataTypes.ENUM("IDENTIFIED", "ANALYZED", "CONTROLLED", "VERIFIED", "ACCEPTED", "MONITORING"),
    defaultValue: "IDENTIFIED",
  },

  // Svyazi
  linkedRiskRegisterId: { type: DataTypes.INTEGER, allowNull: true, comment: "Svyaz' s obshchim reyestrom riskov" },
  isoClause: { type: DataTypes.STRING, allowNull: true, comment: "Punkt ISO 14971" },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

// =================================================================
// Otsenka pol'zy/riska (Benefit-Risk Analysis) — ISO 14971 §6.5
// =================================================================

const BenefitRiskAnalysis = sequelize.define("benefit_risk_analysis", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riskManagementPlanId: { type: DataTypes.INTEGER, allowNull: false },
  hazardId: { type: DataTypes.INTEGER, allowNull: true, comment: "Svyaz' s konkretnym hazard (mozhet byt' obshchim)" },

  analysisNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Autogeneriruemyy: BRA-NNN",
  },

  // Rezidual'nyy risk
  residualRiskDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Opisaniye ostatochnogo riska posle vsekh mer",
  },
  residualRiskClass: {
    type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
    allowNull: false,
  },

  // Pol'za
  clinicalBenefitDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Opisaniye klinicheskoy pol'zy",
  },
  benefitJustification: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Obosnovaniye pochemu pol'za prevy'shayet risk",
  },

  // Resheniye
  benefitOutweighsRisk: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: "Pol'za prevyshayet rezidual'nyy risk?",
  },

  // Kontekst
  stateOfTheArt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "ISO 14971 §6.5 — sovremennoye sostoyaniye tekhniki",
  },
  alternativeSolutions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Rassmotrennyye al'ternativnyye resheniya",
  },
  literatureReferences: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Ssylki na literaturu / klinicheskiye dannyye",
  },

  // Zaklyucheniye
  conclusion: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Itogovoye zaklyucheniye po benefit/risk",
  },

  // Kto provyol
  assessorId: { type: DataTypes.INTEGER, allowNull: false },
  assessmentDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  reviewedBy: { type: DataTypes.INTEGER, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
});

// =================================================================
// Proslezhivayemost' mer upravleniya riskami — ISO 14971 §7, §8
// Polnaya matritsa: Opasnost' -> Mera -> Verifikatsiya -> Rezidual'nyy risk
// =================================================================

const RiskControlTraceability = sequelize.define("risk_control_traceability", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riskManagementPlanId: { type: DataTypes.INTEGER, allowNull: false },
  hazardId: { type: DataTypes.INTEGER, allowNull: false, comment: "Svyaz' s analizom opasnostey" },

  traceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Autogeneriruemyy: RCT-NNN",
  },

  // Mera upravleniya (ISO 14971 §7.1)
  controlMeasureDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Opisaniye mery upravleniya riskom",
  },
  controlType: {
    type: DataTypes.ENUM(
      "INHERENT_SAFETY",  // ISO 14971 §7.2 — inherently safe design
      "PROTECTIVE",       // ISO 14971 §7.3 — protective measures
      "INFORMATION"       // ISO 14971 §7.4 — information for safety
    ),
    allowNull: false,
    comment: "Prioritet po ISO 14971: design > protective > information",
  },
  controlPriority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Poryadok primeneniya (1 = pervyy)",
  },

  // Realizatsiya
  implementationStatus: {
    type: DataTypes.ENUM("PLANNED", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "INEFFECTIVE"),
    defaultValue: "PLANNED",
  },
  implementedDate: { type: DataTypes.DATE, allowNull: true },
  implementedBy: { type: DataTypes.INTEGER, allowNull: true },

  // Verifikatsiya effektivnosti (ISO 14971 §7.5)
  verificationMethod: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Metod verifikatsii (ispytaniye, inspektsiya, analiz)",
  },
  verificationCriteria: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Kriterii uspeshnosti verifikatsii",
  },
  verificationResult: {
    type: DataTypes.ENUM("PENDING", "PASS", "FAIL", "PARTIAL"),
    defaultValue: "PENDING",
  },
  verificationEvidence: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Ssylka na dokazatel'stva / protokoly ispytaniy",
  },
  verificationDate: { type: DataTypes.DATE, allowNull: true },
  verifiedById: { type: DataTypes.INTEGER, allowNull: true },

  // Rezidual'nyy risk (ISO 14971 §7.6)
  residualRiskAcceptable: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: "Rezidual'nyy risk priyemlem posle mery?",
  },

  // Novyye opasnosti (ISO 14971 §7.7)
  newHazardsIntroduced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Vvedeny li novyye opasnosti?",
  },
  newHazardDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Opisaniye novykh vvedyonnykh opasnostey",
  },

  // Svyaz' s sushchestvuyushchimi merami v reyestre
  linkedMitigationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "FK na risk_mitigations (sushchestvuyushchiy reyestr)",
  },
});

// =================================================================
// Assotsiatsii
// =================================================================

// RiskManagementPlan -> Hazards
RiskManagementPlan.hasMany(Hazard, { as: "hazards", foreignKey: "riskManagementPlanId" });
Hazard.belongsTo(RiskManagementPlan, { foreignKey: "riskManagementPlanId" });

// RiskManagementPlan -> BenefitRiskAnalysis
RiskManagementPlan.hasMany(BenefitRiskAnalysis, { as: "benefitRiskAnalyses", foreignKey: "riskManagementPlanId" });
BenefitRiskAnalysis.belongsTo(RiskManagementPlan, { foreignKey: "riskManagementPlanId" });

// Hazard -> BenefitRiskAnalysis
Hazard.hasMany(BenefitRiskAnalysis, { as: "benefitRiskAnalyses", foreignKey: "hazardId" });
BenefitRiskAnalysis.belongsTo(Hazard, { foreignKey: "hazardId" });

// RiskManagementPlan -> RiskControlTraceability
RiskManagementPlan.hasMany(RiskControlTraceability, { as: "controlTraceability", foreignKey: "riskManagementPlanId" });
RiskControlTraceability.belongsTo(RiskManagementPlan, { foreignKey: "riskManagementPlanId" });

// Hazard -> RiskControlTraceability
Hazard.hasMany(RiskControlTraceability, { as: "controlMeasures", foreignKey: "hazardId" });
RiskControlTraceability.belongsTo(Hazard, { foreignKey: "hazardId" });

module.exports = {
  RiskManagementPlan,
  Hazard,
  BenefitRiskAnalysis,
  RiskControlTraceability,
};
