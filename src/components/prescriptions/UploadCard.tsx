import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {FileImage, Calendar, ChevronRight, Pill} from 'lucide-react-native';
import {StatusBadge} from '../ui';
import {colors} from '../../theme/colors';
import {formatDate} from '../../utils/formatters';
import type {PrescriptionUpload} from '../../types/prescriptionUpload.types';
import {VERIFICATION_STATUS_LABELS} from '../../types/prescriptionUpload.types';

interface UploadCardProps {
  upload: PrescriptionUpload;
  onPress: () => void;
}

export default function UploadCard({upload, onPress}: UploadCardProps) {
  const doctorName = upload.doctor_name || upload.ocr_data?.doctor_name;
  const medCount = upload.ocr_data?.medications?.length || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Top row: icon + status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
            <FileImage size={16} color={colors.primary} />
          </View>
          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
            {doctorName ? `Dr. ${doctorName}` : 'Uploaded Prescription'}
          </Text>
        </View>
        <StatusBadge status={upload.verification_status} />
      </View>

      {/* Medication count */}
      {medCount > 0 && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <Pill size={13} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground">
            {medCount} medication{medCount !== 1 ? 's' : ''} detected
          </Text>
        </View>
      )}

      {/* Date */}
      <View className="flex-row items-center gap-1.5 mb-3">
        <Calendar size={13} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground">
          {formatDate(upload.created_at)}
        </Text>
      </View>

      {/* Bottom row: validity */}
      <View className="flex-row items-center justify-between pt-3 border-t border-border">
        <Text className="text-xs text-muted-foreground">
          {VERIFICATION_STATUS_LABELS[upload.verification_status] || upload.verification_status}
        </Text>
        {upload.valid_until && (
          <Text className="text-xs text-muted-foreground">
            Valid until {formatDate(upload.valid_until)}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <View style={{position: 'absolute', right: 16, top: '50%', marginTop: -8}}>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}
