const { Role, Ability, RoleAbility } = require("../models/index");
const ApiError = require("../error/ApiError");

class RbacController {

    async getRoles(req, res, next) {
        try {
            const roles = await Role.findAll({
                include: [{
                    model: Ability,
                    as: "abilities",
                    through: { attributes: [] }
                }],
                order: [['id', 'ASC']]
            });
            return res.json(roles);
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }


    async getAbilities(req, res, next) {
        try {
            const abilities = await Ability.findAll({
                order: [['code', 'ASC']]
            });
            return res.json(abilities);
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }


    async updateRoleAbilities(req, res, next) {
        try {
            const { roleId } = req.params;
            const { abilityIds } = req.body;

            const role = await Role.findByPk(roleId);
            if (!role) {
                return next(ApiError.badRequest("Роль не найдена"));
            }

            await role.setAbilities(abilityIds);

            return res.json({ message: "Права роли обновлены" });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }

    async getKeycloakStatus(req, res, next) {
        try {
            const authMode = process.env.AUTH_MODE || 'keycloak';
            if (authMode !== 'keycloak') {
                return res.json({ connected: false, mode: authMode, message: 'Dev-bypass режим' });
            }
            const url = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`;
            const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
            return res.json({
                connected: response.ok, mode: authMode,
                realm: process.env.KEYCLOAK_REALM,
                url: process.env.KEYCLOAK_URL
            });
        } catch (e) {
            return res.json({ connected: false, mode: 'keycloak', error: e.message });
        }
    }
}

module.exports = new RbacController();
