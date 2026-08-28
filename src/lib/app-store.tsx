import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Priority = "High" | "Medium" | "Low";
export type Status = "Not Started" | "In Progress" | "Completed";

export interface Task {
  id: string;
  name: string;
  description: string;
  deadline: string; // yyyy-mm-dd or ""
  durationHours: number;
  priority: Priority;
  status: Status;
  owner: string; // responsible person, "" if unknown
  source: "manual" | "meeting";
  createdAt: string;
}

export interface EmailRecord {
  id: string;
  subject: string;
  purpose: string;
  createdAt: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  actionItemCount: number;
  decisionCount: number;
  createdAt: string;
}

export interface AppState {
  tasks: Task[];
  emails: EmailRecord[];
  meetings: MeetingRecord[];
  emailsGenerated: number;
  meetingsAnalysed: number;
  actionItemsExtracted: number;
  schedulesGenerated: number;
}

const STORAGE_KEY = "awpa-state-v1";

const initialState: AppState = {
  tasks: [],
  emails: [],
  meetings: [],
  emailsGenerated: 0,
  meetingsAnalysed: 0,
  actionItemsExtracted: 0,
  schedulesGenerated: 0,
};

export const uid = () => Math.random().toString(36).slice(2, 10);

interface Ctx {
  state: AppState;
  hydrated: boolean;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  recordEmail: (rec: Omit<EmailRecord, "id" | "createdAt">) => void;
  recordMeeting: (rec: Omit<MeetingRecord, "id" | "createdAt">) => void;
  recordSchedule: () => void;
}

const AppStoreContext = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as AppState) });
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    const full: Task = { ...task, id: uid(), createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, tasks: [full, ...s.tasks] }));
    return full;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const recordEmail = useCallback((rec: Omit<EmailRecord, "id" | "createdAt">) => {
    setState((s) => ({
      ...s,
      emailsGenerated: s.emailsGenerated + 1,
      emails: [{ ...rec, id: uid(), createdAt: new Date().toISOString() }, ...s.emails].slice(0, 25),
    }));
  }, []);

  const recordMeeting = useCallback((rec: Omit<MeetingRecord, "id" | "createdAt">) => {
    setState((s) => ({
      ...s,
      meetingsAnalysed: s.meetingsAnalysed + 1,
      actionItemsExtracted: s.actionItemsExtracted + rec.actionItemCount,
      meetings: [{ ...rec, id: uid(), createdAt: new Date().toISOString() }, ...s.meetings].slice(
        0,
        25,
      ),
    }));
  }, []);

  const recordSchedule = useCallback(() => {
    setState((s) => ({ ...s, schedulesGenerated: s.schedulesGenerated + 1 }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      addTask,
      updateTask,
      removeTask,
      recordEmail,
      recordMeeting,
      recordSchedule,
    }),
    [state, hydrated, addTask, updateTask, removeTask, recordEmail, recordMeeting, recordSchedule],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(deadline: string) {
  if (!deadline) return null;
  const d = new Date(deadline + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(todayISO() + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}
