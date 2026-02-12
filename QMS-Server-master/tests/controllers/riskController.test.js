jest.mock('../../models/index', () => ({
  User: {
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

jest.mock('../../modules/qms-risk/models/Risk', () => ({
  RiskRegister: {
    findByPk: jest.fn(),
  },
  RiskAssessment: {},
  RiskMitigation: {},
}));

jest.mock('../../modules/qms-risk/services/RiskMatrixService', () => ({
  calculate: jest.fn(),
}));

jest.mock('../../modules/core/utils/auditLogger', () => ({
  logAudit: jest.fn(),
}));

const riskController = require('../../modules/qms-risk/controllers/riskController');
const { RiskRegister } = require('../../modules/qms-risk/models/Risk');
const RiskMatrixService = require('../../modules/qms-risk/services/RiskMatrixService');
const { logAudit } = require('../../modules/core/utils/auditLogger');

describe('riskController.update', () => {
  let req;
  let res;
  let next;
  let risk;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: '1' },
      body: {},
      user: { id: 123 },
    };
    res = { json: jest.fn() };
    next = jest.fn();

    risk = {
      id: 1,
      initialProbability: 2,
      initialSeverity: 4,
      update: jest.fn().mockResolvedValue(),
    };

    RiskRegister.findByPk.mockResolvedValue(risk);
    RiskMatrixService.calculate.mockReturnValue({ level: 10, riskClass: 'HIGH' });
    logAudit.mockResolvedValue();
  });

  test('пересчитывает уровень/класс при обновлении только initialProbability', async () => {
    req.body = { initialProbability: 5 };

    await riskController.update(req, res, next);

    expect(RiskMatrixService.calculate).toHaveBeenCalledWith(5, 4);
    expect(risk.update).toHaveBeenCalledWith({
      initialProbability: 5,
      initialRiskLevel: 10,
      initialRiskClass: 'HIGH',
    });
    expect(res.json).toHaveBeenCalledWith(risk);
  });

  test('пересчитывает уровень/класс при обновлении только initialSeverity', async () => {
    req.body = { initialSeverity: 1 };

    await riskController.update(req, res, next);

    expect(RiskMatrixService.calculate).toHaveBeenCalledWith(2, 1);
    expect(risk.update).toHaveBeenCalledWith({
      initialSeverity: 1,
      initialRiskLevel: 10,
      initialRiskClass: 'HIGH',
    });
    expect(res.json).toHaveBeenCalledWith(risk);
  });

  test('пересчитывает уровень/класс при обновлении initialProbability и initialSeverity', async () => {
    req.body = { initialProbability: 3, initialSeverity: 5 };

    await riskController.update(req, res, next);

    expect(RiskMatrixService.calculate).toHaveBeenCalledWith(3, 5);
    expect(risk.update).toHaveBeenCalledWith({
      initialProbability: 3,
      initialSeverity: 5,
      initialRiskLevel: 10,
      initialRiskClass: 'HIGH',
    });
    expect(res.json).toHaveBeenCalledWith(risk);
  });
});
