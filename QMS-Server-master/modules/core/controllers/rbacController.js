const { Role, Ability, RoleAbility } = require("../../../models/index");
const ApiError = require("../../../error/ApiError");
const { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } = require("../utils/auditLogger");

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

            const role = await Role.findByPk(roleId, {
                include: [{ model: Ability, as: "abilities", through: { attributes: [] } }]
            });
            if (!role) {
                return next(ApiError.badRequest("Роль не найдена"));
            }

            const beforeCodes = role.abilities.map(a => a.code);
            const beforeIds = role.abilities.map(a => a.id);

            await role.setAbilities(abilityIds);

            // Reload to get new abilities
            const updatedRole = await Role.findByPk(roleId, {
                include: [{ model: Ability, as: "abilities", through: { attributes: [] } }]
            });
            const afterCodes = updatedRole.abilities.map(a => a.code);
            const afterIds = updatedRole.abilities.map(a => a.id);

            // Compute diff
            const granted = afterCodes.filter(c => !beforeCodes.includes(c));
            const revoked = beforeCodes.filter(c => !afterCodes.includes(c));

            // ISO 13485 §4.2.4: log access control changes
            if (granted.length > 0) {
                await logAudit({
                    req,
                    action: AUDIT_ACTIONS.ROLE_ABILITY_GRANT,
                    entity: AUDIT_ENTITIES.ROLE,
                    entityId: roleId,
                    description: `Role "${role.name}": granted ${granted.length} abilities`,
                    metadata: { roleName: role.name, granted, before: beforeCodes, after: afterCodes },
                });
            }
            if (revoked.length > 0) {
                await logAudit({
                    req,
                    action: AUDIT_ACTIONS.ROLE_ABILITY_REVOKE,
                    entity: AUDIT_ENTITIES.ROLE,
                    entityId: roleId,
                    description: `Role "${role.name}": revoked ${revoked.length} abilities`,
                    metadata: { roleName: role.name, revoked, before: beforeCodes, after: afterCodes },
                });
            }

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
