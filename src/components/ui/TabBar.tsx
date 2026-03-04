import React from 'react';
import {ScrollView, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';

interface Tab {
  label: string;
  value: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
}

export default function TabBar({tabs, activeTab, onChange}: TabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      {tabs.map(tab => {
        const isActive = tab.value === activeTab;

        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => onChange(tab.value)}
            activeOpacity={0.7}
            style={[styles.tab, isActive && styles.tabActive]}>
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  contentContainer: {
    flexGrow: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    fontWeight: '700',
    color: colors.foreground,
  },
});
