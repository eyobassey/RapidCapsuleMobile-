import {create} from 'zustand';
import {prescriptionUploadService} from '../services/prescriptionUpload.service';
import type {
  PrescriptionUpload,
  VerificationResult,
  VerificationStatus,
} from '../types/prescriptionUpload.types';

interface PrescriptionUploadState {
  uploads: PrescriptionUpload[];
  currentUpload: PrescriptionUpload | null;
  verification: VerificationResult | null;
  isLoading: boolean;
  isUploading: boolean;
  filter: string;

  fetchUploads: (params?: {status?: string; page?: number; limit?: number}) => Promise<void>;
  fetchUploadById: (id: string) => Promise<void>;
  fetchVerification: (id: string) => Promise<VerificationResult | null>;
  uploadPrescription: (formData: FormData) => Promise<PrescriptionUpload>;
  retryVerification: (id: string) => Promise<void>;
  deleteUpload: (id: string) => Promise<void>;
  submitClarification: (id: string, formData: FormData) => Promise<void>;
  setFilter: (filter: string) => void;
}

export const usePrescriptionUploadStore = create<PrescriptionUploadState>((set, get) => ({
  uploads: [],
  currentUpload: null,
  verification: null,
  isLoading: false,
  isUploading: false,
  filter: '',

  fetchUploads: async (params) => {
    set({isLoading: true});
    try {
      const filterStatus = get().filter;
      const data = await prescriptionUploadService.getMyUploads({
        ...params,
        ...(filterStatus ? {status: filterStatus} : {}),
      });
      const list = Array.isArray(data)
        ? data
        : data?.uploads || data?.prescriptions || [];
      set({uploads: Array.isArray(list) ? list : [], isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  fetchUploadById: async (id) => {
    set({isLoading: true});
    try {
      const data = await prescriptionUploadService.getUploadById(id);
      set({currentUpload: data, isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  fetchVerification: async (id) => {
    try {
      const data = await prescriptionUploadService.getVerification(id);
      set({verification: data});
      return data;
    } catch {
      return null;
    }
  },

  uploadPrescription: async (formData) => {
    set({isUploading: true});
    try {
      const data = await prescriptionUploadService.upload(formData);
      set({isUploading: false});
      return data;
    } catch (err) {
      set({isUploading: false});
      throw err;
    }
  },

  retryVerification: async (id) => {
    set({isLoading: true});
    try {
      await prescriptionUploadService.retryVerification(id);
      const data = await prescriptionUploadService.getUploadById(id);
      set({currentUpload: data, isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  deleteUpload: async (id) => {
    await prescriptionUploadService.deleteUpload(id);
    set({
      uploads: get().uploads.filter(u => u._id !== id),
      currentUpload: null,
    });
  },

  submitClarification: async (id, formData) => {
    set({isLoading: true});
    try {
      await prescriptionUploadService.submitClarification(id, formData);
      const data = await prescriptionUploadService.getUploadById(id);
      set({currentUpload: data, isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  setFilter: (filter) => {
    set({filter});
  },
}));
