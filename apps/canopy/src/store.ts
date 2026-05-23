import { create } from 'zustand';
import type { CanopySession, Signal, Scenario, Forecast, FuturesTriangle, CLAData } from './types';

interface CanopyStore {
  session: CanopySession | null;
  signals: Signal[];
  scenarios: Scenario[];
  forecast: Forecast | null;
  triangle: FuturesTriangle | null;
  cla: CLAData | null;
  currentStep: number;

  setSession: (s: CanopySession) => void;
  setSignals: (s: Signal[]) => void;
  addSignal: (s: Signal) => void;
  updateSignal: (id: string, updates: Partial<Signal>) => void;
  setScenarios: (s: Scenario[]) => void;
  addScenario: (s: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  setForecast: (f: Forecast) => void;
  setTriangle: (t: FuturesTriangle) => void;
  setCLA: (c: CLAData) => void;
  setStep: (n: number) => void;
  reset: () => void;
}

export const useCanopyStore = create<CanopyStore>((set) => ({
  session: null,
  signals: [],
  scenarios: [],
  forecast: null,
  triangle: null,
  cla: null,
  currentStep: 1,

  setSession: (session) => set({ session }),
  setSignals: (signals) => set({ signals }),
  addSignal: (signal) => set((s) => ({ signals: [...s.signals, signal] })),
  updateSignal: (id, updates) =>
    set((s) => ({ signals: s.signals.map((sig) => (sig.id === id ? { ...sig, ...updates } : sig)) })),
  setScenarios: (scenarios) => set({ scenarios }),
  addScenario: (scenario) => set((s) => ({ scenarios: [...s.scenarios, scenario] })),
  updateScenario: (id, updates) =>
    set((s) => ({ scenarios: s.scenarios.map((sc) => (sc.id === id ? { ...sc, ...updates } : sc)) })),
  setForecast: (forecast) => set({ forecast }),
  setTriangle: (triangle) => set({ triangle }),
  setCLA: (cla) => set({ cla }),
  setStep: (currentStep) => set({ currentStep }),
  reset: () =>
    set({ session: null, signals: [], scenarios: [], forecast: null, triangle: null, cla: null, currentStep: 1 }),
}));
