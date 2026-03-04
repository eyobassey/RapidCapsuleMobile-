import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Plus, Trash2} from 'lucide-react-native';
import {colors} from '../../theme/colors';

interface ArrayFieldListProps<T> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addLabel?: string;
  maxItems?: number;
  emptyText?: string;
}

export default function ArrayFieldList<T>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = 'Add Item',
  maxItems = 10,
  emptyText,
}: ArrayFieldListProps<T>) {
  return (
    <View style={{gap: 12}}>
      {items.length === 0 && emptyText ? (
        <View
          style={{
            padding: 20,
            backgroundColor: colors.muted,
            borderRadius: 12,
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 13, color: colors.mutedForeground, textAlign: 'center'}}>
            {emptyText}
          </Text>
        </View>
      ) : null}

      {items.map((item, index) => (
        <View
          key={index}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
              #{index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => onRemove(index)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              activeOpacity={0.7}>
              <Trash2 size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
          {renderItem(item, index)}
        </View>
      ))}

      {items.length < maxItems ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAdd}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary,
            borderStyle: 'dashed',
          }}>
          <Plus size={18} color={colors.primary} />
          <Text style={{fontSize: 14, fontWeight: '600', color: colors.primary}}>
            {addLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
