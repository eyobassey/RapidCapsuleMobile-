import {
  CategoryValueSleepAnalysis,
  isHealthDataAvailable,
  queryCategorySamples,
  queryQuantitySamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import type { ObjectTypeIdentifier } from '@kingstinct/react-native-healthkit';

import { vitalsService } from './vitals.service';

const READ_PERMISSIONS: ObjectTypeIdentifier[] = [
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierStepCount',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierBloodPressureSystolic',
  'HKQuantityTypeIdentifierBloodPressureDiastolic',
  'HKQuantityTypeIdentifierOxygenSaturation',
  'HKQuantityTypeIdentifierBodyTemperature',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierRespiratoryRate',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierBloodGlucose',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
];

const SYNC_WINDOW_DAYS = 7;

// 5-second tolerance for pairing systolic/diastolic samples from the same measurement
const BP_PAIR_TOLERANCE_MS = 5000;

// Maps HealthKit dataType keys → Vitals API field names
// Vital entity shape per field: { value: String, unit: String, updatedAt: Date }
const HEALTHKIT_TO_VITALS_FIELD: Record<string, string> = {
  heart_rate: 'pulse_rate',
  oxygen_saturation: 'spo2',
  body_temperature: 'body_temp',
  weight: 'body_weight',
  blood_glucose: 'blood_sugar_level',
  // These already match the Vitals API field names:
  steps: 'steps',
  sleep: 'sleep',
  blood_pressure: 'blood_pressure',
  respiratory_rate: 'respiratory_rate',
  calories_burned: 'calories_burned',
  body_fat: 'body_fat',
  distance: 'distance',
};

type HealthSample = {
  dataType: string;
  value: number | string;
  unit: string;
  recordedAt: string;
};

export const appleHealthService = {
  /**
   * Synchronous check — safe to call without await.
   * Returns false on simulators, non-iOS, or when HealthKit is unavailable.
   */
  isAvailable(): boolean {
    return isHealthDataAvailable();
  },

  /**
   * Async variant kept for API compatibility with callers that await the result.
   */
  async isSupported(): Promise<boolean> {
    return isHealthDataAvailable();
  },

  async requestPermissions(): Promise<boolean> {
    try {
      return await requestAuthorization({ toRead: READ_PERMISSIONS });
    } catch {
      return false;
    }
  },

  async fetchAndSync(): Promise<{ synced: number; errors: string[] }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - SYNC_WINDOW_DAYS);

    const filter = { date: { startDate, endDate } };

    const healthData: HealthSample[] = [];
    const errors: string[] = [];

    // Heart Rate
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
        filter,
        limit: 0,
        unit: 'count/min',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'heart_rate',
          value: Math.round(s.quantity),
          unit: 'bpm',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Heart rate: ${e.message}`);
    }

    // Steps
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierStepCount', {
        filter,
        limit: 0,
        unit: 'count',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'steps',
          value: Math.round(s.quantity),
          unit: 'steps',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Steps: ${e.message}`);
    }

    // Sleep — exclude "in bed" and "awake" segments; count all actual sleep stages
    try {
      const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
        filter,
        limit: 0,
      });
      for (const s of samples) {
        if (
          s.value !== CategoryValueSleepAnalysis.inBed &&
          s.value !== CategoryValueSleepAnalysis.awake
        ) {
          const durationHours = (s.endDate.getTime() - s.startDate.getTime()) / (1000 * 60 * 60);
          healthData.push({
            dataType: 'sleep',
            value: Math.round(durationHours * 10) / 10,
            unit: 'hours',
            recordedAt: s.endDate.toISOString(),
          });
        }
      }
    } catch (e: any) {
      errors.push(`Sleep: ${e.message}`);
    }

    // Blood Pressure — HealthKit stores BP as a correlation; query systolic and
    // diastolic as separate quantity types and pair them by startDate proximity.
    try {
      const [systolicSamples, diastolicSamples] = await Promise.all([
        queryQuantitySamples('HKQuantityTypeIdentifierBloodPressureSystolic', {
          filter,
          limit: 0,
          unit: 'mmHg',
        }),
        queryQuantitySamples('HKQuantityTypeIdentifierBloodPressureDiastolic', {
          filter,
          limit: 0,
          unit: 'mmHg',
        }),
      ]);
      for (const sys of systolicSamples) {
        const dia = diastolicSamples.find(
          (d) => Math.abs(d.startDate.getTime() - sys.startDate.getTime()) < BP_PAIR_TOLERANCE_MS
        );
        healthData.push({
          dataType: 'blood_pressure',
          value: `${Math.round(sys.quantity)}/${Math.round(dia?.quantity ?? 0)}`,
          unit: 'mmHg',
          recordedAt: sys.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Blood pressure: ${e.message}`);
    }

    // SpO2 — HealthKit stores as a fraction (0–1); multiply by 100 for percentage
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierOxygenSaturation', {
        filter,
        limit: 0,
        unit: '%',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'oxygen_saturation',
          value: Math.round(s.quantity * 100),
          unit: '%',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`SpO2: ${e.message}`);
    }

    // Body Temperature
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierBodyTemperature', {
        filter,
        limit: 0,
        unit: 'degC',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'body_temperature',
          value: s.quantity,
          unit: '°C',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Body temp: ${e.message}`);
    }

    // Weight
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', {
        filter,
        limit: 0,
        unit: 'kg',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'weight',
          value: Math.round(s.quantity * 10) / 10,
          unit: 'kg',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Weight: ${e.message}`);
    }

    // Respiratory Rate
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierRespiratoryRate', {
        filter,
        limit: 0,
        unit: 'count/min',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'respiratory_rate',
          value: Math.round(s.quantity),
          unit: 'breaths/min',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Respiratory rate: ${e.message}`);
    }

    // Active Energy Burned
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierActiveEnergyBurned', {
        filter,
        limit: 0,
        unit: 'kcal',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'calories_burned',
          value: Math.round(s.quantity),
          unit: 'kcal',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Calories: ${e.message}`);
    }

    // Body Fat — HealthKit stores as a fraction (0–1); multiply by 100 for percentage
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierBodyFatPercentage', {
        filter,
        limit: 0,
        unit: '%',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'body_fat',
          value: Math.round(s.quantity * 100),
          unit: '%',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Body fat: ${e.message}`);
    }

    // Blood Glucose
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierBloodGlucose', {
        filter,
        limit: 0,
        unit: 'mg/dL',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'blood_glucose',
          value: Math.round(s.quantity),
          unit: 'mg/dL',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Blood glucose: ${e.message}`);
    }

    // Distance Walking/Running
    try {
      const samples = await queryQuantitySamples('HKQuantityTypeIdentifierDistanceWalkingRunning', {
        filter,
        limit: 0,
        unit: 'km',
      });
      for (const s of samples) {
        healthData.push({
          dataType: 'distance',
          value: Math.round(s.quantity * 100) / 100,
          unit: 'km',
          recordedAt: s.endDate.toISOString(),
        });
      }
    } catch (e: any) {
      errors.push(`Distance: ${e.message}`);
    }

    if (healthData.length === 0) {
      return { synced: 0, errors };
    }

    // Group all samples by data type, then sync ALL readings (not just latest).
    // The Vitals API stores arrays (time series), so each reading gets $push'd.
    // Batch by sending one API call per data type with the most recent reading,
    // then follow up with remaining readings in chunks.
    const byType = new Map<string, HealthSample[]>();
    for (const sample of healthData) {
      const arr = byType.get(sample.dataType) || [];
      arr.push(sample);
      byType.set(sample.dataType, arr);
    }

    let totalSynced = 0;

    // Send readings in batches — one call per reading to avoid payload limits
    // but limit to the most recent 50 per type to avoid overwhelming the API
    const MAX_PER_TYPE = 50;
    for (const [dataType, samples] of byType.entries()) {
      const apiField = HEALTHKIT_TO_VITALS_FIELD[dataType];
      if (!apiField) continue;

      // Sort newest first, take up to MAX_PER_TYPE
      const sorted = samples
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
        .slice(0, MAX_PER_TYPE);

      for (const sample of sorted) {
        try {
          await vitalsService.create({
            [apiField]: {
              value: String(sample.value),
              unit: sample.unit,
              updatedAt: sample.recordedAt,
            },
          });
          totalSynced++;
        } catch (e: any) {
          errors.push(`Save ${dataType}: ${e.message}`);
          break; // Stop syncing this type on error
        }
      }
    }

    return { synced: totalSynced, errors };
  },
};
