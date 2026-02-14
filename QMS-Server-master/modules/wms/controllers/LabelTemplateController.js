const ApiError = require("../../../error/ApiError");

class LabelTemplateController {
  async getTemplates(req, res, next) {
    try {
      const { LabelTemplate } = require("../../../models/index");

      const templates = await LabelTemplate.findAll({
        order: [["name", "ASC"]],
      });

      return res.json(templates);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createTemplate(req, res, next) {
    try {
      const { LabelTemplate } = require("../../../models/index");
      const { name, type, width, height, elements } = req.body;

      if (!name) {
        return next(ApiError.badRequest("Не указано имя шаблона"));
      }

      const template = await LabelTemplate.create({
        name,
        type: type || null,
        width: width || 105,
        height: height || 60,
        elements: elements || [],
      });

      return res.json(template);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async deleteTemplate(req, res, next) {
    try {
      const { LabelTemplate } = require("../../../models/index");
      const { id } = req.params;

      const template = await LabelTemplate.findByPk(id);
      if (!template) {
        return next(ApiError.notFound("Шаблон этикетки не найден"));
      }

      await template.destroy();
      return res.json({ message: "Шаблон удалён" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new LabelTemplateController();
