/**
 * documentController.js — REST API контроллер DMS
 *
 * Endpoints (через routes/documentRouter.js):
 *   GET    /api/documents/            — Реестр документов
 *   GET    /api/documents/stats       — Статистика DMS
 *   GET    /api/documents/pending     — Мои ожидающие согласования
 *   GET    /api/documents/overdue     — Просроченные пересмотры
 *   GET    /api/documents/:id         — Детали документа
 *   POST   /api/documents/            — Создать документ
 *   POST   /api/documents/:id/versions           — Новая версия
 *   POST   /api/documents/versions/:id/upload     — Загрузить файл
 *   POST   /api/documents/versions/:id/submit     — Отправить на согласование
 *   POST   /api/documents/versions/:id/effective  — Ввести в действие
 *   POST   /api/documents/approvals/:id/decide    — Принять решение
 *   POST   /api/documents/versions/:id/distribute — Разослать
 *   POST   /api/documents/distributions/:id/ack   — Подтвердить ознакомление
 */

const ApiError = require("../../../error/ApiError");
const DocumentService = require("../services/DocumentService");

// Хелпер: бизнес-ошибки (throw new Error) → 400, остальные → 500
const handleError = (e, next) => {
  if (e instanceof ApiError) return next(e);
  // Бизнес-ошибки из сервиса содержат понятное сообщение
  if (e.message && !e.message.includes("Cannot") && !e.message.includes("SQLITE") && !e.message.includes("ECONNREFUSED")) {
    return next(ApiError.badRequest(e.message));
  }
  console.error("DocumentController error:", e);
  return next(ApiError.internal("Внутренняя ошибка сервера"));
};

class DocumentController {
  // ── Реестр ──

  async getAll(req, res, next) {
    try {
      const { page, limit, status, type, category, search, ownerId } = req.query;
      const result = await DocumentService.getDocuments({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        status,
        type,
        category,
        search,
        ownerId: ownerId ? Number(ownerId) : undefined,
      });
      return res.json(result);
    } catch (e) {
      handleError(e, next);
    }
  }

  async getOne(req, res, next) {
    try {
      const doc = await DocumentService.getDocumentDetail(Number(req.params.id));
      if (!doc) return next(ApiError.notFound("Документ не найден"));
      return res.json(doc);
    } catch (e) {
      handleError(e, next);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await DocumentService.getStats();
      return res.json(stats);
    } catch (e) {
      handleError(e, next);
    }
  }

  async getPending(req, res, next) {
    try {
      const approvals = await DocumentService.getPendingApprovals(req.user.id);
      return res.json(approvals);
    } catch (e) {
      handleError(e, next);
    }
  }

  async getOverdue(req, res, next) {
    try {
      const docs = await DocumentService.getOverdueReviews();
      return res.json(docs);
    } catch (e) {
      handleError(e, next);
    }
  }

  // ── Создание ──

  async create(req, res, next) {
    try {
      const { title, type, category, description, isoSection, tags, reviewCycleMonths } = req.body;

      if (!title || !type) {
        return next(ApiError.badRequest("Обязательные поля: title, type"));
      }

      const result = await DocumentService.createDocument(req, {
        title, type, category, description, isoSection, tags, reviewCycleMonths,
      });

      return res.status(201).json(result);
    } catch (e) {
      handleError(e, next);
    }
  }

  // ── Версии ──

  async createVersion(req, res, next) {
    try {
      const { changeDescription } = req.body;
      const version = await DocumentService.createNewVersion(
        req,
        Number(req.params.id),
        { changeDescription }
      );
      return res.status(201).json(version);
    } catch (e) {
      handleError(e, next);
    }
  }

  async uploadFile(req, res, next) {
    try {
      if (!req.files || !req.files.file) {
        return next(ApiError.badRequest("Файл не загружен"));
      }

      const version = await DocumentService.uploadVersionFile(
        req,
        Number(req.params.id),
        req.files.file
      );

      return res.json(version);
    } catch (e) {
      handleError(e, next);
    }
  }

  // ── Согласование ──

  async submitForReview(req, res, next) {
    try {
      const { approvalChain } = req.body;
      if (!approvalChain || !Array.isArray(approvalChain)) {
        return next(ApiError.badRequest("approvalChain обязателен (массив)"));
      }

      const version = await DocumentService.submitForReview(
        req,
        Number(req.params.id),
        approvalChain
      );

      return res.json(version);
    } catch (e) {
      handleError(e, next);
    }
  }

  async decide(req, res, next) {
    try {
      const { decision, comment } = req.body;
      if (!decision) {
        return next(ApiError.badRequest("decision обязателен: APPROVED, REJECTED, RETURNED"));
      }

      const approval = await DocumentService.makeDecision(
        req,
        Number(req.params.id),
        { decision, comment }
      );

      return res.json(approval);
    } catch (e) {
      handleError(e, next);
    }
  }

  async makeEffective(req, res, next) {
    try {
      const version = await DocumentService.makeEffective(req, Number(req.params.id));
      return res.json(version);
    } catch (e) {
      handleError(e, next);
    }
  }

  // ── Рассылка ──

  async distribute(req, res, next) {
    try {
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds)) {
        return next(ApiError.badRequest("userIds обязателен (массив)"));
      }

      const distributions = await DocumentService.distribute(
        req,
        Number(req.params.id),
        userIds
      );

      return res.json(distributions);
    } catch (e) {
      handleError(e, next);
    }
  }

  async acknowledge(req, res, next) {
    try {
      const dist = await DocumentService.acknowledge(req, Number(req.params.id));
      return res.json(dist);
    } catch (e) {
      handleError(e, next);
    }
  }
}

module.exports = new DocumentController();
