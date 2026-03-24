import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Text } from './Text';

function toYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str: string): Date {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date();
  }
  const [y = 0, m = 0, d = 0] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? new Date() : date;
}

interface DatePickerInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePickerInput({
  label,
  placeholder = 'YYYY-MM-DD',
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DatePickerInputProps) {
  const [show, setShow] = useState(false);
  const displayDate = value ? parseDate(value) : new Date();

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(toYYYYMMDD(selectedDate));
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'android') {
      setShow(true);
    } else {
      setShow(true);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  if (Platform.OS === 'android') {
    return (
      <View>
        {label && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: `${colors.foreground}B3`,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            {label}
          </Text>
        )}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
          }}
        >
          <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: 12 }} />
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              color: value ? colors.foreground : colors.mutedForeground,
            }}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            value={displayDate}
            mode="date"
            display="default"
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
        )}
      </View>
    );
  }

  // iOS: wrap in Modal for consistent UX
  return (
    <View>
      {label && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: `${colors.foreground}B3`,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
        }}
      >
        <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: 12 }} />
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: value ? colors.foreground : colors.mutedForeground,
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={handleClose}
        >
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 34,
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                {label || 'Select date'}
              </Text>
            </View>
            <DateTimePicker
              value={displayDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              style={{ height: 200 }}
            />
            <TouchableOpacity
              onPress={handleClose}
              style={{
                marginHorizontal: 20,
                marginTop: 8,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.white }}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
