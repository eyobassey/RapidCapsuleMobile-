import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  FileImage,
  User,
  Building2,
  Pill,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  ShoppingCart,
} from 'lucide-react-native';

import { usePrescriptionUploadStore } from '../../store/prescriptionUpload';
import { Header, StatusBadge, Button, Skeleton, Text, TextInput } from '../../components/ui';
import { colors } from '../../theme/colors';
import { formatDate } from '../../utils/formatters';
import { VERIFICATION_STATUS_LABELS } from '../../types/prescriptionUpload.types';
import type { PharmacyStackParamList } from '../../navigation/stacks/PharmacyStack';

export default function UploadDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PharmacyStackParamList, 'UploadDetail'>>();
  const { uploadId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showClarification, setShowClarification] = useState(false);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationImage, setClarificationImage] = useState<string | null>(null);

  const {
    currentUpload: upload,
    isLoading,
    fetchUploadById,
    retryVerification,
    deleteUpload,
    submitClarification,
  } = usePrescriptionUploadStore();

  useEffect(() => {
    fetchUploadById(uploadId);
  }, [uploadId, fetchUploadById]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUploadById(uploadId);
    setRefreshing(false);
  };

  const handleRetry = async () => {
    setActionLoading('retry');
    try {
      await retryVerification(uploadId);
      Alert.alert('Retry Started', 'Verification has been restarted.');
    } catch {
      Alert.alert('Error', 'Failed to retry verification.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this uploaded prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('delete');
            try {
              await deleteUpload(uploadId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete prescription.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // Loading
  if (isLoading && !upload) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Prescription Detail" onBack={() => navigation.goBack()} />
        <ScrollView className="flex-1 px-5 pt-4">
          <Skeleton height={200} borderRadius={16} className="mb-4" />
          <Skeleton height={60} borderRadius={16} className="mb-4" />
          <Skeleton height={120} borderRadius={16} className="mb-4" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!upload) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Prescription Detail" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center p-8">
          <FileImage size={40} color={colors.mutedForeground} />
          <Text className="text-lg font-bold text-foreground mt-4">Prescription not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = upload.verification_status;
  const ocr = upload.ocr_data;
  const result = upload.verification_result;
  const imageUrl = upload.presigned_url || upload.prescription_image;

  const canRetry = ['TIER1_FAILED', 'TIER2_FAILED', 'REJECTED'].includes(status);
  const canDelete = ['PENDING', 'TIER1_FAILED', 'TIER2_FAILED', 'REJECTED', 'EXPIRED'].includes(
    status
  );
  const needsClarification = status === 'CLARIFICATION_NEEDED';
  const isApproved = status === 'APPROVED';

  const handleSubmitClarification = async () => {
    if (!clarificationText.trim()) {
      Alert.alert('Required', 'Please enter a response.');
      return;
    }
    setActionLoading('clarify');
    try {
      const formData = new FormData();
      formData.append('message', clarificationText.trim());
      if (clarificationImage) {
        formData.append('image', {
          uri: clarificationImage,
          type: 'image/jpeg',
          name: 'clarification.jpg',
        } as any);
      }
      await submitClarification(uploadId, formData);
      setShowClarification(false);
      setClarificationText('');
      setClarificationImage(null);
      Alert.alert('Submitted', 'Your clarification has been sent for review.');
    } catch {
      Alert.alert('Error', 'Failed to submit clarification.');
    } finally {
      setActionLoading(null);
    }
  };

  const pickClarificationImage = () => {
    Alert.alert('Add Image', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera(
            { mediaType: 'photo', quality: 0.8, maxWidth: 2000, maxHeight: 2000 },
            (res) => {
              if (res.assets?.[0]?.uri) setClarificationImage(res.assets[0].uri);
            }
          ),
      },
      {
        text: 'Gallery',
        onPress: () =>
          launchImageLibrary(
            { mediaType: 'photo', quality: 0.8, maxWidth: 2000, maxHeight: 2000 },
            (res) => {
              if (res.assets?.[0]?.uri) setClarificationImage(res.assets[0].uri);
            }
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleOrderFromPrescription = () => {
    const meds = ocr?.medications || [];
    if (meds.length === 0) {
      Alert.alert('No Medications', 'No medications were detected in this prescription.');
      return;
    }
    // Navigate to pharmacy search with first medication name pre-filled
    navigation.navigate('Pharmacy', {
      screen: 'DrugSearch',
      params: { query: meds[0]?.name || '' },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Prescription Detail" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Prescription Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-56" resizeMode="cover" />
        ) : (
          <View className="w-full h-56 bg-muted items-center justify-center">
            <FileImage size={56} color={colors.mutedForeground} />
          </View>
        )}

        {/* Status Banner */}
        <View
          style={{
            backgroundColor: isApproved
              ? `${colors.success}20`
              : needsClarification
              ? `${colors.secondary}20`
              : canRetry
              ? `${colors.destructive}20`
              : `${colors.primary}20`,
            marginHorizontal: 20,
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {isApproved ? (
            <CheckCircle size={24} color={colors.success} />
          ) : canRetry ? (
            <XCircle size={24} color={colors.destructive} />
          ) : needsClarification ? (
            <AlertTriangle size={24} color={colors.secondary} />
          ) : (
            <Clock size={24} color={colors.primary} />
          )}
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-bold text-foreground">
              {VERIFICATION_STATUS_LABELS[status] || status}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Uploaded {formatDate(upload.created_at)}
            </Text>
          </View>
          <StatusBadge status={status} size="md" />
        </View>

        {/* Clarification Request */}
        {needsClarification && upload.clarification_request && (
          <View className="mx-5 mt-4 bg-secondary/10 border border-secondary/30 rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <MessageSquare size={16} color={colors.secondary} />
              <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                Clarification Requested
              </Text>
            </View>
            <Text className="text-sm text-foreground">{upload.clarification_request.message}</Text>
          </View>
        )}

        {/* OCR Extracted Data */}
        {ocr && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
              Extracted Information
            </Text>

            {(ocr.doctor_name || upload.doctor_name) && (
              <View className="flex-row items-center gap-2 mb-2">
                <User size={14} color={colors.mutedForeground} />
                <Text className="text-sm text-foreground">
                  Dr. {ocr.doctor_name || upload.doctor_name}
                </Text>
              </View>
            )}

            {ocr.clinic_name && (
              <View className="flex-row items-center gap-2 mb-2">
                <Building2 size={14} color={colors.mutedForeground} />
                <Text className="text-sm text-foreground">{ocr.clinic_name}</Text>
              </View>
            )}

            {ocr.date && (
              <View className="flex-row items-center gap-2 mb-2">
                <Clock size={14} color={colors.mutedForeground} />
                <Text className="text-sm text-muted-foreground">Prescription date: {ocr.date}</Text>
              </View>
            )}

            {/* Medications */}
            {ocr.medications && ocr.medications.length > 0 && (
              <View className="mt-2 pt-3 border-t border-border">
                <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                  Medications ({ocr.medications.length})
                </Text>
                {ocr.medications.map((med, idx) => (
                  <View key={idx} className="bg-muted rounded-xl p-3 mb-2">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Pill size={14} color={colors.primary} />
                      <Text className="text-sm font-semibold text-foreground">
                        {med.name || 'Unknown medication'}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2 ml-6">
                      {med.dosage && (
                        <Text className="text-xs text-muted-foreground">Dosage: {med.dosage}</Text>
                      )}
                      {med.frequency && (
                        <Text className="text-xs text-muted-foreground">{med.frequency}</Text>
                      )}
                      {med.quantity && (
                        <Text className="text-xs text-muted-foreground">Qty: {med.quantity}</Text>
                      )}
                      {med.duration && (
                        <Text className="text-xs text-muted-foreground">{med.duration}</Text>
                      )}
                    </View>
                    {med.instructions && (
                      <Text className="text-xs text-muted-foreground italic ml-6 mt-1">
                        {med.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Verification Results */}
        {result && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
              Verification Results
            </Text>

            {/* Tier 1 */}
            {result.tier1_result && (
              <View className="mb-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <ShieldCheck size={14} color={colors.primary} />
                  <Text className="text-sm font-semibold text-foreground">
                    Tier 1: OCR Analysis
                  </Text>
                </View>
                {result.tier1_result.ocr_confidence != null && (
                  <Text className="text-xs text-muted-foreground ml-6">
                    Confidence: {Math.round(result.tier1_result.ocr_confidence * 100)}%
                  </Text>
                )}
                {result.tier1_result.issues && result.tier1_result.issues.length > 0 && (
                  <View className="ml-6 mt-1">
                    {result.tier1_result.issues.map((issue, idx) => (
                      <Text key={idx} className="text-xs text-destructive">
                        {'\u2022'} {issue}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Tier 2 */}
            {result.tier2_result && (
              <View className="mb-3 pt-3 border-t border-border">
                <View className="flex-row items-center gap-2 mb-1">
                  <ShieldAlert size={14} color={colors.primary} />
                  <Text className="text-sm font-semibold text-foreground">
                    Tier 2: AI Validation
                  </Text>
                </View>
                {result.tier2_result.ai_confidence != null && (
                  <Text className="text-xs text-muted-foreground ml-6">
                    Confidence: {Math.round(result.tier2_result.ai_confidence * 100)}%
                  </Text>
                )}
                {result.tier2_result.fraud_detection?.is_suspicious && (
                  <View className="ml-6 mt-1 flex-row items-center gap-1">
                    <AlertTriangle size={12} color={colors.destructive} />
                    <Text className="text-xs text-destructive font-medium">Flagged for review</Text>
                  </View>
                )}
                {result.tier2_result.clinical_validation?.issues &&
                  result.tier2_result.clinical_validation.issues.length > 0 && (
                    <View className="ml-6 mt-1">
                      {result.tier2_result.clinical_validation.issues.map((issue, idx) => (
                        <Text key={idx} className="text-xs text-muted-foreground">
                          {'\u2022'} {issue}
                        </Text>
                      ))}
                    </View>
                  )}
              </View>
            )}

            {/* Review Notes */}
            {result.review_notes && (
              <View className="pt-3 border-t border-border">
                <Text className="text-xs font-semibold text-foreground mb-1">Reviewer Notes</Text>
                <Text className="text-xs text-muted-foreground">{result.review_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Validity */}
        {(upload.valid_from || upload.valid_until) && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Validity
            </Text>
            {upload.valid_from && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-muted-foreground">Valid From</Text>
                <Text className="text-sm text-foreground">{formatDate(upload.valid_from)}</Text>
              </View>
            )}
            {upload.valid_until && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Valid Until</Text>
                <Text className="text-sm text-foreground">{formatDate(upload.valid_until)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {(canRetry || canDelete || needsClarification || isApproved) && (
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
          <View className="flex-row gap-3">
            {canDelete && (
              <View className="flex-1">
                <Button
                  variant="outline"
                  icon={<Trash2 size={16} color={colors.destructive} />}
                  onPress={handleDelete}
                  loading={actionLoading === 'delete'}
                  disabled={!!actionLoading}
                >
                  <Text className="text-destructive font-bold">Delete</Text>
                </Button>
              </View>
            )}
            {canRetry && (
              <View className="flex-1">
                <Button
                  variant="primary"
                  icon={<RotateCcw size={16} color="#fff" />}
                  onPress={handleRetry}
                  loading={actionLoading === 'retry'}
                  disabled={!!actionLoading}
                >
                  Retry
                </Button>
              </View>
            )}
            {needsClarification && (
              <View className="flex-1">
                <Button
                  variant="primary"
                  icon={<MessageSquare size={16} color="#fff" />}
                  onPress={() => setShowClarification(true)}
                >
                  Respond
                </Button>
              </View>
            )}
            {isApproved && (
              <View className="flex-1">
                <Button
                  variant="primary"
                  icon={<ShoppingCart size={16} color="#fff" />}
                  onPress={handleOrderFromPrescription}
                >
                  Order Medications
                </Button>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Clarification Response Modal */}
      <Modal
        visible={showClarification}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClarification(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowClarification(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 40,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  marginBottom: 4,
                }}
              >
                Respond to Clarification
              </Text>
              {upload?.clarification_request?.message && (
                <View
                  style={{
                    backgroundColor: `${colors.secondary}15`,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.secondary,
                      marginBottom: 4,
                    }}
                  >
                    Request:
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    {upload.clarification_request.message}
                  </Text>
                </View>
              )}

              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 14,
                  fontSize: 14,
                  color: colors.foreground,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  marginBottom: 12,
                }}
                placeholder="Provide additional information..."
                placeholderTextColor={colors.mutedForeground}
                value={clarificationText}
                onChangeText={setClarificationText}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={pickClarificationImage}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Camera size={16} color={colors.primary} />
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                    {clarificationImage ? 'Change Image' : 'Add Image'}
                  </Text>
                </TouchableOpacity>
                {clarificationImage && (
                  <Image
                    source={{ uri: clarificationImage }}
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                  />
                )}
              </View>

              <Button
                variant="primary"
                onPress={handleSubmitClarification}
                loading={actionLoading === 'clarify'}
              >
                Submit Response
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
