"use strict";
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      `SELECT id, login, password FROM users WHERE password IS NOT NULL AND password NOT LIKE '$2%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    let hashed = 0;
    let skipped = 0;

    for (const user of users) {
      // Skip SSO-managed accounts — they don't use local passwords
      if (user.password === "sso_managed_account") {
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      await queryInterface.sequelize.query(
        `UPDATE users SET password = :hashedPassword, "updatedAt" = NOW() WHERE id = :id`,
        {
          replacements: { hashedPassword, id: user.id },
          type: Sequelize.QueryTypes.UPDATE,
        }
      );
      hashed++;
    }

    console.log(
      `[SECURITY] Password migration: ${hashed} rehashed, ${skipped} SSO skipped, ${users.length} total checked`
    );
  },

  async down() {
    // Irreversible — cannot un-hash passwords
    console.log("[SECURITY] Password hashing is irreversible — down() is a no-op");
  },
};
