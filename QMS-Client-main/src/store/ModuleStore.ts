import { makeAutoObservable, runInAction } from 'mobx';
import { $host } from '../api/index';

export interface ModuleInfo {
  code: string;
  name: string;
  group: string;
  enabled: boolean;
}

export interface ModulesConfig {
  tier: string;
  enabled: string[];
  groups: string[];
  maxUsers: number;
  modules: ModuleInfo[];
}

export default class ModuleStore {
  config: ModulesConfig | null = null;
  loading = true;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchModules() {
    try {
      this.loading = true;
      const { data } = await $host.get<ModulesConfig>('/api/system/modules');
      runInAction(() => {
        this.config = data;
        this.error = null;
      });
    } catch (e: any) {
      console.error('Failed to fetch modules config:', e);
      runInAction(() => {
        // Fallback: all enabled (backward compatibility)
        this.config = {
          tier: 'fallback',
          enabled: [],
          groups: ['core', 'qms', 'wms'],
          maxUsers: 999,
          modules: [],
        };
        this.error = e?.message || 'Failed to load modules';
      });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** Check specific module: isEnabled('qms.dms') */
  isEnabled(code: string): boolean {
    if (!this.config) return false; // Not loaded yet — hide until ready (Preloader shown)
    if (this.config.tier === 'fallback') return code.startsWith('core.'); // API error — core only
    if (this.config.enabled.includes(code)) return true;
    // Check by group: isEnabled('qms') -> true if any qms.* exists
    return this.config.enabled.some(m => m.startsWith(code + '.'));
  }

  /** Check group availability: hasGroup('wms') */
  hasGroup(group: string): boolean {
    if (!this.config) return false;
    if (this.config.tier === 'fallback') return group === 'core';
    return this.config.groups.includes(group);
  }

  get tierName(): string {
    const names: Record<string, string> = {
      start: 'Старт', standard: 'Стандарт', pro: 'Про',
      industry: 'Индустрия', 'dev-all': 'Разработка', fallback: 'Все модули',
    };
    return names[this.config?.tier || ''] || this.config?.tier || '—';
  }

  get enabledCount(): number {
    return this.config?.enabled.length || 0;
  }
}
