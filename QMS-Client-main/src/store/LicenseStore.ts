import { makeAutoObservable, runInAction } from 'mobx';
import { $host } from '../api/index';

export interface LicenseInfo {
  valid: boolean;
  tier: string | null;
  modules: string[];
  limits: { max_users: number; max_storage_gb: number };
  expired: boolean;
  inGrace: boolean;
  daysUntilExpiry: number;
  payload: any;
  error: string | null;
}

export default class LicenseStore {
  info: LicenseInfo | null = null;
  loading = true;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchLicense() {
    try {
      this.loading = true;
      const { data } = await $host.get<LicenseInfo>('/api/system/license');
      runInAction(() => {
        this.info = data;
        this.error = null;
      });
    } catch (e: any) {
      console.error('Failed to fetch license info:', e);
      runInAction(() => {
        this.info = null;
        this.error = e?.message || 'Failed to load license';
      });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async activateLicense(file: File): Promise<{ success: boolean; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('license', file);
      const { data } = await $host.post('/api/system/license/activate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      runInAction(() => {
        this.info = data.state;
        this.error = null;
      });
      return { success: true };
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Activation failed';
      return { success: false, error: msg };
    }
  }

  get isExpired(): boolean {
    return this.info?.expired ?? false;
  }

  get isInGrace(): boolean {
    return this.info?.inGrace ?? false;
  }

  get isValid(): boolean {
    return this.info?.valid ?? false;
  }

  get tierName(): string {
    const names: Record<string, string> = {
      start: 'Старт', standard: 'Стандарт', pro: 'Про',
      industry: 'Индустрия', corp: 'Корпорация',
    };
    return names[this.info?.tier || ''] || this.info?.tier || '—';
  }

  get daysUntilExpiry(): number {
    return this.info?.daysUntilExpiry ?? 0;
  }

  get badgeColor(): 'green' | 'yellow' | 'red' {
    if (!this.info || !this.info.valid) return 'red';
    if (this.info.inGrace) return 'yellow';
    if (this.info.daysUntilExpiry <= 30) return 'yellow';
    return 'green';
  }

  get hasLicense(): boolean {
    return this.info !== null && this.info.payload !== null;
  }
}
