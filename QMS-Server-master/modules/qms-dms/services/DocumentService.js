/**
 * DocumentService.js — Бизнес-логика системы управления документами
 * 
 * НОВЫЙ ФАЙЛ: services/DocumentService.js
 * 
 * Основные процессы:
 *   1. Создание документа → DRAFT
 *   2. Создание версии → загрузка файла
 *   3. Отправка на согласование → REVIEW
 *   4. Согласование (цепочка REVIEWER → APPROVER → QUALITY_OFFICER)
 *   5. Введение в действие → EFFECTIVE
 *   6. Пересмотр → новая версия → старая SUPERSEDED
 *   7. Отмена / устаревание → OBSOLETE
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;
const { Op } = require("sequelize");
const sequelize = require("../../../db");

const {
  Document,
  DocumentVersion,
  DocumentApproval,
  DocumentDistribution,
  DOCUMENT_STATUSES,
  VERSION_STATUSES,
  APPROVAL_DECISIONS,
  TYPE_CODE_PREFIX,
} = require("../models/Document");
const { User } = require("../../../models/index");
const { logDocumentCreate, logDocumentApproval, logDocumentEffective, logAudit, AUDIT_ACTIONS } = require("../../core/utils/auditLogger");

// Директория для хранения файлов документов
const DOCS_STORAGE = process.env.DOCS_STORAGE_PATH || path.join(__dirname, "..", "static", "documents");

const DOCUMENT_ATTRIBUTES = [
  "id",
  "code",
  "title",
  "type",
  "category",
  "description",
  "status",
  "currentVersionId",
  "ownerId",
  "reviewCycleMonths",
  "nextReviewDate",
  "effectiveDate",
  "obsoleteDate",
  "replacedById",
  "isoSection",
  "tags",
  "createdAt",
  "updatedAt",
];

class DocumentService {
  normalizeIsoSection(isoSection) {
    if (!isoSection) return null;
    const normalized = String(isoSection).trim();
    return normalized || null;
  }

  async generateDocumentCode(transaction, { type, isoSection }) {
    const prefix = TYPE_CODE_PREFIX[type] || "ДОК";
    const normalizedIsoSection = this.normalizeIsoSection(isoSection);

    if (normalizedIsoSection) {
      const baseCode = `${prefix}-${normalizedIsoSection}`;

      const existing = await Document.findAll({
        where: {
          [Op.or]: [
            { code: baseCode },
            { code: { [Op.like]: `${baseCode}-%` } },
          ],
        },
        attributes: ["code"],
        raw: true,
        transaction,
      });

      if (!existing.length) {
        return baseCode;
      }

      let maxDup = 1;
      for (const row of existing) {
        if (row.code === baseCode) continue;
        const suffix = String(row.code).slice(baseCode.length + 1);
        if (/^\d+$/.test(suffix)) {
          maxDup = Math.max(maxDup, Number(suffix));
        }
      }

      return `${baseCode}-${maxDup + 1}`;
    }

    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING(code FROM '(\\d+)$') AS INTEGER)) AS max_num
       FROM documents WHERE type = :type`,
      { replacements: { type }, transaction, type: sequelize.QueryTypes.SELECT }
    );

    const number = (maxResult?.max_num || 0) + 1;
    return `${prefix}-СМК-${String(number).padStart(3, "0")}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // СОЗДАНИЕ ДОКУМЕНТА
  // ═══════════════════════════════════════════════════════════════

  /**
   * Создаёт новый документ с первой версией (DRAFT).
   * Автоматически генерирует код: СТО-СМК-001
   */
  async createDocument(req, { title, type, category, description, isoSection, tags, reviewCycleMonths }) {
    const transaction = await sequelize.transaction({
      isolationLevel: "SERIALIZABLE",
    });

    try {
      const code = await this.generateDocumentCode(transaction, { type, isoSection });

      // Создаём документ
      const document = await Document.create(
        {
          code,
          title,
          type,
          category: category || null,
          description: description || null,
          status: DOCUMENT_STATUSES.DRAFT,
          ownerId: req.user.id,
          isoSection: isoSection || null,
          tags: tags || [],
          reviewCycleMonths: reviewCycleMonths || 12,
        },
        { transaction }
      );

      // Создаём первую версию
      const version = await DocumentVersion.create(
        {
          documentId: document.id,
          version: "1.0",
          versionNumber: 1,
          status: VERSION_STATUSES.DRAFT,
          changeDescription: "Первоначальная версия",
          createdById: req.user.id,
        },
        { transaction }
      );

      // Привязываем текущую версию
      await document.update({ currentVersionId: version.id }, { transaction });

      // Аудит внутри транзакции для атомарности (ISO 13485 §4.2.5)
      await logDocumentCreate(req, document, { transaction });

      await transaction.commit();

      return { document, version };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ЗАГРУЗКА ФАЙЛА ВЕРСИИ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Загружает файл для версии документа.
   * Вычисляет SHA-256 хеш файла для защиты от подмены.
   */
  async uploadVersionFile(req, versionId, file) {
    const version = await DocumentVersion.findByPk(versionId);
    if (!version) throw new Error("Версия не найдена");
    if (version.status !== VERSION_STATUSES.DRAFT) {
      throw new Error("Загрузка файла возможна только для черновика");
    }

    // Создаём директорию
    const docDir = path.join(DOCS_STORAGE, String(version.documentId));
    await fs.mkdir(docDir, { recursive: true });

    // Имя файла: versionId_originalName
    const ext = path.extname(file.name);
    const safeFileName = `v${version.versionNumber}_${Date.now()}${ext}`;
    const filePath = path.join(docDir, safeFileName);

    // Сохраняем
    await fs.writeFile(filePath, file.data);

    // Вычисляем хеш
    const fileHash = crypto
      .createHash("sha256")
      .update(file.data)
      .digest("hex");

    // Обновляем версию
    await version.update({
      fileUrl: `/documents/${version.documentId}/${safeFileName}`,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.mimetype,
      fileHash,
    });

    // Аудит
    await logAudit({
      req,
      action: AUDIT_ACTIONS.DOCUMENT_VERSION_CREATE,
      entity: "DocumentVersion",
      entityId: version.id,
      description: `Загружен файл для версии ${version.version}: ${file.name}`,
      metadata: { fileHash, fileSize: file.size },
    });

    return version;
  }

  // ═══════════════════════════════════════════════════════════════
  // ОТПРАВКА НА СОГЛАСОВАНИЕ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Отправляет версию на согласование.
   * Создаёт цепочку: шаг 1 (REVIEWER) → шаг 2 (APPROVER) → шаг 3 (QUALITY_OFFICER)
   * 
   * @param {Array} approvalChain - [{userId, role, dueDate}]
   */
  async submitForReview(req, versionId, approvalChain) {
    const transaction = await sequelize.transaction();

    try {
      const version = await DocumentVersion.findByPk(versionId, {
        include: [{ model: Document, as: "document" }],
        transaction,
      });

      if (!version) throw new Error("Версия не найдена");
      if (version.status !== VERSION_STATUSES.DRAFT) {
        throw new Error("Можно отправить на согласование только черновик");
      }

      // Валидация цепочки
      if (!approvalChain || approvalChain.length === 0) {
        throw new Error("Цепочка согласования не может быть пустой");
      }

      // Проверяем существование всех пользователей в цепочке
      const userIds = approvalChain.map((a) => a.userId);
      const existingUsers = await User.findAll({
        where: { id: userIds },
        attributes: ["id"],
        transaction,
      });
      const existingIds = new Set(existingUsers.map((u) => u.id));
      const missingIds = userIds.filter((id) => !existingIds.has(id));
      if (missingIds.length > 0) {
        throw new Error(`Пользователи не найдены: ${missingIds.join(", ")}`);
      }

      // Создаём шаги согласования
      for (let i = 0; i < approvalChain.length; i++) {
        const { userId, role, dueDate } = approvalChain[i];

        await DocumentApproval.create(
          {
            versionId: version.id,
            step: i + 1,
            role,
            assignedToId: userId,
            decision: APPROVAL_DECISIONS.PENDING,
            dueDate: dueDate || null,
          },
          { transaction }
        );
      }

      // Обновляем статусы
      await version.update({ status: VERSION_STATUSES.REVIEW }, { transaction });
      await version.document.update({ status: DOCUMENT_STATUSES.REVIEW }, { transaction });

      // Аудит внутри транзакции для атомарности
      await logAudit({
        req,
        action: AUDIT_ACTIONS.DOCUMENT_SUBMIT_REVIEW,
        entity: "DocumentVersion",
        entityId: version.id,
        description: `Документ ${version.document.code} v${version.version} отправлен на согласование`,
        metadata: {
          approvers: approvalChain.map((a) => a.userId),
          steps: approvalChain.length,
        },
        transaction,
      });

      await transaction.commit();

      return version;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ПРИНЯТИЕ РЕШЕНИЯ ПО СОГЛАСОВАНИЮ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Согласователь принимает решение по своему шагу.
   * Если все шаги APPROVED — версия переходит в APPROVED.
   * Если хоть один REJECTED — версия REJECTED.
   */
  async makeDecision(req, approvalId, { decision, comment }) {
    const transaction = await sequelize.transaction();

    try {
      const approval = await DocumentApproval.findByPk(approvalId, {
        include: [
          {
            model: DocumentVersion,
            as: "version",
            include: [{ model: Document, as: "document" }],
          },
        ],
        transaction,
      });

      if (!approval) throw new Error("Шаг согласования не найден");
      if (approval.assignedToId !== req.user.id) {
        throw new Error("Вы не являетесь назначенным согласователем");
      }
      if (approval.decision !== APPROVAL_DECISIONS.PENDING) {
        throw new Error("Решение уже принято");
      }

      // Проверяем что предыдущие шаги завершены
      if (approval.step > 1) {
        const prevSteps = await DocumentApproval.findAll({
          where: {
            versionId: approval.versionId,
            step: { [Op.lt]: approval.step },
          },
          transaction,
        });

        const allPrevApproved = prevSteps.every(
          (s) => s.decision === APPROVAL_DECISIONS.APPROVED
        );

        if (!allPrevApproved) {
          throw new Error("Предыдущие шаги согласования ещё не завершены");
        }
      }

      const decisionTimestamp = new Date();
      const version = approval.version;
      const doc = version.document;

      const signaturePayload = JSON.stringify({
        approvalId: approval.id,
        versionId: version.id,
        documentId: doc.id,
        decidedById: req.user.id,
        decision,
        decidedAt: decisionTimestamp.toISOString(),
        fileHash: version.fileHash || null,
      });
      const signatureHash = crypto.createHash("sha256").update(signaturePayload).digest("hex");

      // Записываем решение
      await approval.update(
        {
          decision,
          comment: comment || null,
          decidedAt: decisionTimestamp,
        },
        { transaction }
      );

      if (decision === APPROVAL_DECISIONS.REJECTED || decision === APPROVAL_DECISIONS.RETURNED) {
        // Отклонено — возвращаем в DRAFT
        await version.update({ status: VERSION_STATUSES.REJECTED }, { transaction });
        await doc.update({ status: DOCUMENT_STATUSES.DRAFT }, { transaction });
      } else if (decision === APPROVAL_DECISIONS.APPROVED) {
        // Проверяем все ли шаги пройдены
        const allApprovals = await DocumentApproval.findAll({
          where: { versionId: version.id },
          transaction,
        });

        const allApproved = allApprovals.every(
          (a) => a.decision === APPROVAL_DECISIONS.APPROVED
        );

        if (allApproved) {
          // Все согласовали — версия APPROVED
          await version.update(
            {
              status: VERSION_STATUSES.APPROVED,
              approvedById: req.user.id,
              approvedAt: new Date(),
            },
            { transaction }
          );
          await doc.update({ status: DOCUMENT_STATUSES.APPROVED }, { transaction });
        }
      }

      // Аудит внутри транзакции для атомарности
      await logDocumentApproval(req, doc, version, decision, {
        comment,
        signatureType: "SIMPLE_AUDIT_HASH",
        signatureHash,
        signedAt: decisionTimestamp.toISOString(),
        transaction,
      });

      await transaction.commit();

      return approval;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ВВЕДЕНИЕ В ДЕЙСТВИЕ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Вводит утверждённую версию в действие.
   * Предыдущая действующая версия переходит в SUPERSEDED.
   */
  async makeEffective(req, versionId) {
    const transaction = await sequelize.transaction();

    try {
      const version = await DocumentVersion.findByPk(versionId, {
        include: [{ model: Document, as: "document" }],
        transaction,
      });

      if (!version) throw new Error("Версия не найдена");
      if (version.status !== VERSION_STATUSES.APPROVED) {
        throw new Error("Только утверждённую версию можно ввести в действие");
      }

      const doc = version.document;

      // Деактивируем предыдущую действующую версию
      if (doc.currentVersionId && doc.currentVersionId !== version.id) {
        const oldVersion = await DocumentVersion.findByPk(doc.currentVersionId, { transaction });
        if (oldVersion && oldVersion.status === VERSION_STATUSES.EFFECTIVE) {
          await oldVersion.update(
            {
              status: VERSION_STATUSES.SUPERSEDED,
              supersededAt: new Date(),
            },
            { transaction }
          );
        }
      }

      // Активируем новую версию
      const now = new Date();
      await version.update(
        { status: VERSION_STATUSES.EFFECTIVE, effectiveAt: now },
        { transaction }
      );

      // Обновляем документ
      const nextReview = new Date(now);
      nextReview.setMonth(nextReview.getMonth() + (doc.reviewCycleMonths || 12));

      await doc.update(
        {
          status: DOCUMENT_STATUSES.EFFECTIVE,
          currentVersionId: version.id,
          effectiveDate: now,
          nextReviewDate: nextReview,
        },
        { transaction }
      );

      // Аудит внутри транзакции (CRITICAL severity)
      await logDocumentEffective(req, doc, version, { transaction });

      await transaction.commit();

      return version;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // СОЗДАНИЕ НОВОЙ ВЕРСИИ (ПЕРЕСМОТР)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Создаёт новую версию документа для пересмотра.
   * Текущая действующая версия продолжает работать до замены.
   */
  async createNewVersion(req, documentId, { changeDescription }) {
    const transaction = await sequelize.transaction();

    try {
      const doc = await Document.findByPk(documentId, {
        include: [{ model: DocumentVersion, as: "versions" }],
        transaction,
      });

      if (!doc) throw new Error("Документ не найден");

      // Проверяем что нет открытого черновика
      const existingDraft = doc.versions.find(
        (v) => v.status === VERSION_STATUSES.DRAFT || v.status === VERSION_STATUSES.REVIEW
      );
      if (existingDraft) {
        throw new Error(`Уже есть незавершённая версия: ${existingDraft.version} (${existingDraft.status})`);
      }

      const maxVersionNum = Math.max(...doc.versions.map((v) => v.versionNumber), 0);
      const newVersionNum = maxVersionNum + 1;

      const version = await DocumentVersion.create(
        {
          documentId: doc.id,
          version: `${newVersionNum}.0`,
          versionNumber: newVersionNum,
          status: VERSION_STATUSES.DRAFT,
          changeDescription: changeDescription || null,
          createdById: req.user.id,
        },
        { transaction }
      );

      // Ставим документ на пересмотр (действующая версия остаётся)
      if (doc.status === DOCUMENT_STATUSES.EFFECTIVE) {
        await doc.update({ status: DOCUMENT_STATUSES.REVISION }, { transaction });
      }

      // Аудит внутри транзакции для атомарности
      await logAudit({
        req,
        action: AUDIT_ACTIONS.DOCUMENT_VERSION_CREATE,
        entity: "DocumentVersion",
        entityId: version.id,
        description: `Создана новая версия ${doc.code} v${version.version}`,
        metadata: { documentId: doc.id, changeDescription },
        transaction,
      });

      await transaction.commit();

      return version;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // РАССЫЛКА И ОЗНАКОМЛЕНИЕ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Рассылает документ списку сотрудников для ознакомления.
   */
  async distribute(req, versionId, userIds) {
    const transaction = await sequelize.transaction();
    try {
      const version = await DocumentVersion.findByPk(versionId, {
        include: [{ model: Document, as: "document" }],
        transaction,
      });

      if (!version) throw new Error("Версия не найдена");
      if (version.status !== VERSION_STATUSES.EFFECTIVE) {
        throw new Error("Рассылка возможна только для действующей версии");
      }

      const distributions = [];
      for (const userId of userIds) {
        const [dist] = await DocumentDistribution.findOrCreate({
          where: { versionId, userId },
          defaults: { distributedAt: new Date() },
          transaction,
        });
        distributions.push(dist);
      }

      // Аудит внутри транзакции для атомарности
      await logAudit({
        req,
        action: AUDIT_ACTIONS.DOCUMENT_DISTRIBUTE,
        entity: "Document",
        entityId: version.document.id,
        description: `Документ ${version.document.code} разослан ${userIds.length} сотрудникам`,
        metadata: { userIds, versionId },
        transaction,
      });

      await transaction.commit();
      return distributions;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Сотрудник подтверждает ознакомление.
   */
  async acknowledge(req, distributionId) {
    const dist = await DocumentDistribution.findByPk(distributionId);
    if (!dist) throw new Error("Запись рассылки не найдена");
    if (dist.userId !== req.user.id) throw new Error("Нельзя подтвердить за другого");
    if (dist.acknowledged) throw new Error("Уже подтверждено");

    await dist.update({
      acknowledged: true,
      acknowledgedAt: new Date(),
    });

    // Аудит
    await logAudit({
      req,
      action: AUDIT_ACTIONS.DOCUMENT_ACKNOWLEDGE,
      entity: "DocumentDistribution",
      entityId: dist.id,
      description: `Подтверждено ознакомление с документом`,
      metadata: { versionId: dist.versionId },
    });

    return dist;
  }

  // ═══════════════════════════════════════════════════════════════
  // ЧТЕНИЕ / ПОИСК
  // ═══════════════════════════════════════════════════════════════

  /**
   * Реестр документов с фильтрами.
   */
  async getDocuments({ page = 1, limit = 20, status, type, category, search, ownerId }) {
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.category = category;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      const searchText = String(search).trim();
      if (searchText) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${searchText}%` } },
          { code: { [Op.iLike]: `%${searchText}%` } },
          { description: { [Op.iLike]: `%${searchText}%` } },
          sequelize.where(sequelize.col("currentVersion.content"), { [Op.iLike]: `%${searchText}%` }),
          sequelize.where(sequelize.col("currentVersion.fileName"), { [Op.iLike]: `%${searchText}%` }),
        ];
      }
    }

    return Document.findAndCountAll({
      where,
      attributes: DOCUMENT_ATTRIBUTES,
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "surname"] },
        {
          model: DocumentVersion,
          as: "currentVersion",
          attributes: ["id", "version", "status", "effectiveAt"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: Math.min(limit, 100),
      offset: (page - 1) * limit,
    });
  }

  /**
   * Детальная карточка документа со всеми версиями.
   */
  async getDocumentDetail(documentId) {
    return Document.findByPk(documentId, {
      attributes: DOCUMENT_ATTRIBUTES,
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "surname"] },
        {
          model: DocumentVersion,
          as: "versions",
          order: [["versionNumber", "DESC"]],
          include: [
            { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
            { model: User, as: "approvedBy", attributes: ["id", "name", "surname"] },
            {
              model: DocumentApproval,
              as: "approvals",
              order: [["step", "ASC"]],
              include: [
                { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
              ],
            },
            {
              model: DocumentDistribution,
              as: "distributions",
              include: [
                { model: User, as: "user", attributes: ["id", "name", "surname"] },
              ],
            },
          ],
        },
      ],
    });
  }

  /**
   * Рабочий стол согласования — документы ожидающие решения пользователя.
   */
  async getPendingApprovals(userId) {
    return DocumentApproval.findAll({
      where: {
        assignedToId: userId,
        decision: APPROVAL_DECISIONS.PENDING,
      },
      include: [
        {
          model: DocumentVersion,
          as: "version",
          include: [
            {
              model: Document,
              as: "document",
              attributes: ["id", "code", "title", "type"],
            },
            { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
          ],
        },
      ],
      order: [["dueDate", "ASC NULLS LAST"], ["createdAt", "ASC"]],
    });
  }

  /**
   * Документы с просроченным пересмотром.
   */
  async getOverdueReviews() {
    return Document.findAll({
      attributes: DOCUMENT_ATTRIBUTES,
      where: {
        status: DOCUMENT_STATUSES.EFFECTIVE,
        nextReviewDate: { [Op.lt]: new Date() },
      },
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "surname"] },
      ],
      order: [["nextReviewDate", "ASC"]],
    });
  }

  /**
   * DMS статистика для дашборда.
   */
  async getStats() {
    const [byStatus, byType, overdueCount, pendingApprovalsCount] = await Promise.all([
      Document.findAll({
        attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["status"],
        raw: true,
      }),
      Document.findAll({
        attributes: ["type", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["type"],
        raw: true,
      }),
      Document.count({
        where: {
          status: DOCUMENT_STATUSES.EFFECTIVE,
          nextReviewDate: { [Op.lt]: new Date() },
        },
      }),
      DocumentApproval.count({
        where: { decision: APPROVAL_DECISIONS.PENDING },
      }),
    ]);

    return { byStatus, byType, overdueCount, pendingApprovalsCount };
  }
}

module.exports = new DocumentService();
