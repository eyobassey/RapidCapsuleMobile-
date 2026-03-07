import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Pill, Calendar, ChevronRight, User, Upload, ShoppingCart} from 'lucide-react-native';
import {StatusBadge} from '../ui';
import {colors} from '../../theme/colors';
import {formatDate} from '../../utils/formatters';
import {useCurrency} from '../../hooks/useCurrency';

interface PrescriptionCardProps {
  prescription: any;
  onPress: () => void;
}

export default function PrescriptionCard({prescription, onPress}: PrescriptionCardProps) {
  const {format} = useCurrency();

  const type = prescription.type;
  const specialist = prescription.specialist_id;
  const prescribedBy = prescription.prescribed_by;

  let doctorName: string | null = null;
  if (typeof specialist === 'object' && specialist?.profile) {
    doctorName = `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim();
  } else if (typeof prescribedBy === 'object' && prescribedBy?.profile) {
    doctorName = `${prescribedBy.profile.first_name || ''} ${prescribedBy.profile.last_name || ''}`.trim();
  } else if (prescription.ocr_data?.doctor_name) {
    doctorName = `Dr. ${prescription.ocr_data.doctor_name}`;
  }

  const medicationCount = prescription.items?.length || 0;

  const sourceLabel =
    type === 'ORDER'
      ? 'Pharmacy Order'
      : prescription.prescription_source === 'patient_upload'
        ? 'Uploaded'
        : doctorName || 'Specialist';

  const IconComponent =
    type === 'ORDER' ? ShoppingCart : prescription.prescription_source === 'patient_upload' ? Upload : Pill;
  const iconColor =
    type === 'ORDER' ? colors.accent : prescription.prescription_source === 'patient_upload' ? colors.secondary : colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Top row: prescription number + status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{backgroundColor: `${iconColor}15`}}>
            <IconComponent size={16} color={iconColor} />
          </View>
          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
            #{prescription.prescription_number || 'RX'}
          </Text>
        </View>
        <StatusBadge status={prescription.status} />
      </View>

      {/* Source / Doctor name */}
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <User size={13} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {sourceLabel}
        </Text>
      </View>

      {/* Date */}
      <View className="flex-row items-center gap-1.5 mb-3">
        <Calendar size={13} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground">
          {formatDate(prescription.created_at)}
        </Text>
      </View>

      {/* Bottom row: medication count + total cost */}
      <View className="flex-row items-center justify-between pt-3 border-t border-border">
        <Text className="text-xs text-muted-foreground">
          {medicationCount} medication{medicationCount !== 1 ? 's' : ''}
        </Text>
        {prescription.total_amount ? (
          <Text className="text-sm font-bold text-foreground">
            {format(prescription.total_amount)}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <View style={{position: 'absolute', right: 16, top: '50%', marginTop: -8}}>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}
