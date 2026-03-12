import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  Camera,
  ImageIcon,
  Upload,
  CheckCircle,
  Circle,
  Loader,
  XCircle,
  FileSearch,
  Brain,
  ShieldCheck,
} from 'lucide-react-native';

import { usePrescriptionUploadStore } from '../../store/prescriptionUpload';
import { Header, Input, Button, Text } from '../../components/ui';
import { colors } from '../../theme/colors';
import { isTerminalStatus } from '../../types/prescriptionUpload.types';
import type { VerificationStatus } from '../../types/prescriptionUpload.types';

// ── Verification pipeline steps ──

const PIPELINE_STEPS = [
  { key: 'upload', label: 'Uploaded', icon: Upload },
  { key: 'ocr', label: 'OCR Processing', icon: FileSearch },
  { key: 'ai', label: 'AI Analysis', icon: Brain },
  { key: 'result', label: 'Verification Result', icon: ShieldCheck },
];

function getStepState(
  status: VerificationStatus,
  stepKey: string
): 'done' | 'active' | 'pending' | 'failed' {
  const statusMap: Record<string, Record<string, 'done' | 'active' | 'pending' | 'failed'>> = {
    PENDING: { upload: 'done', ocr: 'pending', ai: 'pending', result: 'pending' },
    TIER1_PROCESSING: { upload: 'done', ocr: 'active', ai: 'pending', result: 'pending' },
    TIER1_PASSED: { upload: 'done', ocr: 'done', ai: 'pending', result: 'pending' },
    TIER1_FAILED: { upload: 'done', ocr: 'failed', ai: 'pending', result: 'pending' },
    TIER2_PROCESSING: { upload: 'done', ocr: 'done', ai: 'active', result: 'pending' },
    TIER2_PASSED: { upload: 'done', ocr: 'done', ai: 'done', result: 'pending' },
    TIER2_FAILED: { upload: 'done', ocr: 'done', ai: 'failed', result: 'pending' },
    PHARMACIST_REVIEW: { upload: 'done', ocr: 'done', ai: 'done', result: 'active' },
    CLARIFICATION_NEEDED: { upload: 'done', ocr: 'done', ai: 'done', result: 'active' },
    CLARIFICATION_RECEIVED: { upload: 'done', ocr: 'done', ai: 'done', result: 'active' },
    APPROVED: { upload: 'done', ocr: 'done', ai: 'done', result: 'done' },
    REJECTED: { upload: 'done', ocr: 'done', ai: 'done', result: 'failed' },
    EXPIRED: { upload: 'done', ocr: 'done', ai: 'done', result: 'failed' },
  };
  return statusMap[status]?.[stepKey] || 'pending';
}

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' | 'failed' }) {
  if (state === 'done') return <CheckCircle size={20} color={colors.success} />;
  if (state === 'active') return <Loader size={20} color={colors.primary} />;
  if (state === 'failed') return <XCircle size={20} color={colors.destructive} />;
  return <Circle size={20} color={colors.mutedForeground} />;
}

export default function UploadPrescriptionScreen() {
  const navigation = useNavigation<any>();
  const { uploadPrescription, fetchVerification, isUploading } = usePrescriptionUploadStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Image Picker ──
  const pickFromCamera = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.8, maxWidth: 2000, maxHeight: 2000 },
      (response) => {
        if (response.assets?.[0]?.uri) {
          setImageUri(response.assets[0].uri);
        }
      }
    );
  };

  const pickFromGallery = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 2000, maxHeight: 2000 },
      (response) => {
        if (response.assets?.[0]?.uri) {
          setImageUri(response.assets[0].uri);
        }
      }
    );
  };

  // ── Upload ──
  const handleUpload = async () => {
    if (!imageUri) return;

    const formData = new FormData();
    formData.append('prescription', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'prescription.jpg',
    } as any);
    if (doctorName.trim()) {
      formData.append('doctor_name', doctorName.trim());
    }

    try {
      const data = await uploadPrescription(formData);
      setUploadId(data._id);
      setVerificationStatus(data.verification_status || 'PENDING');
    } catch (err: any) {
      Alert.alert(
        'Upload Failed',
        err?.response?.data?.message || err?.message || 'Could not upload prescription.'
      );
    }
  };

  // ── Verification Polling ──
  const pollVerification = useCallback(async () => {
    if (!uploadId) return;
    const data = await fetchVerification(uploadId);
    if (data) {
      const status = (data.final_status || 'PENDING') as VerificationStatus;
      setVerificationStatus(status);
      if (isTerminalStatus(status) && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [uploadId, fetchVerification]);

  useEffect(() => {
    if (uploadId && verificationStatus && !isTerminalStatus(verificationStatus)) {
      pollingRef.current = setInterval(pollVerification, 3000);
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [uploadId, verificationStatus, pollVerification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const isVerifying = !!uploadId;

  // ── State: Verification Progress ──
  if (isVerifying && verificationStatus) {
    const isTerminal = isTerminalStatus(verificationStatus);
    const isApproved = verificationStatus === 'APPROVED';

    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Verification" onBack={() => navigation.goBack()} />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-lg font-bold text-foreground text-center mb-2">
            Prescription Verification
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-8">
            Your prescription is being verified by our AI system.
          </Text>

          {/* Pipeline Steps */}
          <View className="bg-card border border-border rounded-2xl p-5">
            {PIPELINE_STEPS.map((step, idx) => {
              const state = getStepState(verificationStatus, step.key);
              const Icon = step.icon;
              const isLast = idx === PIPELINE_STEPS.length - 1;

              return (
                <View key={step.key}>
                  <View className="flex-row items-center gap-3">
                    <StepIcon state={state} />
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-semibold ${
                          state === 'done'
                            ? 'text-success'
                            : state === 'active'
                            ? 'text-primary'
                            : state === 'failed'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </Text>
                    </View>
                    <Icon
                      size={18}
                      color={
                        state === 'done'
                          ? colors.success
                          : state === 'active'
                          ? colors.primary
                          : state === 'failed'
                          ? colors.destructive
                          : colors.mutedForeground
                      }
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={{
                        width: 2,
                        height: 24,
                        marginLeft: 9,
                        backgroundColor: state === 'done' ? colors.success : colors.border,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Result message */}
          {isTerminal && (
            <View
              className={`mt-6 rounded-2xl p-4 ${
                isApproved ? 'bg-success/10' : 'bg-destructive/10'
              }`}
            >
              <Text
                className={`text-sm font-bold text-center ${
                  isApproved ? 'text-success' : 'text-destructive'
                }`}
              >
                {isApproved
                  ? 'Prescription Approved!'
                  : verificationStatus === 'CLARIFICATION_NEEDED'
                  ? 'Clarification Needed'
                  : verificationStatus === 'PHARMACIST_REVIEW'
                  ? 'Under Pharmacist Review'
                  : 'Verification Failed'}
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">
                {isApproved
                  ? 'Your prescription has been verified and is ready to use.'
                  : verificationStatus === 'CLARIFICATION_NEEDED'
                  ? 'Additional information is needed. Check the details page.'
                  : verificationStatus === 'PHARMACIST_REVIEW'
                  ? 'A pharmacist is reviewing your prescription.'
                  : 'Please check the details or retry.'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        {isTerminal && (
          <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button variant="outline" onPress={() => navigation.navigate('MyUploads')}>
                  My Prescriptions
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  variant="primary"
                  onPress={() => navigation.replace('UploadDetail', { uploadId })}
                >
                  View Details
                </Button>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── State: Uploading ──
  if (isUploading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Upload Prescription" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-base font-semibold text-foreground mt-4">
            Uploading Prescription...
          </Text>
          <Text className="text-sm text-muted-foreground mt-1 text-center">
            Please wait while we upload your prescription image.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── State: Select Image ──
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Upload Prescription" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-muted-foreground mb-4">
          Take a photo or select an image of your prescription for AI-powered verification.
        </Text>

        {/* Camera / Gallery Buttons */}
        {!imageUri && (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={pickFromCamera}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Take a photo of prescription"
              className="flex-1 bg-card border border-border rounded-2xl p-6 items-center"
            >
              <Camera size={32} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground mt-3">Camera</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Take a photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFromGallery}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Choose image from gallery"
              className="flex-1 bg-card border border-border rounded-2xl p-6 items-center"
            >
              <ImageIcon size={32} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground mt-3">Gallery</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Choose image</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image Preview */}
        {imageUri && (
          <View className="mb-4">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-64 rounded-2xl"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => setImageUri(null)}
              className="mt-2 self-center"
              accessibilityRole="button"
              accessibilityLabel="Change prescription image"
            >
              <Text className="text-sm text-primary font-semibold">Change Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Doctor Name (optional) */}
        {imageUri && (
          <View className="mb-6">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Doctor Name (Optional)
            </Text>
            <Input
              placeholder="Enter prescribing doctor's name"
              value={doctorName}
              onChangeText={setDoctorName}
            />
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      {imageUri && (
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
          <Button variant="primary" icon={<Upload size={18} color="#fff" />} onPress={handleUpload}>
            Upload Prescription
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
