import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Pill, Calendar, ChevronRight, User} from 'lucide-react-native';
import {StatusBadge} from '../ui';
import {colors} from '../../theme/colors';
import {formatDate, formatCurrency} from '../../utils/formatters';
import type {SpecialistPrescription} from '../../types/prescription.types';

interface PrescriptionCardProps {
  prescription: SpecialistPrescription;
  onPress: () => void;
}

export default function PrescriptionCard({prescription, onPress}: PrescriptionCardProps) {
  const specialist = prescription.specialist_id;
  const specialistName =
    typeof specialist === 'object' && specialist?.profile
      ? `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim()
      : null;

  const medicationCount = prescription.items?.length || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Top row: prescription number + status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
            <Pill size={16} color={colors.primary} />
          </View>
          <Text className="text-sm font-bold text-foreground">
            #{prescription.prescription_number || 'RX'}
          </Text>
        </View>
        <StatusBadge status={prescription.status} />
      </View>

      {/* Specialist name */}
      {specialistName && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <User size={13} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {specialistName}
          </Text>
        </View>
      )}

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
        <Text className="text-sm font-bold text-foreground">
          {formatCurrency(prescription.total_amount || 0, prescription.currency || 'NGN')}
        </Text>
      </View>

      {/* Chevron */}
      <View className="absolute right-4 top-1/2" style={{marginTop: -8}}>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}
