

const { User, Role, Ability } = require('../models/index');

module.exports = async function (req, res, next) {


    if (req.method === "OPTIONS") return next();

    try {

        if (!req.auth || !req.auth.payload) {
            console.error("❌ ОШИБКА: authMiddleware не передал payload. Токен невалиден или не проверен.");
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const payload = req.auth.payload;


        const keycloakUUID = payload.sub;


        const login = payload.preferred_username || payload.nickname || payload.email;

        if (!login) {
            console.error("❌ ОШИБКА: В токене нет поля login (preferred_username/nickname/email).");
            return res.status(500).json({ message: "Token structure error: missing username" });
        }

        const name = payload.given_name || login;
        const surname = payload.family_name || '';


        const kcRoles = payload.realm_access?.roles || [];


        const priorityRoles = [
            "SUPER_ADMIN",
            "PRODUCTION_CHIEF",
            "TECHNOLOGIST",
            "WAREHOUSE_MASTER",
            "QC_ENGINEER",
            "FIRMWARE_OPERATOR",
            "ASSEMBLER"
        ];


        const mainRole = priorityRoles.find(r => kcRoles.includes(r)) || "ASSEMBLER";


        let user = await User.findOne({ where: { login } });

        if (!user) {
            console.log(`ℹ️ Пользователь ${login} не найден. Создаем с ролью ${mainRole}...`);
            try {
                user = await User.create({
                    login,
                    name,
                    surname,
                    role: mainRole,
                    password: 'sso_managed_account',
                    img: null
                });
                console.log(`✅ Пользователь создан. ID: ${user.id}`);
            } catch (dbError) {
                console.error("❌ ОШИБКА БАЗЫ ДАННЫХ при создании:", dbError);
                return res.status(500).json({ message: "DB Error during user creation" });
            }
        } else {

            if (user.role !== mainRole) {
                console.log(`🔄 Обновление роли пользователя ${login}: ${user.role} -> ${mainRole}`);
                user.role = mainRole;
                await user.save();
            }
        }


        let abilities = [];
        try {
            const roleEntity = await Role.findOne({
                where: { name: mainRole },
                include: [{
                    model: Ability,
                    as: "abilities",
                    through: { attributes: [] }
                }]
            });

            if (roleEntity && roleEntity.abilities) {
                abilities = roleEntity.abilities.map(ab => ab.code);
            }
        } catch (e) {
            console.error("⚠️ Ошибка при загрузке прав (abilities):", e.message);
        }


        req.user = {
            id: user.id,
            login: user.login,
            name: user.name,
            surname: user.surname,
            role: user.role,
            roles: kcRoles,
            abilities: abilities,
            keycloakId: keycloakUUID
        };

        next();

    } catch (e) {
        console.error("🔥 КРИТИЧЕСКАЯ ОШИБКА в syncUserMiddleware:", e);
        return res.status(500).json({ message: "Sync Middleware Crash", error: e.message });
    }
};
