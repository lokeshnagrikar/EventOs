import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import { useLimitStore } from './limitStore';

export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  currency: string;
  billingInterval: string;
  maxUsers: number;
  maxStorage: number;
  maxGalleryUploads: number;
  maxEvents: number;
  maxLeads: number;
  maxAiCredits: number;
  maxAutomationRuns: number;
  maxApiCalls: number;
  customDomainSupported: boolean;
  whiteLabelSupported: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: Plan;
  status: string;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface TenantUsage {
  id: string;
  tenantId: string;
  usersCount: number;
  storageBytes: number;
  galleryUploads: number;
  eventsCount: number;
  leadsCount: number;
  aiCreditsUsed: number;
  automationRuns: number;
  apiCalls: number;
  emailsSent: number;
  smsSent: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: string;
  provider: string;
  last4: string;
  cardBrand: string;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  currency: string;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string;
}

export interface WorkspaceSettings {
  id: string;
  tenantId: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  whiteLabelEnabled: boolean;
  customLoginUrl: string | null;
  customEmailSender: string | null;
}

interface BillingState {
  plans: Plan[];
  subscription: Subscription | null;
  usage: TenantUsage | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  settings: WorkspaceSettings | null;
  loading: boolean;
  error: string | null;

  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  upgradeSubscription: (planCode: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  pauseSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  addPaymentMethod: (pm: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<WorkspaceSettings>) => Promise<void>;
  checkLimit: (metric: string, increment?: number) => boolean;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  plans: [],
  subscription: null,
  usage: null,
  paymentMethods: [],
  invoices: [],
  settings: null,
  loading: false,
  error: null,

  fetchPlans: async () => {
    try {
      const res = await apiClient.get('/auth/billing/plans');
      set({ plans: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchSubscription: async () => {
    try {
      const res = await apiClient.get('/auth/billing/subscription');
      set({ subscription: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchUsage: async () => {
    try {
      const res = await apiClient.get('/auth/billing/usage');
      set({ usage: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchPaymentMethods: async () => {
    try {
      const res = await apiClient.get('/auth/billing/payment-methods');
      set({ paymentMethods: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchInvoices: async () => {
    try {
      const res = await apiClient.get('/auth/billing/invoices');
      set({ invoices: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchSettings: async () => {
    try {
      const res = await apiClient.get('/auth/billing/settings');
      set({ settings: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  upgradeSubscription: async (planCode: string) => {
    set({ loading: true });
    try {
      const res = await apiClient.post('/auth/billing/subscription/checkout', { planCode });
      const { url } = res.data.data;
      if (url) {
        window.location.href = url;
      }
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async () => {
    set({ loading: true });
    try {
      const res = await apiClient.post('/auth/billing/subscription/cancel');
      set({ subscription: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  pauseSubscription: async () => {
    set({ loading: true });
    try {
      const res = await apiClient.post('/auth/billing/subscription/pause');
      set({ subscription: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  reactivateSubscription: async () => {
    set({ loading: true });
    try {
      const res = await apiClient.post('/auth/billing/subscription/reactivate');
      set({ subscription: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  addPaymentMethod: async (pm) => {
    try {
      await apiClient.post('/auth/billing/payment-methods', pm);
      await get().fetchPaymentMethods();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deletePaymentMethod: async (id) => {
    try {
      await apiClient.delete(`/auth/billing/payment-methods/${id}`);
      await get().fetchPaymentMethods();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  setDefaultPaymentMethod: async (id) => {
    try {
      await apiClient.post(`/auth/billing/payment-methods/${id}/default`);
      await get().fetchPaymentMethods();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const res = await apiClient.put('/auth/billing/settings', settingsData);
      set({ settings: res.data.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  checkLimit: (metric: string, increment = 1): boolean => {
    const { subscription, usage } = get();
    if (!subscription || !usage) return true;

    const plan = subscription.plan;
    let limitValue = 0;
    let currentValue = 0;
    let limitName = '';
    let metricLabel = '';

    switch (metric.toLowerCase()) {
      case 'users':
        limitValue = plan.maxUsers;
        currentValue = usage.usersCount;
        limitName = 'maxUsers';
        metricLabel = 'Team Members';
        break;
      case 'storage':
        limitValue = plan.maxStorage;
        currentValue = usage.storageBytes;
        limitName = 'maxStorage';
        metricLabel = 'Storage Space';
        break;
      case 'uploads':
        limitValue = plan.maxGalleryUploads;
        currentValue = usage.galleryUploads;
        limitName = 'maxGalleryUploads';
        metricLabel = 'Gallery Uploads';
        break;
      case 'events':
        limitValue = plan.maxEvents;
        currentValue = usage.eventsCount;
        limitName = 'maxEvents';
        metricLabel = 'Active Events';
        break;
      case 'leads':
        limitValue = plan.maxLeads;
        currentValue = usage.leadsCount;
        limitName = 'maxLeads';
        metricLabel = 'CRM Leads';
        break;
      case 'aicredits':
        limitValue = plan.maxAiCredits;
        currentValue = usage.aiCreditsUsed;
        limitName = 'maxAiCredits';
        metricLabel = 'AI Assistant Credits';
        break;
      case 'automations':
        limitValue = plan.maxAutomationRuns;
        currentValue = usage.automationRuns;
        limitName = 'maxAutomationRuns';
        metricLabel = 'Workspace Automations';
        break;
      case 'apicalls':
        limitValue = plan.maxApiCalls;
        currentValue = usage.apiCalls;
        limitName = 'maxApiCalls';
        metricLabel = 'API Requests';
        break;
      default:
        return true;
    }

    if (currentValue + increment > limitValue) {
      const formatVal = (val: number, met: string) => {
        if (met === 'storage') {
          return `${(val / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        }
        return val.toLocaleString();
      };

      const reason = `You have reached the maximum allowed limit of ${metricLabel} (${formatVal(limitValue, metric.toLowerCase())}) on your current ${plan.name} plan.`;
      
      useLimitStore.getState().openLimitModal(
        reason,
        metricLabel,
        formatVal(limitValue, metric.toLowerCase()),
        formatVal(currentValue, metric.toLowerCase())
      );
      return false;
    }

    return true;
  }
}));
