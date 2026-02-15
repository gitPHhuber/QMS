import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

/* ---------- Types ---------- */

export interface DashboardStats {
  mrr: number;
  arr: number;
  activeOrgs: number;
  onlineInstances: number;
  totalInstances: number;
  alerts: number;
  tierDistribution: { name: string; value: number }[];
  recentAlerts: Alert[];
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  orgName: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  inn: string;
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  instanceCount: number;
  lastHeartbeat: string;
  mrr: number;
}

export interface Instance {
  id: string;
  orgId: string;
  orgName: string;
  hostname: string;
  version: string;
  status: 'online' | 'offline' | 'degraded';
  lastHeartbeat: string;
  userCount: number;
  storageUsedGb: number;
}

export interface License {
  id: string;
  orgId: string;
  instanceId: string;
  tier: string;
  modules: string[];
  maxUsers: number;
  maxStorageGb: number;
  issuedAt: string;
  expiresAt: string;
  fingerprint: string;
}

export interface Payment {
  id: string;
  orgId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt: string;
  invoiceUrl: string;
}

export interface TelemetryPoint {
  ts: string;
  users: number;
  storageGb: number;
  errors: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  details: string;
  createdAt: string;
}

/* ---------- Hooks ---------- */

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/stats');
      return data;
    },
  });
}

export function useOrganizations(params?: {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{ items: Organization[]; total: number }>({
    queryKey: ['organizations', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/orgs', { params });
      return data;
    },
  });
}

export function useOrganization(id: string) {
  return useQuery<Organization>({
    queryKey: ['organization', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orgs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useInstances(params?: { orgId?: string; status?: string }) {
  return useQuery<Instance[]>({
    queryKey: ['instances', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/instances', { params });
      return data;
    },
  });
}

export function useLicenses(orgId: string) {
  return useQuery<License[]>({
    queryKey: ['licenses', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orgs/${orgId}/licenses`);
      return data;
    },
    enabled: !!orgId,
  });
}

export function usePayments(orgId: string) {
  return useQuery<Payment[]>({
    queryKey: ['payments', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orgs/${orgId}/payments`);
      return data;
    },
    enabled: !!orgId,
  });
}

export function useTelemetry(instanceId: string) {
  return useQuery<TelemetryPoint[]>({
    queryKey: ['telemetry', instanceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/instances/${instanceId}/telemetry`);
      return data;
    },
    enabled: !!instanceId,
  });
}

export function useAuditLog(orgId: string) {
  return useQuery<AuditEntry[]>({
    queryKey: ['audit', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orgs/${orgId}/audit`);
      return data;
    },
    enabled: !!orgId,
  });
}
