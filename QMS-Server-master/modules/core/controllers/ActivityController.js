const ApiError = require("../../../error/ApiError");
const {
  TaskActivity,
  User,
} = require("../../../models/index");

class ActivityController {

  async getActivity(req, res, next) {
    try {
      const { taskId } = req.params;
      const activity = await TaskActivity.findAll({
        where: { taskId },
        order: [["createdAt", "DESC"]],
        limit: 100,
        include: [
          { model: User, as: "user", attributes: ["id", "name", "surname"] },
        ],
      });
      return res.json(activity);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new ActivityController();
