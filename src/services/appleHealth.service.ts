import { Platform } from 'react-native';
import AppleHealthKit, {
  type HealthInputOptions,
  type HealthKitPermissions,
  type HealthValue,
} from 'react-native-health';
import { healthIntegrationsService } from './healthIntegrations.service';

function hasHealthKitModule(): boolean {
  // `react-native-health` is iOS-only and can be absent if pods not installed or module not linked.
  return (
    Platform.OS === 'ios' &&
    typeof (AppleHealthKit as any)?.initHealthKit === 'function' &&
    !!(AppleHealthKit as any)?.Constants?.Permissions
  );
}

function buildPermissions(): HealthKitPermissions {
  const P = (AppleHealthKit as any)?.Constants?.Permissions;
  return {
    permissions: {
      read: [
        P?.HeartRate,
        P?.StepCount,
        P?.SleepAnalysis,
        P?.BloodPressureSystolic,
        P?.BloodPressureDiastolic,
        P?.OxygenSaturation,
        P?.BodyTemperature,
        P?.Weight,
        P?.Height,
        P?.RespiratoryRate,
        P?.ActiveEnergyBurned,
        P?.BodyFatPercentage,
        P?.BloodGlucose,
        P?.DistanceWalkingRunning,
      ].filter(Boolean),
      write: [],
    },
  };
}

function promisify<T>(
  fn: (options: any, callback: (err: string, results: T) => void) => void,
  options: any
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
    return hasHealthKitModule();
  },

  async isSupported(): Promise<boolean> {
    if (!hasHealthKitModule()) return false;

    const isAvailableFn = (AppleHealthKit as any)?.isAvailable;
    if (typeof isAvailableFn !== 'function') {
      // Some versions don't expose this; best-effort fallback.
      return true;
    }

    return new Promise((resolve) => {
      try {
        isAvailableFn((err: any, available: boolean) => {
          if (err) resolve(false);
          else resolve(!!available);
        });
      } catch {
        resolve(false);
      }
    });
  },

  async requestPermissions(): Promise<boolean> {
    // `initHealthKit` is the permission request step for react-native-health.
    return this.initialize();
  },

  async initialize(): Promise<boolean> {
    if (!hasHealthKitModule()) {
      console.warn('HealthKit not available (module missing or not linked).');
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(buildPermissions(), (err: string) => {
        if (err) {
          console.warn('HealthKit init error:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  async fetchAndSync(): Promise<{ synced: number; errors: string[] }> {
    if (!hasHealthKitModule()) {
      return { synced: 0, errors: ['HealthKit not available (module missing or not linked)'] };
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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
        options
      );
      samples.forEach((s) => {
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

    return { synced: healthData.length, errors };
  },
};
