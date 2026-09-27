import { create } from 'zustand';
import { Campaign, Lead, DashboardStats, CampaignStatus, LeadStatus } from '@/types';

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  leads: Lead[];
  currentLead: Lead | null;
  dashboardStats: DashboardStats | null;
  realtimeStats: {
    activeVisitors: number;
    recentLeads: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      campaign: { name: string };
      createdAt: string;
    }>;
    recentEvents: Array<{
      type: string;
      campaign: { name: string };
      createdAt: string;
    }>;
  } | null;
  isLoading: boolean;
  error: string | null;

  setCampaigns: (campaigns: Campaign[]) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;

  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  setCurrentLead: (lead: Lead | null) => void;

  setDashboardStats: (stats: DashboardStats) => void;
  setRealtimeStats: (stats: CampaignState['realtimeStats']) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCampaignStore = create<CampaignState>((set) => ({
  campaigns: [],
  currentCampaign: null,
  leads: [],
  currentLead: null,
  dashboardStats: null,
  realtimeStats: null,
  isLoading: false,
  error: null,

  setCampaigns: (campaigns) => set({ campaigns }),
  addCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns] })),
  updateCampaign: (id, data) => set((state) => ({
    campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...data } : c)),
    currentCampaign: state.currentCampaign?.id === id ? { ...state.currentCampaign, ...data } : state.currentCampaign,
  })),
  removeCampaign: (id) => set((state) => ({
    campaigns: state.campaigns.filter((c) => c.id !== id),
    currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
  })),
  setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),

  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (id, data) => set((state) => ({
    leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)),
    currentLead: state.currentLead?.id === id ? { ...state.currentLead, ...data } : state.currentLead,
  })),
  removeLead: (id) => set((state) => ({
    leads: state.leads.filter((l) => l.id !== id),
    currentLead: state.currentLead?.id === id ? null : state.currentLead,
  })),
  setCurrentLead: (lead) => set({ currentLead: lead }),

  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setRealtimeStats: (stats) => set({ realtimeStats: stats }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));