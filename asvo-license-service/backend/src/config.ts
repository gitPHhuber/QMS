import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ED25519_PRIVATE_KEY_PATH: z.string().default('./keys/private.key'),
  ED25519_PUBLIC_KEY_PATH: z.string().default('./keys/public.key'),
  JWT_SECRET: z.string().default('change_me_in_production'),
  ADMIN_TOKEN: z.string().default('admin_secret_change_me'),
  YUKASSA_SHOP_ID: z.string().default(''),
  YUKASSA_SECRET_KEY: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@asvo.tech'),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_ADMIN_CHAT_ID: z.string().default(''),
  CORS_ORIGINS: z.string().default(''),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}

export const TIER_PRESETS = {
  start: {
    price_monthly: 15000,
    price_quarterly: 40500,
    price_annual: 144000,
    max_users: 5,
    max_storage_gb: 5,
    modules: ['qms.dms', 'qms.nc'],
  },
  standard: {
    price_monthly: 35000,
    price_quarterly: 94500,
    price_annual: 336000,
    max_users: 15,
    max_storage_gb: 20,
    modules: ['qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes', 'qms.complaints'],
  },
  pro: {
    price_monthly: 60000,
    price_quarterly: 162000,
    price_annual: 576000,
    max_users: 50,
    max_storage_gb: 100,
    modules: [
      'qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes',
      'qms.complaints', 'qms.supplier', 'qms.audit', 'qms.training',
      'qms.equipment', 'qms.review', 'qms.pms', 'qms.dashboard',
      'wms.warehouse', 'wms.movements', 'wms.inventory',
      'addon.mobile', 'addon.pdf',
    ],
  },
  industry: {
    price_monthly: 120000,
    price_quarterly: 324000,
    price_annual: 1152000,
    max_users: 200,
    max_storage_gb: 500,
    modules: [
      'qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes',
      'qms.complaints', 'qms.supplier', 'qms.audit', 'qms.training',
      'qms.equipment', 'qms.review', 'qms.design', 'qms.validation',
      'qms.pms', 'qms.dashboard',
      'wms.warehouse', 'wms.movements', 'wms.inventory', 'wms.traceability',
      'mes.routes', 'mes.orders', 'mes.quality', 'mes.dhr',
      'addon.mobile', 'addon.pdf', 'addon.api',
    ],
  },
  corp: {
    price_monthly: 0,
    price_quarterly: 0,
    price_annual: 0,
    max_users: 99999,
    max_storage_gb: 99999,
    modules: ['*'],
  },
} as const;

export type TierName = keyof typeof TIER_PRESETS;

export function getTierPrice(tier: TierName, cycle: 'monthly' | 'quarterly' | 'annual'): number {
  const preset = TIER_PRESETS[tier];
  switch (cycle) {
    case 'monthly': return preset.price_monthly;
    case 'quarterly': return preset.price_quarterly;
    case 'annual': return preset.price_annual;
  }
}
