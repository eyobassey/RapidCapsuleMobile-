import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Calendar, Clock, Video, Phone, MapPin, MessageSquare} from 'lucide-react-native';
import {Avatar, StatusBadge, Button} from '../ui';
import {colors} from '../../theme/colors';
import {formatDate, formatTime} from '../../utils/formatters';
import {useCurrency} from '../../hooks/useCurrency';
import {MEETING_CHANNEL_LABELS} from '../../utils/constants';

interface AppointmentCardProps {
  appointment: any;
  onPress: () => void;
  onJoin?: () => void;
}

const channelIcons: Record<string, React.ReactNode> = {
  zoom: <Video size={14} color={colors.primary} />,
  google_meet: <Video size={14} color={colors.primary} />,
  microsoft_teams: <Video size={14} color={colors.primary} />,
  whatsapp: <MessageSquare size={14} color={colors.success} />,
  phone: <Phone size={14} color={colors.secondary} />,
  in_person: <MapPin size={14} color={colors.accent} />,
};

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function AppointmentCard({
  appointment,
  onPress,
  onJoin,
}: AppointmentCardProps) {
  const {format} = useCurrency();
  const specialist = appointment.specialist_id || appointment.specialist || {};
  const profile = specialist.profile || {};
  const specialistName = profile.first_name
    ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
    : specialist.name || 'Specialist';
  const specialty =
    appointment.specialist_category?.name ||
    specialist.specialist_category?.name ||
    appointment.specialty ||
    'General Practice';
  const channel = appointment.meeting_channel || 'zoom';
  const fee = appointment.appointment_fee || appointment.consultation_fee || appointment.fee || 0;
  const status = appointment.status || 'OPEN';
  const isUpcoming = status === 'OPEN' || status === 'ONGOING' || status === 'RESCHEDULED';
  const dateStr = appointment.start_time || appointment.date || appointment.appointment_date;
  const showJoin = isUpcoming && dateStr && isToday(dateStr);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Top row: Avatar + Name + Status */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 gap-3">
          <Avatar
            uri={profile.profile_photo || profile.profile_image}
            firstName={profile.first_name}
            lastName={profile.last_name}
            size="md"
          />
          <View className="flex-1">
            <Text className="text-foreground font-bold text-sm" numberOfLines={1}>
              {specialistName}
            </Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>

      {/* Second row: Specialty + Channel */}
      <View className="flex-row items-center gap-4 mb-3">
        <Text className="text-muted-foreground text-xs">{specialty}</Text>
        <View className="flex-row items-center gap-1">
          {channelIcons[channel] || <Video size={14} color={colors.mutedForeground} />}
          <Text className="text-muted-foreground text-xs">
            {MEETING_CHANNEL_LABELS[channel] || channel}
          </Text>
        </View>
      </View>

      {/* Third row: Date + Time */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1.5">
          <Calendar size={14} color={colors.mutedForeground} />
          <Text className="text-foreground text-xs">
            {formatDate(appointment.start_time || appointment.date || appointment.appointment_date || appointment.createdAt)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Clock size={14} color={colors.mutedForeground} />
          <Text className="text-foreground text-xs">
            {formatTime(appointment.start_time || appointment.time || appointment.appointment_time || '00:00')}
          </Text>
        </View>
      </View>

      {/* Bottom row: Fee + Actions */}
      <View className="flex-row items-center justify-between">
        <Text className="text-primary font-bold text-sm">
          {format(fee)}
        </Text>
        <View className="flex-row items-center gap-2">
          {showJoin && onJoin && (
            <TouchableOpacity
              onPress={onJoin}
              activeOpacity={0.7}
              className="bg-primary px-4 py-2 rounded-xl">
              <Text className="text-white text-xs font-bold">Join</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="bg-muted px-4 py-2 rounded-xl">
            <Text className="text-foreground text-xs font-bold">View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
