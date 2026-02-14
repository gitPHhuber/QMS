"use strict";

/**
 * MES Module — Seed abilities, roles & role_abilities for MES
 *
 * Abilities:
 *   dmr.read, dmr.create, dmr.approve, dmr.manage
 *   workorder.read, workorder.create, workorder.manage, workorder.launch
 *   routesheet.read, routesheet.execute, routesheet.manage
 *   mesqc.read, mesqc.inspect, mesqc.manage
 *   psi.read, psi.create, psi.decide, psi.manage
 *   meskpi.read, meskpi.manage
 *
 * Roles:
 *   PRODUCTION_OPERATOR, PRODUCTION_SUPERVISOR
 *
 * Assignments:
 *   PRODUCTION_OPERATOR  -> limited MES abilities
 *   PRODUCTION_SUPERVISOR -> all MES abilities
 *   SUPER_ADMIN           -> all MES abilities
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // ─── Helper: find or create ability ───
      const findOrCreateAbility = async (code, description) => {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM abilities WHERE code = :code LIMIT 1`,
          { replacements: { code }, type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        if (existing) return existing.id;

        const [result] = await queryInterface.sequelize.query(
          `INSERT INTO abilities (code, description, "createdAt", "updatedAt")
           VALUES (:code, :description, NOW(), NOW()) RETURNING id`,
          { replacements: { code, description }, transaction: t }
        );
        return result[0].id;
      };

      // ─── Helper: find or create role ───
      const findOrCreateRole = async (code, name, description) => {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM roles WHERE code = :code LIMIT 1`,
          { replacements: { code }, type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        if (existing) return existing.id;

        const [result] = await queryInterface.sequelize.query(
          `INSERT INTO roles (code, name, description, "createdAt", "updatedAt")
           VALUES (:code, :name, :description, NOW(), NOW()) RETURNING id`,
          { replacements: { code, name, description }, transaction: t }
        );
        return result[0].id;
      };

      // ─── Helper: assign ability to role (idempotent) ───
      const assignAbility = async (roleId, abilityId) => {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM role_abilities WHERE "roleId" = :roleId AND "abilityId" = :abilityId LIMIT 1`,
          { replacements: { roleId, abilityId }, type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        if (existing) return;

        await queryInterface.sequelize.query(
          `INSERT INTO role_abilities ("roleId", "abilityId", "createdAt", "updatedAt")
           VALUES (:roleId, :abilityId, NOW(), NOW())`,
          { replacements: { roleId, abilityId }, transaction: t }
        );
      };

      // ═══ Create all MES abilities ═══
      const abilities = [
        { code: "dmr.read", description: "View Device Master Records" },
        { code: "dmr.create", description: "Create and edit Device Master Records" },
        { code: "dmr.approve", description: "Approve Device Master Records" },
        { code: "dmr.manage", description: "Full management of Device Master Records" },
        { code: "workorder.read", description: "View work orders" },
        { code: "workorder.create", description: "Create and edit work orders" },
        { code: "workorder.manage", description: "Full management of work orders" },
        { code: "workorder.launch", description: "Launch work orders into production" },
        { code: "routesheet.read", description: "View route sheets and operation records" },
        { code: "routesheet.execute", description: "Execute route sheet steps" },
        { code: "routesheet.manage", description: "Full management of route sheets" },
        { code: "mesqc.read", description: "View MES quality control data" },
        { code: "mesqc.inspect", description: "Perform MES inspections" },
        { code: "mesqc.manage", description: "Full management of MES quality control" },
        { code: "psi.read", description: "View acceptance tests (PSI)" },
        { code: "psi.create", description: "Create acceptance tests" },
        { code: "psi.decide", description: "Make acceptance test decisions" },
        { code: "psi.manage", description: "Full management of acceptance tests" },
        { code: "meskpi.read", description: "View production KPI dashboards" },
        { code: "meskpi.manage", description: "Manage production KPI targets" },
      ];

      const abilityMap = {};
      for (const a of abilities) {
        abilityMap[a.code] = await findOrCreateAbility(a.code, a.description);
      }
      console.log(`  seeded ${abilities.length} MES abilities`);

      // ═══ Create MES roles ═══
      const operatorRoleId = await findOrCreateRole(
        "PRODUCTION_OPERATOR",
        "Production Operator",
        "Production line operator with ability to execute route sheet steps and view work orders"
      );

      const supervisorRoleId = await findOrCreateRole(
        "PRODUCTION_SUPERVISOR",
        "Production Supervisor",
        "Production supervisor with full MES module access including work order management and quality control"
      );
      console.log("  seeded PRODUCTION_OPERATOR and PRODUCTION_SUPERVISOR roles");

      // ═══ Assign abilities to PRODUCTION_OPERATOR ═══
      const operatorAbilities = [
        "routesheet.read",
        "routesheet.execute",
        "mesqc.read",
        "workorder.read",
        "psi.read",
        "meskpi.read",
      ];
      for (const code of operatorAbilities) {
        await assignAbility(operatorRoleId, abilityMap[code]);
      }
      console.log(`  assigned ${operatorAbilities.length} abilities to PRODUCTION_OPERATOR`);

      // ═══ Assign ALL MES abilities to PRODUCTION_SUPERVISOR ═══
      const allAbilityCodes = abilities.map((a) => a.code);
      for (const code of allAbilityCodes) {
        await assignAbility(supervisorRoleId, abilityMap[code]);
      }
      console.log(`  assigned ${allAbilityCodes.length} abilities to PRODUCTION_SUPERVISOR`);

      // ═══ Assign ALL MES abilities to SUPER_ADMIN ═══
      const [superAdmin] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE code = 'SUPER_ADMIN' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );
      if (superAdmin) {
        for (const code of allAbilityCodes) {
          await assignAbility(superAdmin.id, abilityMap[code]);
        }
        console.log(`  assigned ${allAbilityCodes.length} abilities to SUPER_ADMIN`);
      } else {
        console.log("  SUPER_ADMIN role not found — skipping assignment");
      }

      await t.commit();
      console.log("✅ [MES-SEED] MES abilities and role assignments seeded");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const mesCodes = [
        "dmr.read", "dmr.create", "dmr.approve", "dmr.manage",
        "workorder.read", "workorder.create", "workorder.manage", "workorder.launch",
        "routesheet.read", "routesheet.execute", "routesheet.manage",
        "mesqc.read", "mesqc.inspect", "mesqc.manage",
        "psi.read", "psi.create", "psi.decide", "psi.manage",
        "meskpi.read", "meskpi.manage",
      ];

      // Remove role_abilities referencing MES abilities
      await queryInterface.sequelize.query(
        `DELETE FROM role_abilities WHERE "abilityId" IN (
           SELECT id FROM abilities WHERE code IN (:codes)
         )`,
        { replacements: { codes: mesCodes }, transaction: t }
      );

      // Remove MES abilities
      await queryInterface.sequelize.query(
        `DELETE FROM abilities WHERE code IN (:codes)`,
        { replacements: { codes: mesCodes }, transaction: t }
      );

      // Remove MES-specific roles
      await queryInterface.sequelize.query(
        `DELETE FROM roles WHERE code IN ('PRODUCTION_OPERATOR', 'PRODUCTION_SUPERVISOR')`,
        { transaction: t }
      );

      await t.commit();
      console.log("✅ [MES-SEED] MES abilities and roles removed");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
