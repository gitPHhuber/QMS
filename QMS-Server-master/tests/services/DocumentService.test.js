/**
 * Unit-тесты для DocumentService — жизненный цикл документов DMS.
 *
 * Тестирует:
 *   1. normalizeIsoSection — нормализация входных данных
 *   2. generateDocumentCode — генерация кодов с ISO-секцией и без
 *   3. createDocument — создание документа с транзакцией
 *   4. uploadVersionFile — загрузка файла с SHA-256 хешем
 *   5. submitForReview — отправка на согласование
 *   6. makeDecision — решение (APPROVED / REJECTED)
 *   7. makeEffective — введение в действие
 *   8. createNewVersion — создание новой версии (пересмотр)
 */

// Мокаем DB
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.mock("../../db", () => ({
  transaction: jest.fn(async () => mockTransaction),
  query: jest.fn(),
  QueryTypes: { SELECT: "SELECT" },
}));

// Мокаем модели Document
const mockDocumentCreate = jest.fn();
const mockDocumentFindByPk = jest.fn();
const mockDocumentFindAll = jest.fn();
const mockDocumentUpdate = jest.fn();

const mockVersionCreate = jest.fn();
const mockVersionFindByPk = jest.fn();
const mockVersionUpdate = jest.fn();

const mockApprovalCreate = jest.fn();
const mockApprovalFindByPk = jest.fn();
const mockApprovalFindAll = jest.fn();

const mockDistributionFindOrCreate = jest.fn();
const mockDistributionFindByPk = jest.fn();

jest.mock("../../modules/qms-dms/models/Document", () => ({
  Document: {
    create: (...args) => mockDocumentCreate(...args),
    findByPk: (...args) => mockDocumentFindByPk(...args),
    findAll: (...args) => mockDocumentFindAll(...args),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
  },
  DocumentVersion: {
    create: (...args) => mockVersionCreate(...args),
    findByPk: (...args) => mockVersionFindByPk(...args),
  },
  DocumentApproval: {
    create: (...args) => mockApprovalCreate(...args),
    findByPk: (...args) => mockApprovalFindByPk(...args),
    findAll: (...args) => mockApprovalFindAll(...args),
    count: jest.fn(),
  },
  DocumentDistribution: {
    findOrCreate: (...args) => mockDistributionFindOrCreate(...args),
    findByPk: (...args) => mockDistributionFindByPk(...args),
  },
  DOCUMENT_STATUSES: {
    DRAFT: "DRAFT",
    REVIEW: "REVIEW",
    APPROVED: "APPROVED",
    EFFECTIVE: "EFFECTIVE",
    REVISION: "REVISION",
    OBSOLETE: "OBSOLETE",
  },
  VERSION_STATUSES: {
    DRAFT: "DRAFT",
    REVIEW: "REVIEW",
    APPROVED: "APPROVED",
    EFFECTIVE: "EFFECTIVE",
    REJECTED: "REJECTED",
    SUPERSEDED: "SUPERSEDED",
  },
  APPROVAL_DECISIONS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    RETURNED: "RETURNED",
  },
  TYPE_CODE_PREFIX: {
    SOP: "СТО",
    WI: "РИ",
    FORM: "Ф",
    MANUAL: "РК",
    POLICY: "ПОЛ",
  },
}));

jest.mock("../../models/index", () => ({
  User: { findAll: jest.fn() },
}));

jest.mock("../../modules/core/utils/auditLogger", () => ({
  logDocumentCreate: jest.fn(),
  logDocumentApproval: jest.fn(),
  logDocumentEffective: jest.fn(),
  logAudit: jest.fn(),
  AUDIT_ACTIONS: {
    DOCUMENT_VERSION_CREATE: "DOCUMENT_VERSION_CREATE",
    DOCUMENT_SUBMIT_REVIEW: "DOCUMENT_SUBMIT_REVIEW",
    DOCUMENT_DISTRIBUTE: "DOCUMENT_DISTRIBUTE",
    DOCUMENT_ACKNOWLEDGE: "DOCUMENT_ACKNOWLEDGE",
  },
}));

jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Загружаем после моков
const DocumentService = require("../../modules/qms-dms/services/DocumentService");
const sequelize = require("../../db");
const { User } = require("../../models/index");

describe("DocumentService", () => {
  let req;

  beforeEach(() => {
    req = { user: { id: 1, name: "Test" } };
    jest.clearAllMocks();
    mockTransaction.commit.mockReset();
    mockTransaction.rollback.mockReset();
  });

  // ── normalizeIsoSection ──

  describe("normalizeIsoSection", () => {
    test("null → null", () => {
      expect(DocumentService.normalizeIsoSection(null)).toBeNull();
    });

    test("undefined → null", () => {
      expect(DocumentService.normalizeIsoSection(undefined)).toBeNull();
    });

    test("пустая строка → null", () => {
      expect(DocumentService.normalizeIsoSection("")).toBeNull();
    });

    test("пробелы → null", () => {
      expect(DocumentService.normalizeIsoSection("   ")).toBeNull();
    });

    test("'7.1' → '7.1'", () => {
      expect(DocumentService.normalizeIsoSection("7.1")).toBe("7.1");
    });

    test("' 7.1 ' → '7.1' (trim)", () => {
      expect(DocumentService.normalizeIsoSection(" 7.1 ")).toBe("7.1");
    });

    test("числовой аргумент → строка", () => {
      expect(DocumentService.normalizeIsoSection(7)).toBe("7");
    });
  });

  // ── generateDocumentCode ──

  describe("generateDocumentCode", () => {
    test("С isoSection, без дубликатов — возвращает PREFIX-section", async () => {
      mockDocumentFindAll.mockResolvedValue([]);

      const code = await DocumentService.generateDocumentCode(mockTransaction, {
        type: "SOP",
        isoSection: "7.1",
      });

      expect(code).toBe("СТО-7.1");
    });

    test("С isoSection, есть дубликат — добавляет суффикс", async () => {
      mockDocumentFindAll.mockResolvedValue([
        { code: "СТО-7.1" },
      ]);

      const code = await DocumentService.generateDocumentCode(mockTransaction, {
        type: "SOP",
        isoSection: "7.1",
      });

      expect(code).toBe("СТО-7.1-2");
    });

    test("С isoSection, несколько дубликатов — инкрементирует", async () => {
      mockDocumentFindAll.mockResolvedValue([
        { code: "СТО-7.1" },
        { code: "СТО-7.1-2" },
        { code: "СТО-7.1-3" },
      ]);

      const code = await DocumentService.generateDocumentCode(mockTransaction, {
        type: "SOP",
        isoSection: "7.1",
      });

      expect(code).toBe("СТО-7.1-4");
    });

    test("Без isoSection — формат PREFIX-СМК-NNN", async () => {
      sequelize.query.mockResolvedValue([{ max_num: 5 }]);

      const code = await DocumentService.generateDocumentCode(mockTransaction, {
        type: "SOP",
        isoSection: null,
      });

      expect(code).toBe("СТО-СМК-006");
    });

    test("Без isoSection, без существующих — номер 001", async () => {
      sequelize.query.mockResolvedValue([{ max_num: null }]);

      const code = await DocumentService.generateDocumentCode(mockTransaction, {
        type: "WI",
        isoSection: null,
      });

      expect(code).toBe("РИ-СМК-001");
    });

    test("Неизвестный тип — префикс ДОК", async () => {
      sequelize.query.mockResolvedValue([{ max_num: 0 }]);

      const code = await DocumentService.generateDocumentCode(mockTransaction, {
        type: "UNKNOWN",
        isoSection: null,
      });

      expect(code).toBe("ДОК-СМК-001");
    });
  });

  // ── createDocument ──

  describe("createDocument", () => {
    test("Должен создать документ и версию в транзакции", async () => {
      const mockDoc = {
        id: 1,
        code: "СТО-7.1",
        update: jest.fn(),
      };
      const mockVersion = {
        id: 10,
        version: "1.0",
      };

      mockDocumentFindAll.mockResolvedValue([]); // для generateDocumentCode
      mockDocumentCreate.mockResolvedValue(mockDoc);
      mockVersionCreate.mockResolvedValue(mockVersion);

      const result = await DocumentService.createDocument(req, {
        title: "Процедура контроля",
        type: "SOP",
        isoSection: "7.1",
      });

      expect(result.document).toBe(mockDoc);
      expect(result.version).toBe(mockVersion);
      expect(mockDoc.update).toHaveBeenCalledWith(
        { currentVersionId: 10 },
        expect.objectContaining({})
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    test("При ошибке — rollback транзакции", async () => {
      mockDocumentFindAll.mockResolvedValue([]); // для generateDocumentCode
      mockDocumentCreate.mockRejectedValue(new Error("DB failure"));

      await expect(
        DocumentService.createDocument(req, { title: "Test", type: "SOP", isoSection: "7.1" })
      ).rejects.toThrow("DB failure");

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  // ── uploadVersionFile ──

  describe("uploadVersionFile", () => {
    test("Версия не найдена — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue(null);

      await expect(
        DocumentService.uploadVersionFile(req, 999, { name: "test.pdf", data: Buffer.from("x") })
      ).rejects.toThrow("Версия не найдена");
    });

    test("Не черновик — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue({
        id: 1,
        status: "REVIEW",
        documentId: 1,
        versionNumber: 1,
      });

      await expect(
        DocumentService.uploadVersionFile(req, 1, { name: "test.pdf", data: Buffer.from("x") })
      ).rejects.toThrow("Загрузка файла возможна только для черновика");
    });

    test("Успешная загрузка — обновляет версию с хешем", async () => {
      const mockUpdate = jest.fn();
      mockVersionFindByPk.mockResolvedValue({
        id: 1,
        status: "DRAFT",
        documentId: 5,
        versionNumber: 2,
        update: mockUpdate,
      });

      const file = {
        name: "document.pdf",
        data: Buffer.from("test content"),
        size: 12,
        mimetype: "application/pdf",
      };

      await DocumentService.uploadVersionFile(req, 1, file);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: "document.pdf",
          fileSize: 12,
          fileMimeType: "application/pdf",
          fileHash: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256
        })
      );
    });
  });

  // ── submitForReview ──

  describe("submitForReview", () => {
    test("Версия не найдена — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue(null);

      await expect(
        DocumentService.submitForReview(req, 999, [])
      ).rejects.toThrow("Версия не найдена");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test("Пустая цепочка согласования — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue({
        id: 1,
        status: "DRAFT",
        document: { update: jest.fn() },
        update: jest.fn(),
      });

      await expect(
        DocumentService.submitForReview(req, 1, [])
      ).rejects.toThrow("Цепочка согласования не может быть пустой");
    });

    test("Несуществующие пользователи — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue({
        id: 1,
        status: "DRAFT",
        document: { code: "СТО-7.1", update: jest.fn() },
        update: jest.fn(),
      });
      User.findAll.mockResolvedValue([{ id: 1 }]);

      await expect(
        DocumentService.submitForReview(req, 1, [
          { userId: 1, role: "REVIEWER" },
          { userId: 999, role: "APPROVER" },
        ])
      ).rejects.toThrow("Пользователи не найдены: 999");
    });
  });

  // ── makeDecision ──

  describe("makeDecision", () => {
    test("Шаг не найден — ошибка", async () => {
      mockApprovalFindByPk.mockResolvedValue(null);

      await expect(
        DocumentService.makeDecision(req, 999, { decision: "APPROVED" })
      ).rejects.toThrow("Шаг согласования не найден");
    });

    test("Чужой шаг — ошибка", async () => {
      mockApprovalFindByPk.mockResolvedValue({
        id: 1,
        assignedToId: 999, // не текущий пользователь (id: 1)
        decision: "PENDING",
        version: { document: {} },
      });

      await expect(
        DocumentService.makeDecision(req, 1, { decision: "APPROVED" })
      ).rejects.toThrow("Вы не являетесь назначенным согласователем");
    });

    test("Решение уже принято — ошибка", async () => {
      mockApprovalFindByPk.mockResolvedValue({
        id: 1,
        assignedToId: 1,
        decision: "APPROVED", // уже принято
        version: { document: {} },
      });

      await expect(
        DocumentService.makeDecision(req, 1, { decision: "APPROVED" })
      ).rejects.toThrow("Решение уже принято");
    });
  });

  // ── makeEffective ──

  describe("makeEffective", () => {
    test("Версия не найдена — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue(null);

      await expect(
        DocumentService.makeEffective(req, 999)
      ).rejects.toThrow("Версия не найдена");
    });

    test("Не APPROVED — ошибка", async () => {
      mockVersionFindByPk.mockResolvedValue({
        id: 1,
        status: "DRAFT",
        document: {},
      });

      await expect(
        DocumentService.makeEffective(req, 1)
      ).rejects.toThrow("Только утверждённую версию можно ввести в действие");
    });
  });

  // ── createNewVersion ──

  describe("createNewVersion", () => {
    test("Документ не найден — ошибка", async () => {
      mockDocumentFindByPk.mockResolvedValue(null);

      await expect(
        DocumentService.createNewVersion(req, 999, { changeDescription: "Test" })
      ).rejects.toThrow("Документ не найден");
    });

    test("Есть незавершённый черновик — ошибка", async () => {
      mockDocumentFindByPk.mockResolvedValue({
        id: 1,
        versions: [
          { id: 10, version: "2.0", versionNumber: 2, status: "DRAFT" },
          { id: 5, version: "1.0", versionNumber: 1, status: "EFFECTIVE" },
        ],
      });

      await expect(
        DocumentService.createNewVersion(req, 1, { changeDescription: "Fix" })
      ).rejects.toThrow("Уже есть незавершённая версия");
    });

    test("Успешное создание новой версии", async () => {
      const mockDoc = {
        id: 1,
        code: "СТО-7.1",
        status: "EFFECTIVE",
        versions: [
          { id: 5, version: "1.0", versionNumber: 1, status: "EFFECTIVE" },
        ],
        update: jest.fn(),
      };
      mockDocumentFindByPk.mockResolvedValue(mockDoc);

      const newVersion = { id: 11, version: "2.0", versionNumber: 2, status: "DRAFT" };
      mockVersionCreate.mockResolvedValue(newVersion);

      const result = await DocumentService.createNewVersion(req, 1, {
        changeDescription: "Обновление процедуры",
      });

      expect(result).toEqual(newVersion);
      expect(mockVersionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          version: "2.0",
          versionNumber: 2,
          status: "DRAFT",
          changeDescription: "Обновление процедуры",
        }),
        expect.any(Object)
      );
      expect(mockDoc.update).toHaveBeenCalledWith(
        { status: "REVISION" },
        expect.any(Object)
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});
