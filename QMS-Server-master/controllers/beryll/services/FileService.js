const { BeryllServer, BeryllServerChecklist, User } = require("../../../models/index");
const path = require("path");
const fs = require("fs");
const { UPLOAD_DIR } = require("../config/beryll.config");
const HistoryService = require("./HistoryService");

class FileService {


  async uploadChecklistFile(serverId, checklistId, file, userId) {
    const server = await BeryllServer.findByPk(serverId);
    if (!server) {
      throw new Error("Сервер не найден");
    }

    const checklist = await BeryllServerChecklist.findOne({
      where: { id: checklistId, serverId },
      include: [{ model: BeryllChecklistTemplate, as: "template" }]
    });

    if (!checklist) {
      throw new Error("Пункт чек-листа не найден");
    }

    const ext = path.extname(file.name);
    const fileCode = checklist.template?.fileCode || `item_${checklistId}`;
    const serial = server.apkSerialNumber || server.serialNumber || `srv_${serverId}`;


    const fileName = `${serial}_${fileCode}${ext}`;


    const serverDir = path.join(UPLOAD_DIR, serial);
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    const filePath = path.join(serverDir, fileName);


    await file.mv(filePath);


    const fileRecord = await BeryllChecklistFile.create({
      serverChecklistId: checklist.id,
      originalName: file.name,
      fileName,
      filePath: path.relative(UPLOAD_DIR, filePath),
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedById: userId
    });


    await HistoryService.logHistory(serverId, userId, HISTORY_ACTIONS.FILE_UPLOADED, {
      checklistItemId: checklist.id,
      comment: `Загружен файл ${fileName}`,
      metadata: { fileName, fileCode, originalName: file.name }
    });

    return {
      success: true,
      file: {
        id: fileRecord.id,
        fileName,
        originalName: file.name,
        fileSize: file.size
      }
    };
  }


  async getServerFiles(serverId) {
    const files = await BeryllChecklistFile.findAll({
      include: [{
        model: BeryllServerChecklist,
        as: "checklist",
        where: { serverId },
        include: [{ model: BeryllChecklistTemplate, as: "template" }]
      }, {
        model: User,
        as: "uploadedBy",
        attributes: ["id", "login", "name", "surname"]
      }],
      order: [["createdAt", "ASC"]]
    });

    return files;
  }


  async getFileForDownload(fileId) {
    const file = await BeryllChecklistFile.findByPk(fileId);
    if (!file) {
      throw new Error("Файл не найден");
    }

    const fullPath = path.join(UPLOAD_DIR, file.filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error("Файл не найден на диске");
    }

    return {
      fullPath,
      originalName: file.originalName
    };
  }
}

module.exports = new FileService();
