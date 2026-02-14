const { TaskActivity } = require("../../../models/index");

class TaskActivityService {

  static async log(taskId, userId, action, options = {}) {
    try {
      await TaskActivity.create({
        taskId,
        userId,
        action,
        field: options.field || null,
        oldValue: options.oldValue != null ? String(options.oldValue) : null,
        newValue: options.newValue != null ? String(options.newValue) : null,
        metadata: options.metadata || null,
      });
    } catch (e) {
      console.error("[TaskActivityService] log error:", e.message);
    }
  }

  static async logTaskCreated(taskId, userId) {
    return this.log(taskId, userId, "TASK_CREATED");
  }

  static async logStatusChange(taskId, userId, oldStatus, newStatus) {
    return this.log(taskId, userId, "STATUS_CHANGED", {
      field: "status",
      oldValue: oldStatus,
      newValue: newStatus,
    });
  }

  static async logFieldUpdate(taskId, userId, field, oldValue, newValue) {
    return this.log(taskId, userId, "FIELD_UPDATED", {
      field,
      oldValue,
      newValue,
    });
  }

  static async logSubtaskAdded(taskId, userId, subtaskTitle) {
    return this.log(taskId, userId, "SUBTASK_ADDED", {
      metadata: { subtaskTitle },
    });
  }

  static async logSubtaskCompleted(taskId, userId, subtaskTitle) {
    return this.log(taskId, userId, "SUBTASK_COMPLETED", {
      metadata: { subtaskTitle },
    });
  }

  static async logChecklistItemCompleted(taskId, userId, itemTitle) {
    return this.log(taskId, userId, "CHECKLIST_ITEM_COMPLETED", {
      metadata: { itemTitle },
    });
  }

  static async logCommentAdded(taskId, userId) {
    return this.log(taskId, userId, "COMMENT_ADDED");
  }
}

module.exports = TaskActivityService;
