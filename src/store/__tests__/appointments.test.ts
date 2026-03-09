jest.mock('../../services/appointments.service', () => ({
  appointmentsService: {
    list: jest.fn(),
    getById: jest.fn(),
    getAvailableSpecialists: jest.fn(),
    getAvailableTimes: jest.fn(),
    book: jest.fn(),
    cancel: jest.fn(),
    reschedule: jest.fn(),
    rate: jest.fn(),
    getSpecialistCategories: jest.fn(),
  },
}));

jest.mock('../../services/healthCheckup.service', () => ({
  healthCheckupService: {
    getHistory: jest.fn(),
  },
}));

import {useAppointmentsStore} from '../appointments';
import {appointmentsService} from '../../services/appointments.service';
import {healthCheckupService} from '../../services/healthCheckup.service';

const svc = appointmentsService as jest.Mocked<typeof appointmentsService>;
const hcSvc = healthCheckupService as jest.Mocked<typeof healthCheckupService>;

const initialState = {
  appointments: [],
  currentAppointment: null,
  specialists: [],
  categories: [],
  availableTimes: [],
  recentCheckups: [],
  isLoading: false,
  error: null,
  filter: 'upcoming' as const,
  bookingData: {},
};

describe('useAppointmentsStore', () => {
  beforeEach(() => {
    useAppointmentsStore.setState(initialState);
    jest.clearAllMocks();
  });

  describe('fetchAppointments', () => {
    it('loads appointments list with mapped status', async () => {
      svc.list.mockResolvedValue([
        {_id: 'apt-1', status: 'OPEN', date: '2025-06-01'},
        {_id: 'apt-2', status: 'OPEN', date: '2025-06-02'},
      ]);

      await useAppointmentsStore.getState().fetchAppointments();

      expect(svc.list).toHaveBeenCalledWith({status: 'OPEN'});
      expect(useAppointmentsStore.getState().appointments).toHaveLength(2);
      expect(useAppointmentsStore.getState().isLoading).toBe(false);
    });

    it('maps past filter to COMPLETED status', async () => {
      useAppointmentsStore.setState({filter: 'past'});
      svc.list.mockResolvedValue([]);

      await useAppointmentsStore.getState().fetchAppointments();

      expect(svc.list).toHaveBeenCalledWith({status: 'COMPLETED'});
    });

    it('handles nested data response', async () => {
      svc.list.mockResolvedValue({data: [{_id: 'apt-1'}]});

      await useAppointmentsStore.getState().fetchAppointments();

      expect(useAppointmentsStore.getState().appointments).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      svc.list.mockRejectedValue(new Error('Network error'));

      await useAppointmentsStore.getState().fetchAppointments();

      expect(useAppointmentsStore.getState().error).toBe('Network error');
      expect(useAppointmentsStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchAppointmentById', () => {
    it('loads a single appointment', async () => {
      svc.getById.mockResolvedValue({_id: 'apt-1', specialist: {name: 'Dr. Smith'}});

      await useAppointmentsStore.getState().fetchAppointmentById('apt-1');

      expect(useAppointmentsStore.getState().currentAppointment).toEqual({
        _id: 'apt-1',
        specialist: {name: 'Dr. Smith'},
      });
    });

    it('sets error on failure', async () => {
      svc.getById.mockRejectedValue(new Error('Not found'));

      await useAppointmentsStore.getState().fetchAppointmentById('bad-id');

      expect(useAppointmentsStore.getState().error).toBe('Not found');
    });
  });

  describe('fetchCategories', () => {
    it('loads specialist categories', async () => {
      svc.getSpecialistCategories.mockResolvedValue([
        {_id: 'cat-1', name: 'Cardiology'},
        {_id: 'cat-2', name: 'Dermatology'},
      ]);

      await useAppointmentsStore.getState().fetchCategories();

      expect(useAppointmentsStore.getState().categories).toHaveLength(2);
    });

    it('handles grouped response with all/popular keys', async () => {
      svc.getSpecialistCategories.mockResolvedValue({
        all: [{_id: 'cat-1', name: 'General'}],
        popular: [{_id: 'cat-2'}],
      });

      await useAppointmentsStore.getState().fetchCategories();

      expect(useAppointmentsStore.getState().categories).toHaveLength(1);
    });
  });

  describe('fetchSpecialists', () => {
    it('loads specialists with filter', async () => {
      svc.getAvailableSpecialists.mockResolvedValue([
        {_id: 'sp-1', name: 'Dr. A'},
      ]);

      await useAppointmentsStore.getState().fetchSpecialists({category: 'cat-1'});

      expect(svc.getAvailableSpecialists).toHaveBeenCalledWith({category: 'cat-1'});
      expect(useAppointmentsStore.getState().specialists).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      svc.getAvailableSpecialists.mockRejectedValue(new Error('Failed'));

      await useAppointmentsStore.getState().fetchSpecialists({});

      expect(useAppointmentsStore.getState().error).toBe('Failed');
    });
  });

  describe('fetchAvailableTimes', () => {
    it('handles array response', async () => {
      svc.getAvailableTimes.mockResolvedValue(['09:00', '10:00', '11:00']);

      await useAppointmentsStore.getState().fetchAvailableTimes({
        specialist: 'sp-1',
        preferredDates: [{date: '2025-06-01'}],
      });

      expect(useAppointmentsStore.getState().availableTimes).toEqual(['09:00', '10:00', '11:00']);
    });

    it('extracts available slots from date-keyed object', async () => {
      svc.getAvailableTimes.mockResolvedValue({
        '2025-06-01': {available: ['09:00', '10:00'], booked: ['08:00']},
      });

      await useAppointmentsStore.getState().fetchAvailableTimes({
        specialist: 'sp-1',
        preferredDates: [{date: '2025-06-01'}],
      });

      expect(useAppointmentsStore.getState().availableTimes).toEqual(['09:00', '10:00']);
    });

    it('sets error on failure', async () => {
      svc.getAvailableTimes.mockRejectedValue(new Error('No times'));

      await useAppointmentsStore.getState().fetchAvailableTimes({});

      expect(useAppointmentsStore.getState().error).toBe('No times');
    });
  });

  describe('bookAppointment', () => {
    it('books appointment and returns data', async () => {
      svc.book.mockResolvedValue({_id: 'apt-new', status: 'OPEN'});

      const result = await useAppointmentsStore.getState().bookAppointment({
        specialist: 'sp-1',
        date: '2025-06-01',
        time: '09:00',
      });

      expect(result).toEqual({_id: 'apt-new', status: 'OPEN'});
      expect(useAppointmentsStore.getState().isLoading).toBe(false);
    });

    it('sets error and rethrows on failure', async () => {
      svc.book.mockRejectedValue(new Error('Booking failed'));

      await expect(
        useAppointmentsStore.getState().bookAppointment({}),
      ).rejects.toThrow('Booking failed');

      expect(useAppointmentsStore.getState().error).toBe('Booking failed');
    });
  });

  describe('cancelAppointment', () => {
    it('cancels and updates appointment status in list', async () => {
      useAppointmentsStore.setState({
        appointments: [
          {_id: 'apt-1', status: 'OPEN'},
          {_id: 'apt-2', status: 'OPEN'},
        ],
      });
      svc.cancel.mockResolvedValue(undefined);

      await useAppointmentsStore.getState().cancelAppointment('apt-1');

      const apts = useAppointmentsStore.getState().appointments;
      expect(apts[0].status).toBe('cancelled');
      expect(apts[1].status).toBe('OPEN');
    });

    it('sets error on failure', async () => {
      svc.cancel.mockRejectedValue(new Error('Cannot cancel'));

      await useAppointmentsStore.getState().cancelAppointment('apt-1');

      expect(useAppointmentsStore.getState().error).toBe('Cannot cancel');
    });
  });

  describe('rateAppointment', () => {
    it('rates an appointment', async () => {
      svc.rate.mockResolvedValue(undefined);

      await useAppointmentsStore.getState().rateAppointment('apt-1', {rating: 5, comment: 'Great'});

      expect(svc.rate).toHaveBeenCalledWith('apt-1', {rating: 5, comment: 'Great'});
      expect(useAppointmentsStore.getState().isLoading).toBe(false);
    });
  });

  describe('setFilter', () => {
    it('changes the active filter', () => {
      useAppointmentsStore.getState().setFilter('past');
      expect(useAppointmentsStore.getState().filter).toBe('past');
    });
  });

  describe('bookingData', () => {
    it('setBookingData merges partial data', () => {
      useAppointmentsStore.getState().setBookingData({categoryId: 'cat-1'});
      useAppointmentsStore.getState().setBookingData({specialist: {name: 'Dr. A'}});

      const bd = useAppointmentsStore.getState().bookingData;
      expect(bd.categoryId).toBe('cat-1');
      expect(bd.specialist?.name).toBe('Dr. A');
    });

    it('clearBookingData resets to empty object', () => {
      useAppointmentsStore.getState().setBookingData({categoryId: 'cat-1'});
      useAppointmentsStore.getState().clearBookingData();

      expect(useAppointmentsStore.getState().bookingData).toEqual({});
    });
  });

  describe('fetchRecentCheckups', () => {
    it('loads recent checkups with conditions within 30 days', async () => {
      const recentDate = new Date().toISOString();
      hcSvc.getHistory.mockResolvedValue([
        {
          _id: 'hc-1',
          created_at: recentDate,
          response: {data: {conditions: [{name: 'Flu'}]}},
        },
        {
          _id: 'hc-2',
          created_at: '2020-01-01',
          response: {data: {conditions: [{name: 'Old'}]}},
        },
        {
          _id: 'hc-3',
          created_at: recentDate,
          response: {data: {conditions: []}},
        },
      ]);

      await useAppointmentsStore.getState().fetchRecentCheckups();

      expect(useAppointmentsStore.getState().recentCheckups).toHaveLength(1);
      expect(useAppointmentsStore.getState().recentCheckups[0]._id).toBe('hc-1');
    });

    it('sets empty array on failure', async () => {
      hcSvc.getHistory.mockRejectedValue(new Error('fail'));

      await useAppointmentsStore.getState().fetchRecentCheckups();

      expect(useAppointmentsStore.getState().recentCheckups).toEqual([]);
    });
  });
});
