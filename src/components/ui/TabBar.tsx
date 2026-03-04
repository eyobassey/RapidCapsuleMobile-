import React from 'react';
import {ScrollView, TouchableOpacity, Text} from 'react-native';

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
      className="bg-card border border-border rounded-xl p-1"
      contentContainerStyle={{flexGrow: 1}}>
      {tabs.map(tab => {
        const isActive = tab.value === activeTab;

        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => onChange(tab.value)}
            activeOpacity={0.7}
            className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
              isActive ? 'bg-background shadow-sm' : ''
            }`}>
            <Text
              className={`text-sm ${
                isActive
                  ? 'font-bold text-foreground'
                  : 'font-medium text-muted-foreground'
              }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
