import React from 'react';
import {View, Text, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../../components/ui';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({navigation}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Background glow effects */}
      <View className="absolute -top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full opacity-40" />
      <View className="absolute -bottom-20 -right-20 w-72 h-72 bg-secondary/20 rounded-full opacity-40" />

      {/* Center content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <View className="w-32 h-32 mb-8 items-center justify-center">
          <View className="absolute w-full h-full bg-primary/30 rounded-3xl opacity-50" />
          <Image
            source={require('../../../assets/logo.png')}
            accessibilityRole="image"
            accessibilityLabel="RapidCapsule logo"
            className="w-24 h-24"
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text className="font-bold text-4xl text-foreground tracking-tight mb-2 text-center">
          Rapid<Text className="text-primary">Capsule</Text>
        </Text>
        <Text className="text-foreground/70 text-base font-medium max-w-xs text-center leading-relaxed">
          The clinical-grade, AI-powered health platform built for everyone.
        </Text>
      </View>

      {/* Bottom CTAs */}
      <View className="px-6 pb-8 gap-3">
        <Button onPress={() => navigation.navigate('Signup')}>
          Create Patient Account
        </Button>
        <Button variant="outline" onPress={() => navigation.navigate('Login')}>
          Sign In to Account
        </Button>
      </View>
    </SafeAreaView>
  );
}
