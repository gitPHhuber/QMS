import { makeAutoObservable, runInAction } from 'mobx';
import { $host, $authHost } from '../api/index';

export interface LicenseInfo {
  active: boolean;
  tier: string | null;
  tierName: string | null;
  validUntil: string | null;
  daysRemaining: number | null;
  isGrace: boolean;
  isReadOnly: boolean;
  modules: string[];
  limits: { max_users: number; max_storage_gb: number };
  error: string | null;
}

export default class LicenseStore {
  license: LicenseInfo | null = null;
  loading = true;
  activating = false;
  activateError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchLicense() {
    try {
      this.loading = true;
      const { data } = await $host.get<LicenseInfo>('/api/system/license');
      runInAction(() => {
        this.license = data;
      });
    } catch (e: any) {
      console.error('Failed to fetch license status:', e);
      runInAction(() => {
        this.license = null;
      });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async activate(licenseKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.activating = true;
      this.activateError = null;
      const { data } = await $authHost.post('/api/system/license/activate', { licenseKey });
      runInAction(() => {
        this.license = data.license;
        this.activateError = null;
      });
      return { success: true };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка активации лицензии';
      runInAction(() => {
        this.activateError = msg;
      });
      return { success: false, error: msg };
    } finally {
      runInAction(() => { this.activating = false; });
    }
  }

  get isActive(): boolean {
    return this.license?.active ?? false;
  }

  get isGrace(): boolean {
    return this.license?.isGrace ?? false;
  }

  get isReadOnly(): boolean {
    return this.license?.isReadOnly ?? false;
  }

  /** Badge variant for SubscriptionBadge */
  get badgeVariant(): 'ok' | 'warning' | 'danger' | 'none' {
    if (!this.license || !this.license.active) return 'none';
    if (this.license.isReadOnly) return 'danger';
    if (this.license.isGrace) return 'warning';
    if (this.license.daysRemaining !== null && this.license.daysRemaining <= 14) return 'warning';
    return 'ok';
  }

  get tierDisplayName(): string {
    return this.license?.tierName || this.license?.tier || '';
  }
}
