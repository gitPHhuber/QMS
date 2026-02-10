const { BeryllServer, BeryllBatch, BeryllHistory, BeryllServerChecklist, User } = require("../../../models/index");
const { SERVER_STATUSES, HISTORY_ACTIONS, BeryllChecklistTemplate, BeryllChecklistFile } = require("../../../models/definitions/Beryll");
const { Op } = require("sequelize");
const { calculateDuration } = require("../utils/helpers");
const HistoryService = require("./HistoryService");
const ChecklistService = require("./ChecklistService");

class ServerService {


  async getServers(filters = {}) {
    const { status, search, onlyActive, batchId, assignedToId } = filters;

    const where = {};

    if (status && Object.values(SERVER_STATUSES).includes(status)) {
      where.status = status;
    }

    if (onlyActive === "true") {
      where.leaseActive = true;
    }

    if (batchId) {
      where.batchId = batchId === "null" ? null : parseInt(batchId);
    }


    if (assignedToId) {
      where.assignedToId = parseInt(assignedToId);
    }

    if (search) {
      where[Op.or] = [
        { ipAddress: { [Op.iLike]: `%${search}%` } },
        { hostname: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
        { macAddress: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const servers = await BeryllServer.findAll({
      where,
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "login", "name", "surname"] },
        { model: BeryllBatch, as: "batch", attributes: ["id", "title", "status"] }
      ],
      order: [["updatedAt", "DESC"]]
    });

    return servers;
  }


  async getServerById(id) {
    const server = await BeryllServer.findByPk(id, {
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "login", "name", "surname"] },
        { model: BeryllBatch, as: "batch" },
        {
          model: BeryllServerChecklist,
          as: "checklists",
          include: [
            { model: BeryllChecklistTemplate, as: "template" },
            { model: User, as: "completedBy", attributes: ["id", "login", "name", "surname"] },
            {
              model: BeryllChecklistFile,
              as: "files",
              include: [
                { model: User, as: "uploadedBy", attributes: ["id", "login", "name", "surname"] }
              ]
            }
          ]
        },
        {
          model: BeryllHistory,
          as: "history",
          include: [{ model: User, as: "user", attributes: ["id", "login", "name", "surname"] }],
          order: [["createdAt", "DESC"]],
          limit: 50
        }
      ]
    });

    return server;
  }


  async takeServer(id, userId, userRole) {
    const server = await BeryllServer.findByPk(id);

    if (!server) {
      throw new Error("Сервер не найден");
    }


    const allowedStatuses = [
      SERVER_STATUSES.NEW,
      SERVER_STATUSES.CLARIFYING,
      SERVER_STATUSES.DEFECT
    ];


    if (server.assignedToId && server.status === SERVER_STATUSES.IN_WORK) {

      if (server.assignedToId !== userId && userRole !== "SUPER_ADMIN") {
        throw new Error("Сервер уже взят в работу другим пользователем");
      }
    }


    if (server.assignedToId && server.assignedToId !== userId) {
      if (userRole !== "SUPER_ADMIN") {
        throw new Error("Сервер назначен другому исполнителю");
      }
    }


    if (!allowedStatuses.includes(server.status) && server.status !== SERVER_STATUSES.IN_WORK) {
      throw new Error(`Нельзя взять сервер из статуса "${server.status}"`);
    }

    const previousStatus = server.status;
    const previousAssignee = server.assignedToId;


    const isReturning = server.assignedToId === userId &&
      (server.status === SERVER_STATUSES.CLARIFYING || server.status === SERVER_STATUSES.DEFECT);
    const isTakingFromOther = server.assignedToId && server.assignedToId !== userId;

    await server.update({
      status: SERVER_STATUSES.IN_WORK,
      assignedToId: userId,

      assignedAt: isReturning ? server.assignedAt : new Date()
    });


    await ChecklistService.initializeServerChecklist(server.id);


    let comment = null;
    if (isReturning) {
      comment = `Возвращён в работу из статуса "${previousStatus}"`;
    } else if (isTakingFromOther) {
      comment = `Сервер переназначен администратором с пользователя ID:${previousAssignee}`;
    }


    await HistoryService.logHistory(server.id, userId, HISTORY_ACTIONS.TAKEN, {
      fromStatus: previousStatus,
      toStatus: SERVER_STATUSES.IN_WORK,
      comment
    });

    const updated = await BeryllServer.findByPk(id, {
      include: [{ model: User, as: "assignedTo", attributes: ["id", "login", "name", "surname"] }]
    });

    return updated;
  }


  async releaseServer(id, userId, userRole) {
    const server = await BeryllServer.findByPk(id);

    if (!server) {
      throw new Error("Сервер не найден");
    }


    if (server.assignedToId !== userId && userRole !== "SUPER_ADMIN") {
      throw new Error("Нет прав для освобождения этого сервера");
    }

    const duration = calculateDuration(server.assignedAt);
    const previousStatus = server.status;
    const previousAssignee = server.assignedToId;

    await server.update({
      status: SERVER_STATUSES.NEW,
      assignedToId: null,
      assignedAt: null
    });


    const comment = (userRole === "SUPER_ADMIN" && previousAssignee !== userId)
      ? "Сервер снят с исполнителя администратором"
      : undefined;

    await HistoryService.logHistory(server.id, userId, HISTORY_ACTIONS.RELEASED, {
      fromStatus: previousStatus,
      toStatus: SERVER_STATUSES.NEW,
      durationMinutes: duration,
      comment
    });

    return server;
  }


  async updateStatus(id, status, notes, userId) {
    const server = await BeryllServer.findByPk(id);

    if (!server) {
      throw new Error("Сервер не найден");
    }

    const previousStatus = server.status;
    const updateData = { status };

    if (status === SERVER_STATUSES.DONE) {
      updateData.completedAt = new Date();
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await server.update(updateData);

    const duration = status === SERVER_STATUSES.DONE
      ? calculateDuration(server.assignedAt)
      : null;

    await HistoryService.logHistory(server.id, userId, HISTORY_ACTIONS.STATUS_CHANGED, {
      fromStatus: previousStatus,
      toStatus: status,
      comment: notes,
      durationMinutes: duration
    });

    const updated = await BeryllServer.findByPk(id, {
      include: [{ model: User, as: "assignedTo", attributes: ["id", "login", "name", "surname"] }]
    });

    return updated;
  }


  async updateNotes(id, notes, userId) {
    const server = await BeryllServer.findByPk(id);

    if (!server) {
      throw new Error("Сервер не найден");
    }

    await server.update({ notes });

    await HistoryService.logHistory(server.id, userId, HISTORY_ACTIONS.NOTE_ADDED, {
      comment: notes
    });

    return server;
  }


  async deleteServer(id, userId) {
    const server = await BeryllServer.findByPk(id);

    if (!server) {
      throw new Error("Сервер не найден");
    }


    const serverIp = server.ipAddress;
    const serverHostname = server.hostname;


    await BeryllServerChecklist.destroy({ where: { serverId: id } });


    await BeryllHistory.update(
      { serverId: null },
      { where: { serverId: id } }
    );

    await server.destroy();


    await HistoryService.logHistory(null, userId, HISTORY_ACTIONS.DELETED, {
      serverIp,
      serverHostname,
      comment: `Удалён сервер ${serverIp}`
    });

    return { success: true };
  }
}

module.exports = new ServerService();
