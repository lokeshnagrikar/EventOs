import { create } from 'zustand';

interface LimitState {
  isOpen: boolean;
  reason: string;
  limitName: string;
  limitValue: string | number;
  currentValue: string | number;
  openLimitModal: (reason: string, limitName: string, limitValue: string | number, currentValue: string | number) => void;
  closeLimitModal: () => void;
}

export const useLimitStore = create<LimitState>((set) => ({
  isOpen: false,
  reason: '',
  limitName: '',
  limitValue: '',
  currentValue: '',
  openLimitModal: (reason, limitName, limitValue, currentValue) => set({
    isOpen: true,
    reason,
    limitName,
    limitValue,
    currentValue
  }),
  closeLimitModal: () => set({
    isOpen: false,
    reason: '',
    limitName: '',
    limitValue: '',
    currentValue: ''
  })
}));
