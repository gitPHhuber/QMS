

const ApprovalService = require("./services/ApprovalService");
const { CHECKLIST_STAGES, APPROVAL_STATUSES } = require("../../models/BeryllServerApproval");

class ApprovalController {


  async submitForVerification(req, res) {
    try {
      const { serverId, stageCode } = req.body;
      const userId = req.user.id;

      if (!serverId) {
        return res.status(400).json({ message: "Укажите ID сервера" });
      }

      const approval = await ApprovalService.submitForVerification(
        serverId,
        userId,
        stageCode || CHECKLIST_STAGES.ASSEMBLY
      );

      res.status(201).json(approval);
    } catch (error) {
      console.error("Ошибка отправки на верификацию:", error);
      res.status(400).json({ message: error.message });
    }
  }


  async approveServer(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const reviewerId = req.user.id;

      const approval = await ApprovalService.approveServer(
        parseInt(id),
        reviewerId,
        comment
      );

      res.json(approval);
    } catch (error) {
      console.error("Ошибка одобрения:", error);
      res.status(400).json({ message: error.message });
    }
  }


  async rejectServer(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const reviewerId = req.user.id;

      const approval = await ApprovalService.rejectServer(
        parseInt(id),
        reviewerId,
        comment
      );

      res.json(approval);
    } catch (error) {
      console.error("Ошибка отклонения:", error);
      res.status(400).json({ message: error.message });
    }
  }


  async getVerificationQueue(req, res) {
    try {
      const { stageCode, page, limit, sortBy, sortOrder } = req.query;

      const result = await ApprovalService.getVerificationQueue({
        stageCode,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || "submittedAt",
        sortOrder: sortOrder || "ASC"
      });

      res.json(result);
    } catch (error) {
      console.error("Ошибка получения очереди:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async getApprovalById(req, res) {
    try {
      const { id } = req.params;
      const approval = await ApprovalService.getApprovalById(parseInt(id));

      if (!approval) {
        return res.status(404).json({ message: "Запись не найдена" });
      }

      res.json(approval);
    } catch (error) {
      console.error("Ошибка получения апрува:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async getVerificationDetails(req, res) {
    try {
      const { id } = req.params;
      const details = await ApprovalService.getVerificationDetails(parseInt(id));

      res.json(details);
    } catch (error) {
      console.error("Ошибка получения деталей:", error);
      res.status(400).json({ message: error.message });
    }
  }


  async getServerVerificationStatus(req, res) {
    try {
      const { serverId } = req.params;
      const status = await ApprovalService.getServerVerificationStatus(parseInt(serverId));

      res.json(status);
    } catch (error) {
      console.error("Ошибка получения статуса:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async getServerApprovalHistory(req, res) {
    try {
      const { serverId } = req.params;
      const history = await ApprovalService.getServerApprovalHistory(parseInt(serverId));

      res.json(history);
    } catch (error) {
      console.error("Ошибка получения истории:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async checkStageCompletion(req, res) {
    try {
      const { serverId, stageCode } = req.params;
      const result = await ApprovalService.checkStageCompletion(
        parseInt(serverId),
        stageCode
      );

      res.json(result);
    } catch (error) {
      console.error("Ошибка проверки завершённости:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async getVerificationStats(req, res) {
    try {
      const stats = await ApprovalService.getVerificationStats();
      res.json(stats);
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async getConstants(req, res) {
    res.json({
      stages: CHECKLIST_STAGES,
      statuses: APPROVAL_STATUSES,
      stageLabels: {
        [CHECKLIST_STAGES.ASSEMBLY]: 'Сборка',
        [CHECKLIST_STAGES.VERIFICATION]: 'Верификация ОТК'
      },
      statusLabels: {
        [APPROVAL_STATUSES.PENDING]: 'Ожидает проверки',
        [APPROVAL_STATUSES.APPROVED]: 'Одобрено',
        [APPROVAL_STATUSES.REJECTED]: 'Отклонено'
      }
    });
  }
}

module.exports = new ApprovalController();
