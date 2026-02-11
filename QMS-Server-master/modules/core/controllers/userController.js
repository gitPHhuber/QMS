const ApiError = require("../../../error/ApiError");
const { User, Session, Role } = require("../../../models/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const path = require("path");

const SALT_ROUNDS = 10;

const generateJWT = (id, login, role, name, surname, img) => {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error("SECRET_KEY is not defined in environment variables");
  }
  return jwt.sign(
    { id, login, role, name, surname, img },
    secret,
    {
      expiresIn: "5h",
    }
  );
};


const checkAccess = (req, targetUserId) => {

  const isSelf = req.user.id === Number(targetUserId);


  const hasManageRights = req.user.abilities && req.user.abilities.includes('users.manage');


  const isSuperAdmin = req.user.role === 'SUPER_ADMIN';


  if (!isSelf && !hasManageRights && !isSuperAdmin) {
      throw ApiError.forbidden("Нет доступа к чужому профилю");
  }
};

class UserController {

  async getUsers(req, res, next) {
    try {
      const usersAll = await User.findAll({
        attributes: { exclude: ["password"] },
        order: [["name", "ASC"]],
      });
      return res.json(usersAll);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }


  async getCurrentUser(req, res, next) {
    try {
      const id = req.params.id;


      checkAccess(req, id);

      const user = await User.findOne({
        where: { id },
        attributes: { exclude: ["password"] },
      });
      return res.json(user);
    } catch (e) {

      if (e instanceof ApiError) return next(e);
      next(ApiError.badRequest(e.message));
    }
  }


  async updateUser(req, res, next) {
    try {
      const { id, password, name, surname } = req.body;


      checkAccess(req, id);


      const updateData = { name, surname };


      if (password && password.trim() !== "") {
        updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
      }

      await User.update(updateData, { where: { id } });
      const user = await User.findAll({ where: { id } });
      return res.json(user[0]);
    } catch (e) {
      if (e instanceof ApiError) return next(e);
      next(ApiError.badRequest(e.message));
    }
  }


  async updateUserImg(req, res, next) {
    try {
      const { id } = req.body;


      checkAccess(req, id);

      const { img } = req.files;
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(img.mimetype)) {
        return next(ApiError.badRequest("Допустимые форматы: JPEG, PNG, WebP, GIF"));
      }
      const ext = path.extname(img.name) || ".jpg";
      let fileName = uuid.v4() + ext;
      img.mv(path.resolve(__dirname, "..", "static", fileName));

      await User.update({ img: fileName }, { where: { id } });

      const user = await User.findAll({ where: { id } });
      return res.json(user[0]);
    } catch (e) {
      if (e instanceof ApiError) return next(e);
      next(ApiError.badRequest(e.message));
    }
  }

  async registration(req, res, next) {
    try {
      const { login, password, role, name, surname } = req.body;

      if (!login || !password) {
        return next(ApiError.badRequest("нет логина или пароля в запросе"));
      }
      const candidate = await User.findOne({ where: { login } });
      if (candidate) {
        return next(
          ApiError.badRequest("Такой пользователь с таким логином уже есть")
        );
      }

      let roleId = null;
      const roleName = role || 'USER';
      if (roleName) {
        const roleEntity = await Role.findOne({ where: { name: roleName } });
        if (roleEntity) roleId = roleEntity.id;
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ login, password: hashedPassword, roleId, name, surname });
      const token = generateJWT(
        user.id,
        user.login,
        roleName,
        user.name,
        user.surname,
        null
      );
      return res.json({ token });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async login(req, res, next) {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        return next(ApiError.badRequest("нет логина или пароля в запросе"));
      }
      const currentUser = await User.findOne({
        where: { login },
        include: [{ model: Role, as: "userRole", attributes: ["name"] }]
      });
      if (!currentUser) {
        return next(ApiError.internal("Такого пользователя нет"));
      }

      const isPasswordValid = await bcrypt.compare(password, currentUser.password);
      if (!isPasswordValid) {
        return next(ApiError.badRequest("неверный пароль"));
      }

      const isAciveSession = await Session.findAll({
        where: { userId: currentUser.id, online: true },
      });

      if (isAciveSession.length >= 1) {
        await Session.update(
          { online: false },
          { where: { userId: currentUser.id, online: true } }
        );
      }

      const roleName = currentUser.userRole ? currentUser.userRole.name : 'USER';
      const token = generateJWT(
        currentUser.id,
        currentUser.login,
        roleName,
        currentUser.name,
        currentUser.surname,
        currentUser.img
      );
      return res.json({ token });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }


  async check(req, res, next) {
    const token = generateJWT(
      req.user.id,
      req.user.login,
      req.user.role,
      req.user.name,
      req.user.surname,
      req.user.img
    );
    res.json({ token });
  }


  async deleteUser(req, res, next) {
    try {
      const id = req.params.id;
      const deleteUser = await User.destroy({
        where: { id },
      });
      return res.json("ok");
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new UserController();
