/**
 * Unit-тесты для NcCapaController — NC и CAPA операции.
 *
 * Тестирует:
 *   1. Валидацию ID (NaN → 400)
 *   2. NC CRUD: getOne (404, 200), create (201), list
 *   3. CAPA CRUD: getOne (404, 200), create (201)
 *   4. handleError: бизнес-ошибки → 400, инфраструктурные → 500
 *   5. Stats, Escalation, Overdue
 */

jest.mock("../../modules/qms-nc/services/NcCapaService");
jest.mock("../../modules/qms-nc/services/SlaEscalationService");

const NcCapaService = require("../../modules/qms-nc/services/NcCapaService");
const SlaEscalationService = require("../../modules/qms-nc/services/SlaEscalationService");
const controller = require("../../modules/qms-nc/controllers/ncCapaController");
const ApiError = require("../../error/ApiError");

describe("NcCapaController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 1 },
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ── NC ──

  describe("getNcList", () => {
    test("Должен вернуть список NC", async () => {
      const mockList = { rows: [{ id: 1 }], count: 1 };
      NcCapaService.getNCList.mockResolvedValue(mockList);
      req.query = { status: "OPEN" };

      await controller.getNcList(req, res, next);

      expect(NcCapaService.getNCList).toHaveBeenCalledWith({ status: "OPEN" });
      expect(res.json).toHaveBeenCalledWith(mockList);
    });

    test("При ошибке сервиса — вызывает next с 400", async () => {
      NcCapaService.getNCList.mockRejectedValue(new Error("DB error"));

      await controller.getNcList(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });
  });

  describe("getNcOne", () => {
    test("Некорректный ID — вызывает next с 400", async () => {
      req.params.id = "abc";

      await controller.getNcOne(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
      expect(err.message).toContain("Некорректный ID");
    });

    test("NC не найдена — вызывает next с 404", async () => {
      req.params.id = "999";
      NcCapaService.getNCDetail.mockResolvedValue(null);

      await controller.getNcOne(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.status).toBe(404);
    });

    test("NC найдена — возвращает json", async () => {
      req.params.id = "1";
      const mockNc = { id: 1, title: "NC-001" };
      NcCapaService.getNCDetail.mockResolvedValue(mockNc);

      await controller.getNcOne(req, res, next);

      expect(NcCapaService.getNCDetail).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockNc);
    });
  });

  describe("createNc", () => {
    test("Должен создать NC и вернуть 201", async () => {
      const mockNc = { id: 1, ncNumber: "NC-2026-001" };
      NcCapaService.createNC.mockResolvedValue(mockNc);
      req.body = { title: "Test NC", severity: "MAJOR" };

      await controller.createNc(req, res, next);

      expect(NcCapaService.createNC).toHaveBeenCalledWith(req, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNc);
    });
  });

  describe("updateNc", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "not-a-number";

      await controller.updateNc(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });

    test("Успешное обновление — 200", async () => {
      req.params.id = "1";
      req.body = { status: "IN_PROGRESS" };
      const mockNc = { id: 1, status: "IN_PROGRESS" };
      NcCapaService.updateNC.mockResolvedValue(mockNc);

      await controller.updateNc(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockNc);
    });
  });

  describe("closeNc", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "xyz";

      await controller.closeNc(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });

    test("Успешное закрытие", async () => {
      req.params.id = "5";
      req.body = { resolution: "Resolved" };
      NcCapaService.closeNC.mockResolvedValue({ id: 5, status: "CLOSED" });

      await controller.closeNc(req, res, next);

      expect(NcCapaService.closeNC).toHaveBeenCalledWith(req, 5, req.body);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "CLOSED" }));
    });
  });

  // ── CAPA ──

  describe("getCapaOne", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "NaN";

      await controller.getCapaOne(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });

    test("CAPA не найдена — 404", async () => {
      req.params.id = "100";
      NcCapaService.getCAPADetail.mockResolvedValue(null);

      await controller.getCapaOne(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(404);
      expect(err.message).toContain("CAPA не найдена");
    });

    test("CAPA найдена — json", async () => {
      req.params.id = "10";
      const mockCapa = { id: 10, title: "CAPA-001" };
      NcCapaService.getCAPADetail.mockResolvedValue(mockCapa);

      await controller.getCapaOne(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockCapa);
    });
  });

  describe("createCapa", () => {
    test("Должен создать CAPA и вернуть 201", async () => {
      const mockCapa = { id: 1, capaNumber: "CAPA-2026-001" };
      NcCapaService.createCAPA.mockResolvedValue(mockCapa);

      await controller.createCapa(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCapa);
    });
  });

  describe("addCapaAction", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "abc";

      await controller.addCapaAction(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });

    test("Успешное добавление действия — 201", async () => {
      req.params.id = "3";
      req.body = { description: "Corrective action" };
      NcCapaService.addCapaAction.mockResolvedValue({ id: 7, capaId: 3 });

      await controller.addCapaAction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("verifyEffectiveness", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "null";

      await controller.verifyEffectiveness(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });

    test("Успешная верификация", async () => {
      req.params.id = "5";
      req.body = { effective: true, evidence: "Test results OK" };
      NcCapaService.verifyCapaEffectiveness.mockResolvedValue({ id: 5, verified: true });

      await controller.verifyEffectiveness(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  // ── Stats / Escalation ──

  describe("getStats", () => {
    test("Должен вернуть статистику", async () => {
      const mockStats = { ncOpen: 5, capaOpen: 3 };
      NcCapaService.getStats.mockResolvedValue(mockStats);

      await controller.getStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockStats);
    });
  });

  describe("checkEscalation", () => {
    test("Должен вызвать SlaEscalationService", async () => {
      SlaEscalationService.checkAndEscalate.mockResolvedValue({ escalated: 2 });

      await controller.checkEscalation(req, res, next);

      expect(SlaEscalationService.checkAndEscalate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ escalated: 2 });
    });
  });

  describe("getOverdueItems", () => {
    test("Должен вернуть просроченные элементы", async () => {
      SlaEscalationService.getOverdueItems.mockResolvedValue([{ id: 1, overdueDays: 3 }]);

      await controller.getOverdueItems(req, res, next);

      expect(res.json).toHaveBeenCalledWith([{ id: 1, overdueDays: 3 }]);
    });
  });

  // ── NC ↔ Risk Linkage ──

  describe("linkNcToRisk", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "foo";

      await controller.linkNcToRisk(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.status).toBe(400);
    });

    test("Успешная привязка к риску", async () => {
      req.params.id = "2";
      req.body = { riskRegisterId: 10 };
      NcCapaService.linkNCToRisk.mockResolvedValue({ id: 2, riskRegisterId: 10 });

      await controller.linkNcToRisk(req, res, next);

      expect(NcCapaService.linkNCToRisk).toHaveBeenCalledWith(req, 2, 10);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ── handleError ──

  describe("handleError (через контроллер)", () => {
    test("ApiError проходит напрямую в next", async () => {
      const apiErr = ApiError.notFound("Тестовая ошибка");
      NcCapaService.getNCList.mockRejectedValue(apiErr);

      await controller.getNcList(req, res, next);

      expect(next).toHaveBeenCalledWith(apiErr);
    });

    test("Инфраструктурная ошибка (ECONNREFUSED) → 500", async () => {
      const infraErr = new Error("Cannot connect ECONNREFUSED");
      NcCapaService.getNCList.mockRejectedValue(infraErr);

      await controller.getNcList(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.status).toBe(500);
    });
  });
});
