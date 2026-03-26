import { create } from 'zustand';
import { appointmentsService } from '../services/appointments.service';
import { healthCheckupService } from '../services/healthCheckup.service';

interface BookingData {
  // Step 1 — service type screen
  service_type?: string;
  urgency?: 'routine' | 'urgent';
  // Step 2 — specialty
  categoryId?: string;
  categoryName?: string;
  professionalCategory?: string;
  // Step 3 — specialist
  specialist?: any;
  // Step 4 — schedule
  date?: string;
  time?: string;
  timezone?: string;
  // Step 5 — confirm
  notes?: string;
  paymentMethod?: 'wallet' | 'card';
  // Shared
  meeting_channel?: string;
  health_checkup_id?: string;
  healthCheckupSummary?: string;
}

interface AppointmentsState {
  appointments: any[];
  currentAppointment: any | null;
  specialists: any[];
  categories: any[];
  availableTimes: any[];
  recentCheckups: any[];
  isLoading: boolean;
  error: string | null;
  filter: 'upcoming' | 'past' | 'missed' | 'cancelled';
  bookingData: BookingData;

  fetchAppointments: () => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  setFilter: (filter: 'upcoming' | 'past' | 'missed' | 'cancelled') => void;
  fetchCategories: () => Promise<void>;
  fetchSpecialists: (payload: any) => Promise<void>;
  fetchAvailableTimes: (payload: any) => Promise<void>;
  fetchRecentCheckups: () => Promise<void>;
  bookAppointment: (payload: any) => Promise<any>;
  cancelAppointment: (id: string) => Promise<void>;
  rateAppointment: (id: string, payload: any) => Promise<void>;
  setBookingData: (data: Partial<BookingData>) => void;
  clearBookingData: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  currentAppointment: null,
  specialists: [],
  categories: [],
  availableTimes: [],
  recentCheckups: [],
  isLoading: false,
  error: null,
  filter: 'upcoming',
  bookingData: {},

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      // Map frontend filter names to backend status values
      const statusMap: Record<string, string> = {
        upcoming: 'OPEN',
        past: 'COMPLETED',
        missed: 'MISSED',
        cancelled: 'CANCELLED',
      };
      const status = statusMap[get().filter] || get().filter;
      const data = await appointmentsService.list({ status });
      const list = Array.isArray(data) ? data : data?.data || data?.result || [];
      set({ appointments: Array.isArray(list) ? list : [], isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch appointments',
        isLoading: false,
      });
    }
  },

  fetchAppointmentById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await appointmentsService.getById(id);
      set({ currentAppointment: data, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch appointment',
        isLoading: false,
      });
    }
  },

  setFilter: (filter: 'upcoming' | 'past' | 'missed' | 'cancelled') => {
    set({ filter });
  },

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await appointmentsService.getSpecialistCategories();
      // API returns { all: [...], popular: [...], others: [...] } or a flat array
      const cats = Array.isArray(data) ? data : data?.all || data?.popular || [];
      set({ categories: Array.isArray(cats) ? cats : [], isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch categories',
        isLoading: false,
      });
    }
  },

  fetchSpecialists: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const data = await appointmentsService.getAvailableSpecialists(payload);
      set({ specialists: data || [], isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch specialists',
        isLoading: false,
      });
    }
  },

  fetchAvailableTimes: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const data = await appointmentsService.getAvailableTimes(payload);
      // Backend returns {[date]: {available: string[], booked: [...]}} or a flat array
      let times: any[] = [];
      if (Array.isArray(data)) {
        times = data;
      } else if (data && typeof data === 'object') {
        // Extract available slots from the date-keyed response
        const dateKey = payload.preferredDates?.[0]?.date;
        const dateData = dateKey ? data[dateKey] : Object.values(data)[0];
        if (dateData?.available) {
          times = dateData.available;
        } else if (Array.isArray(dateData)) {
          times = dateData;
        } else {
          times = Object.values(data).flatMap(
            (d: any) => d?.available || (Array.isArray(d) ? d : [])
          );
        }
      }
      set({ availableTimes: times, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch available times',
        isLoading: false,
      });
    }
  },

  fetchRecentCheckups: async () => {
    try {
      const data = await healthCheckupService.getHistory({ page: 1, limit: 5 });
      const list = data?.checkups || (Array.isArray(data) ? data : []);
      // Only show checkups from the last 30 days that have conditions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recent = list.filter((c: any) => {
        const hasConditions = c.response?.data?.conditions?.length > 0;
        const isRecent = new Date(c.created_at) >= thirtyDaysAgo;
        return hasConditions && isRecent;
      });
      set({ recentCheckups: recent });
    } catch {
      set({ recentCheckups: [] });
    }
  },

  bookAppointment: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const data = await appointmentsService.book(payload);
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to book appointment',
        isLoading: false,
      });
      throw err;
    }
  },

  cancelAppointment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await appointmentsService.cancel(id);
      const appointments = get().appointments.map((apt: any) =>
        apt._id === id ? { ...apt, status: 'cancelled' } : apt
      );
      set({ appointments, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to cancel appointment',
        isLoading: false,
      });
    }
  },

  rateAppointment: async (id: string, payload: any) => {
    set({ isLoading: true, error: null });
    try {
      await appointmentsService.rate(id, payload);
      set({ isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to rate appointment',
        isLoading: false,
      });
    }
  },

  setBookingData: (data: Partial<BookingData>) => {
    set({ bookingData: { ...get().bookingData, ...data } });
  },

  clearBookingData: () => {
    set({ bookingData: {} });
  },
}));
