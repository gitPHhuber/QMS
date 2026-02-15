/**
 * Unit-тесты для reviewController — Management Review CRUD + PDF.
 *
 * Тестирует:
 *   1. getOne: валидация ID (400), не найден (404), успех (200)
 *   2. create: генерация номера, статус 201
 *   3. update: валидация ID, не найден, успешное обновление
 *   4. addAction: привязка к review
 *   5. getStats: возвращает статистику
 *   6. getMinutesPdf: валидация ID, не найден, генерация PDF
 */

const mockManagementReview = {
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
};

const mockReviewAction = {
  findByPk: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
};

jest.mock("../../modules/qms-review/models/ManagementReview", () => ({
  ManagementReview: mockManagementReview,
  ReviewAction: mockReviewAction,
}));

jest.mock("../../models/index", () => ({
  User: { findAll: jest.fn() },
}));

jest.mock("../../modules/qms-nc/models/NcCapa", () => ({
  Nonconformity: { count: jest.fn().mockResolvedValue(0) },
  Capa: { count: jest.fn().mockResolvedValue(0) },
}));

jest.mock("../../modules/core/utils/auditLogger", () => ({
  logAudit: jest.fn(),
}));

const controller = require("../../modules/qms-review/controllers/reviewController");

describe("ReviewController", () => {
  let req, res;

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
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // ── getOne ──

  describe("getOne", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "abc";

      await controller.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid ID" });
    });

    test("Review не найден — 404", async () => {
      req.params.id = "999";
      mockManagementReview.findByPk.mockResolvedValue(null);

      await controller.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Review not found" });
    });

    test("Review найден — json", async () => {
      req.params.id = "1";
      const mockReview = { id: 1, title: "Q1 Review", actions: [] };
      mockManagementReview.findByPk.mockResolvedValue(mockReview);

      await controller.getOne(req, res);

      expect(res.json).toHaveBeenCalledWith(mockReview);
    });
  });

  // ── create ──

  describe("create", () => {
    test("Должен создать review с автогенерированным номером и вернуть 201", async () => {
      mockManagementReview.count.mockResolvedValue(5);
      const mockReview = { id: 6, reviewNumber: "MR-2026-06", title: "Mid-year review" };
      mockManagementReview.create.mockResolvedValue(mockReview);

      req.body = { title: "Mid-year review" };

      await controller.create(req, res);

      expect(mockManagementReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Mid-year review",
          reviewNumber: expect.stringMatching(/^MR-\d{4}-\d{2}$/),
          chairpersonId: 1,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockReview);
    });
  });

  // ── update ──

  describe("update", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "invalid";

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Review не найден — 404", async () => {
      req.params.id = "99";
      mockManagementReview.findByPk.mockResolvedValue(null);

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Успешное обновление", async () => {
      req.params.id = "1";
      req.body = { status: "COMPLETED" };
      const mockReview = {
        id: 1,
        status: "IN_PROGRESS",
        update: jest.fn().mockResolvedValue(true),
      };
      mockManagementReview.findByPk.mockResolvedValue(mockReview);

      await controller.update(req, res);

      expect(mockReview.update).toHaveBeenCalledWith({ status: "COMPLETED" });
      expect(res.json).toHaveBeenCalledWith(mockReview);
    });
  });

  // ── addAction ──

  describe("addAction", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "bad";

      await controller.addAction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Review не найден — 404", async () => {
      req.params.id = "99";
      mockManagementReview.findByPk.mockResolvedValue(null);

      await controller.addAction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Успешное добавление действия — 201", async () => {
      req.params.id = "1";
      req.body = { description: "Fix quality issue", priority: "HIGH" };
      mockManagementReview.findByPk.mockResolvedValue({ id: 1 });

      const mockAction = { id: 5, managementReviewId: 1, description: "Fix quality issue" };
      mockReviewAction.create.mockResolvedValue(mockAction);

      await controller.addAction(req, res);

      expect(mockReviewAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          managementReviewId: 1,
          description: "Fix quality issue",
          priority: "HIGH",
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── updateAction ──

  describe("updateAction", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "x";

      await controller.updateAction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Action не найден — 404", async () => {
      req.params.id = "100";
      mockReviewAction.findByPk.mockResolvedValue(null);

      await controller.updateAction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("Статус COMPLETED — автоматически устанавливает completedAt", async () => {
      req.params.id = "5";
      req.body = { status: "COMPLETED" };
      const mockAction = {
        id: 5,
        managementReviewId: 1,
        completedAt: null,
        update: jest.fn().mockResolvedValue(true),
      };
      mockReviewAction.findByPk.mockResolvedValue(mockAction);

      await controller.updateAction(req, res);

      expect(req.body.completedAt).toBeDefined();
      expect(mockAction.update).toHaveBeenCalled();
    });
  });

  // ── getStats ──

  describe("getStats", () => {
    test("Должен вернуть статистику", async () => {
      mockManagementReview.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(3)  // approved
        .mockResolvedValueOnce(2); // planned
      mockReviewAction.count
        .mockResolvedValueOnce(20) // totalActions
        .mockResolvedValueOnce(8)  // open
        .mockResolvedValueOnce(2); // overdue

      await controller.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalReviews: 10,
          completed: 5,
          approved: 3,
          planned: 2,
          totalActions: 20,
          openActions: 8,
          overdueActions: 2,
        })
      );
    });
  });

  // ── getMinutesPdf ──

  describe("getMinutesPdf", () => {
    test("Некорректный ID — 400", async () => {
      req.params.id = "text";

      await controller.getMinutesPdf(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid ID" });
    });

    test("Review не найден — 404", async () => {
      req.params.id = "999";
      mockManagementReview.findByPk.mockResolvedValue(null);

      await controller.getMinutesPdf(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Review not found" });
    });

    test("Успешная генерация PDF — правильные заголовки", async () => {
      req.params.id = "1";

      const mockReview = {
        id: 1,
        reviewNumber: "MR-2026-01",
        title: "Анализ руководства Q1",
        reviewDate: "2026-01-15",
        periodFrom: "2025-07-01",
        periodTo: "2025-12-31",
        qmsEffectiveness: "EFFECTIVE",
        conclusion: "СМК результативна",
        participants: [{ name: "Иванов И.И.", role: "Председатель" }],
        inputData: {
          auditResults: { total: 3, findings: 5, closed: 4 },
          customerFeedback: { complaints: 1, satisfaction: "95%" },
        },
        outputData: {
          decisions: [{ description: "Улучшить процесс", responsible: "Петров", deadline: "2026-03-01" }],
        },
        actions: [
          { description: "Провести обучение", priority: "HIGH", deadline: "2026-02-28", status: "OPEN" },
        ],
      };

      mockManagementReview.findByPk.mockResolvedValue(mockReview);

      // Для PDF теста: pdfmake использует event emitter, нужно дождаться end
      await new Promise((resolve) => {
        const origSend = res.send;
        res.send = jest.fn((buffer) => {
          // Проверяем что отправили Buffer
          expect(Buffer.isBuffer(buffer)).toBe(true);
          expect(buffer.length).toBeGreaterThan(100); // PDF не пустой
          resolve();
        });

        controller.getMinutesPdf(req, res);
      });

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        expect.stringContaining("Protocol_MR-2026-01")
      );
    });
  });
});
