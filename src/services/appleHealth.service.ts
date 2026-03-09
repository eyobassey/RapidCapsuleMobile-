import {Platform} from 'react-native';
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
  HealthInputOptions,
} from 'react-native-health';
import {healthIntegrationsService} from './healthIntegrations.service';

// Data types we want to read from HealthKit
const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.BodyTemperature,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
    ],
    write: [],
  },
};

function promisify<T>(
  fn: (options: any, callback: (err: string, results: T) => void) => void,
  options: any,
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(options, (err: string, results: T) => {
      if (err) reject(new Error(err));
      else resolve(results);
    });
  });
}

export const appleHealthService = {
  isAvailable(): boolean {
    return Platform.OS === 'ios';
  },

  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
        if (err) {
          console.warn('HealthKit init error:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  async fetchAndSync(): Promise<{synced: number; errors: string[]}> {
    if (!this.isAvailable()) {
      return {synced: 0, errors: ['Not available on this platform']};
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    const healthData: any[] = [];
    const errors: string[] = [];

    // Heart Rate
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getHeartRateSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'heart_rate',
          value: s.value,
          unit: 'bpm',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Heart rate: ${e.message}`);
    }

    // Steps
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getDailyStepCountSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'steps',
          value: s.value,
          unit: 'steps',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Steps: ${e.message}`);
    }

    // Sleep
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getSleepSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        healthData.push({
          dataType: 'sleep',
          value: Math.round(hours * 10) / 10,
          unit: 'hours',
          recordedAt: s.endDate,
        });
      });
    } catch (e: any) {
      errors.push(`Sleep: ${e.message}`);
    }

    // Blood Pressure
    try {
      const samples = await promisify<any[]>(
        AppleHealthKit.getBloodPressureSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'blood_pressure',
          value: `${s.bloodPressureSystolicValue}/${s.bloodPressureDiastolicValue}`,
          unit: 'mmHg',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Blood pressure: ${e.message}`);
    }

    // SpO2
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getOxygenSaturationSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'oxygen_saturation',
          value: Math.round(s.value * 100),
          unit: '%',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`SpO2: ${e.message}`);
    }

    // Body Temperature
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getBodyTemperatureSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'body_temperature',
          value: s.value,
          unit: '°C',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Body temp: ${e.message}`);
    }

    // Weight
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getWeightSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'weight',
          value: Math.round(s.value * 10) / 10,
          unit: 'kg',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Weight: ${e.message}`);
    }

    // Respiratory Rate
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getRespiratoryRateSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'respiratory_rate',
          value: s.value,
          unit: 'breaths/min',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Respiratory rate: ${e.message}`);
    }

    // Calories Burned
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getActiveEnergyBurned.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'calories_burned',
          value: Math.round(s.value),
          unit: 'kcal',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Calories: ${e.message}`);
    }

    // Body Fat
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getBodyFatPercentageSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'body_fat',
          value: Math.round(s.value * 100),
          unit: '%',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Body fat: ${e.message}`);
    }

    // Blood Glucose
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getBloodGlucoseSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'blood_glucose',
          value: s.value,
          unit: 'mg/dL',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Blood glucose: ${e.message}`);
    }

    // Distance
    try {
      const samples = await promisify<HealthValue[]>(
        AppleHealthKit.getDailyDistanceWalkingRunningSamples.bind(AppleHealthKit),
        options,
      );
      samples.forEach(s => {
        healthData.push({
          dataType: 'distance',
          value: Math.round(s.value * 100) / 100,
          unit: 'km',
          recordedAt: s.endDate || s.startDate,
        });
      });
    } catch (e: any) {
      errors.push(`Distance: ${e.message}`);
    }

    // Push to backend
    if (healthData.length > 0) {
      try {
        await healthIntegrationsService.pushAppleHealthData({
          provider: 'apple_health',
          data: healthData,
        });
      } catch (e: any) {
        errors.push(`Push to backend: ${e.message}`);
      }
    }

    return {synced: healthData.length, errors};
  },
};
