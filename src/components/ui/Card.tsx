import React from 'react';
import {View, type ViewProps} from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({children, className, ...props}: CardProps) {
  return (
    <View
      className={`bg-card border border-border rounded-3xl p-4 ${className || ''}`}
      {...props}>
      {children}
    </View>
  );
}
