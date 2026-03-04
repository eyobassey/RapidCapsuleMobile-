import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import {Check, ChevronDown} from 'lucide-react-native';
import {colors} from '../../theme/colors';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectPickerProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
}

export default function SelectPicker({
  label,
  required,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  error,
}: SelectPickerProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find(
    o => o.value === value || o.value.toLowerCase() === value?.toLowerCase?.(),
  );

  return (
    <View>
      {label ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: `${colors.foreground}B3`,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}>
          {label}
          {required ? (
            <Text style={{color: colors.destructive}}> *</Text>
          ) : null}
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          paddingHorizontal: 16,
        }}>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: selected ? colors.foreground : colors.mutedForeground,
          }}
          numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {error ? (
        <Text style={{fontSize: 11, color: colors.destructive, marginTop: 4, marginLeft: 4}}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}>
        <Pressable
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}
          onPress={() => setVisible(false)}>
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '60%',
              paddingBottom: 34,
            }}
            onPress={() => {}}>
            {/* Handle bar */}
            <View style={{alignItems: 'center', paddingTop: 12, paddingBottom: 8}}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.foreground,
                paddingHorizontal: 20,
                paddingBottom: 12,
              }}>
              {label || 'Select'}
            </Text>

            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({item}) => {
                const isSelected =
                  item.value === value ||
                  item.value.toLowerCase() === value?.toLowerCase?.();
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onChange(item.value);
                      setVisible(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      backgroundColor: isSelected
                        ? `${colors.primary}15`
                        : 'transparent',
                    }}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: isSelected ? colors.primary : colors.foreground,
                        fontWeight: isSelected ? '600' : '400',
                      }}>
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <Check size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
