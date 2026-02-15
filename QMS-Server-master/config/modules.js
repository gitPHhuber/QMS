/**
 * ASVO-QMS Module Manager
 *
 * Manages module availability via .env:
 *   MODULES_TIER=pro        — by tier preset
 *   MODULES_ENABLED=qms.dms,qms.nc  — individual (overrides TIER)
 *   (nothing)               — all modules enabled (dev mode)
 */

const MODULE_CATALOG = {
  // Core (always on)
  'core.auth':          { name: 'Аутентификация',           group: 'core', alwaysOn: true },
  'core.users':         { name: 'Пользователи',              group: 'core', alwaysOn: true },
  'core.audit':         { name: 'Журнал аудита',             group: 'core', alwaysOn: true },
  'core.esign':         { name: 'Электронные подписи',       group: 'core', depends: ['core.auth'] },
  'core.admin':         { name: 'Администрирование',         group: 'core', alwaysOn: true },
  'core.tasks':         { name: 'Задачи и проекты',          group: 'core', alwaysOn: true },
  'core.notifications': { name: 'Уведомления',               group: 'core', depends: [] },

  // QMS
  'qms.dms':         { name: 'Документы СМК',              group: 'qms', depends: [] },
  'qms.changes':     { name: 'Управление изменениями',     group: 'qms', depends: ['qms.dms'] },
  'qms.nc':          { name: 'Несоответствия',              group: 'qms', depends: [] },
  'qms.capa':        { name: 'CAPA',                        group: 'qms', depends: ['qms.nc'] },
  'qms.complaints':  { name: 'Жалобы потребителей',         group: 'qms', depends: ['qms.nc'] },
  'qms.risk':        { name: 'Управление рисками',         group: 'qms', depends: [] },
  'qms.design':      { name: 'Управление проектированием', group: 'qms', depends: ['qms.dms', 'qms.risk', 'qms.changes'] },
  'qms.validation':  { name: 'Валидация процессов',        group: 'qms', depends: ['qms.equipment', 'qms.dms'] },
  'qms.supplier':    { name: 'Поставщики',                  group: 'qms', depends: [] },
  'qms.audit':       { name: 'Внутренние аудиты',          group: 'qms', depends: ['qms.nc'] },
  'qms.training':    { name: 'Обучение',                    group: 'qms', depends: [] },
  'qms.equipment':   { name: 'Оборудование',               group: 'qms', depends: [] },
  'qms.review':      { name: 'Анализ руководства',         group: 'qms', depends: [] },
  'qms.product':     { name: 'Реестр изделий',             group: 'qms', depends: [] },
  'qms.pms':         { name: 'Пострег. мониторинг',        group: 'qms', depends: ['qms.complaints', 'qms.nc'] },
  'qms.dashboard':   { name: 'Дашборд QMS',                group: 'qms', depends: [] },

  // WMS
  'wms.warehouse':    { name: 'Склад',                     group: 'wms', depends: [] },
  'wms.movements':    { name: 'Перемещения',               group: 'wms', depends: ['wms.warehouse'] },
  'wms.analytics':    { name: 'Аналитика склада',          group: 'wms', depends: ['wms.warehouse'] },
  'wms.inventory':    { name: 'Инвентаризация',            group: 'wms', depends: ['wms.warehouse'] },
  'wms.labels':       { name: 'Этикетки',                  group: 'wms', depends: ['wms.warehouse'] },
  'wms.alerts':       { name: 'Оповещения склада',         group: 'wms', depends: ['wms.warehouse'] },
  'wms.traceability': { name: 'Прослеживаемость',          group: 'wms', depends: ['wms.warehouse'] },

  // MES
  'mes.routes':   { name: 'Маршруты сборки',          group: 'mes', depends: [] },
  'mes.orders':   { name: 'Произв. задания',          group: 'mes', depends: ['mes.routes'] },
  'mes.quality':  { name: 'Контроль качества',         group: 'mes', depends: ['mes.routes', 'qms.nc'] },
  'mes.dhr':      { name: 'DHR',                       group: 'mes', depends: ['mes.routes'] },
  'mes.dmr':      { name: 'DMR',                       group: 'mes', depends: [] },
  'mes.kpi':      { name: 'KPI производства',          group: 'mes', depends: ['mes.routes'] },

  // ERP
  'erp.bom':         { name: 'Спецификации (BOM)',     group: 'erp', depends: [] },
  'erp.mrp':         { name: 'Планирование MRP',       group: 'erp', depends: ['erp.bom', 'wms.warehouse'] },
  'erp.procurement': { name: 'Закупки',                 group: 'erp', depends: ['erp.bom', 'qms.supplier'] },
  'erp.costs':       { name: 'Себестоимость',           group: 'erp', depends: ['erp.bom'] },

  // RU
  'ru.gost':      { name: 'ГОСТ / ЕСКД шаблоны',        group: 'ru', depends: ['qms.dms'] },
  'ru.rzn':       { name: 'Росздравнадзор',              group: 'ru', depends: ['qms.complaints'] },
  'ru.1c':        { name: 'Интеграция 1С',               group: 'ru', depends: ['wms.warehouse'] },
  'ru.metrology': { name: 'Метрологическое обеспечение', group: 'ru', depends: ['qms.equipment'] },

  // Premium
  'premium.ai':         { name: 'ИИ-ассистент',          group: 'premium', depends: ['qms.nc', 'qms.capa'] },
  'premium.readiness':  { name: 'Готовность к аудиту',    group: 'premium', depends: [] },
  'premium.analytics':  { name: 'Аналитика Pro',          group: 'premium', depends: [] },
  'premium.lms':        { name: 'eLearning / LMS',        group: 'premium', depends: ['qms.training'] },
  'premium.portal':     { name: 'Портал клиентов',        group: 'premium', depends: ['qms.dms', 'qms.complaints'] },
  'premium.multisite':  { name: 'Multi-Site',             group: 'premium', depends: ['core.users'] },

  // Addon
  'addon.mobile': { name: 'Мобильное приложение', group: 'addon', depends: [] },
  'addon.pdf':    { name: 'PDF-отчёты',           group: 'addon', depends: [] },
  'addon.excel':  { name: 'Excel-импорт',         group: 'addon', depends: [] },
};

const TIER_PRESETS = {
  start: [
    'qms.dms', 'qms.nc', 'qms.dashboard',
    'addon.pdf',
  ],
  standard: [
    'qms.dms', 'qms.nc', 'qms.capa', 'qms.complaints',
    'qms.risk', 'qms.dashboard',
    'wms.warehouse', 'wms.movements',
    'ru.gost',
    'addon.pdf', 'addon.excel',
  ],
  pro: [
    'qms.dms', 'qms.changes', 'qms.nc', 'qms.capa', 'qms.complaints',
    'qms.risk', 'qms.supplier', 'qms.audit', 'qms.training',
    'qms.equipment', 'qms.review', 'qms.product', 'qms.dashboard',
    'core.esign', 'core.notifications',
    'wms.warehouse', 'wms.movements', 'wms.analytics',
    'wms.inventory', 'wms.labels', 'wms.alerts',
    'ru.gost', 'ru.rzn',
    'premium.readiness',
    'addon.mobile', 'addon.pdf', 'addon.excel',
  ],
  industry: [
    'qms.dms', 'qms.changes', 'qms.nc', 'qms.capa', 'qms.complaints',
    'qms.risk', 'qms.design', 'qms.validation',
    'qms.supplier', 'qms.audit', 'qms.training',
    'qms.equipment', 'qms.review', 'qms.product', 'qms.pms', 'qms.dashboard',
    'core.esign', 'core.notifications',
    'wms.warehouse', 'wms.movements', 'wms.analytics',
    'wms.inventory', 'wms.labels', 'wms.alerts', 'wms.traceability',
    'mes.routes', 'mes.orders', 'mes.quality',
    'mes.dhr', 'mes.dmr', 'mes.kpi',
    'ru.gost', 'ru.rzn', 'ru.1c', 'ru.metrology',
    'premium.readiness', 'premium.analytics',
    'addon.mobile', 'addon.pdf', 'addon.excel',
  ],
};

class ModuleManager {
  constructor() {
    const tier = process.env.MODULES_TIER;
    const explicit = process.env.MODULES_ENABLED;

    if (explicit) {
      this.enabled = new Set(explicit.split(',').map(m => m.trim()));
      this.tier = 'custom';
    } else if (tier && TIER_PRESETS[tier]) {
      this.enabled = new Set(TIER_PRESETS[tier]);
      this.tier = tier;
    } else {
      // No settings -> ALL enabled (dev mode, backward compatibility)
      this.enabled = new Set(Object.keys(MODULE_CATALOG));
      this.tier = 'dev-all';
    }

    // Core — always on
    for (const [code, mod] of Object.entries(MODULE_CATALOG)) {
      if (mod.alwaysOn) this.enabled.add(code);
    }

    this._resolveDependencies();
  }

  _resolveDependencies() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const code of this.enabled) {
        const mod = MODULE_CATALOG[code];
        if (!mod || !mod.depends) continue;
        for (const dep of mod.depends) {
          if (!this.enabled.has(dep)) {
            this.enabled.add(dep);
            changed = true;
          }
        }
      }
    }
  }

  /** Check module or group: isEnabled('qms.dms') or isEnabled('qms') */
  isEnabled(moduleCode) {
    if (this.enabled.has(moduleCode)) return true;
    // Check by group
    for (const code of this.enabled) {
      if (code.startsWith(moduleCode + '.')) return true;
    }
    return false;
  }

  getEnabledGroups() {
    const groups = new Set();
    for (const code of this.enabled) {
      const mod = MODULE_CATALOG[code];
      if (mod) groups.add(mod.group);
    }
    return [...groups];
  }

  /** Full module list for client */
  toClientConfig() {
    const modules = [];
    for (const [code, mod] of Object.entries(MODULE_CATALOG)) {
      modules.push({
        code,
        name: mod.name,
        group: mod.group,
        enabled: this.enabled.has(code) || !!mod.alwaysOn,
      });
    }
    return {
      tier: this.tier,
      enabled: [...this.enabled],
      groups: this.getEnabledGroups(),
      maxUsers: this._getMaxUsers(),
      modules,
    };
  }

  /**
   * Apply license constraints — disable modules not present in the license.
   * License modules act as a ceiling: only modules in the license array are allowed.
   * Core (alwaysOn) modules are never disabled.
   * @param {object} licensePayload - Decoded license payload with .modules and .limits
   */
  applyLicense(licensePayload) {
    if (!licensePayload || !licensePayload.modules) return;

    // Wildcard — all modules allowed (corp tier)
    if (licensePayload.modules.includes('*')) {
      this._licenseMaxUsers = licensePayload.limits?.max_users;
      return;
    }

    const licensedModules = new Set(licensePayload.modules);

    for (const code of [...this.enabled]) {
      const mod = MODULE_CATALOG[code];
      if (mod && mod.alwaysOn) continue; // never disable core modules
      if (!licensedModules.has(code)) {
        this.enabled.delete(code);
      }
    }

    this._licenseMaxUsers = licensePayload.limits?.max_users;
    this._resolveDependencies();
  }

  _getMaxUsers() {
    if (this._licenseMaxUsers) return this._licenseMaxUsers;
    const limits = { start: 5, standard: 15, pro: 50, industry: 200, 'dev-all': 999, custom: 999 };
    return limits[this.tier] || 999;
  }

  /** Log on server start */
  printStatus() {
    const enabledCount = [...this.enabled].length;
    const groups = this.getEnabledGroups();
    console.log('╔══════════════════════════════════════╗');
    console.log('║       ASVO-QMS Module System         ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Тариф:   ${this.tier.padEnd(26)}║`);
    console.log(`║  Модулей: ${String(enabledCount).padEnd(26)}║`);
    console.log(`║  Группы:  ${groups.join(', ').padEnd(26)}║`);
    console.log(`║  Юзеров:  до ${String(this._getMaxUsers()).padEnd(23)}║`);
    console.log('╚══════════════════════════════════════╝');
  }
}

const moduleManager = new ModuleManager();

module.exports = { moduleManager, MODULE_CATALOG, TIER_PRESETS };
