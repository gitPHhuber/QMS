const { PC } = require("../models/index");
const ApiError = require("../error/ApiError");

class PCController {

  async getPCs(req, res, next) {
    try {

      const pcAll = await PC.findAll();


      if (!pcAll) {
        return res.json([]);
      }


      pcAll.sort((a, b) => {
        const nameA = (a.pc_name || "").toString();
        const nameB = (b.pc_name || "").toString();


        const numA = parseInt(nameA.replace(/\D/g, ""), 10);
        const numB = parseInt(nameB.replace(/\D/g, ""), 10);

        const hasNumA = !isNaN(numA);
        const hasNumB = !isNaN(numB);


        if (hasNumA && hasNumB) {
          if (numA !== numB) return numA - numB;
        }


        if (hasNumA && !hasNumB) return -1;
        if (!hasNumA && hasNumB) return 1;


        return nameA.localeCompare(nameB);
      });

      return res.json(pcAll);
    } catch (e) {
      console.error("🔥 Ошибка при получении списка ПК:", e);
      next(ApiError.internal("Ошибка сервера при загрузке ПК: " + e.message));
    }
  }

  async postPC(req, res, next) {
    try {
      const { ip, pc_name, cabinet } = req.body;
      const pc = await PC.create({ ip, pc_name, cabinet });
      return res.json(pc);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async updatePC(req, res, next) {
    try {
      const { id, ip, pc_name, cabinet } = req.body;
      await PC.update({ ip, pc_name, cabinet }, { where: { id } });
      const pc = await PC.findAll({ where: { id } });
      return res.json(pc[0]);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async deletePC(req, res, next) {
    try {
      const id = req.params.id;
      await PC.destroy({
        where: { id },
      });
      return res.json("ok");
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new PCController();
