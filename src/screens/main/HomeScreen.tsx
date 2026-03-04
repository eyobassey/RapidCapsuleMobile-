import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Stethoscope,
  Pill,
  Calendar,
  Activity,
  BrainCircuit,
} from 'lucide-react-native';
import Svg, {Circle} from 'react-native-svg';
import {useAuthStore} from '../../store/auth';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';

export default function HomeScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<any>();
  const firstName = user?.profile?.first_name || 'User';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Health score ring
  const healthScore = 82;
  const circumference = 2 * Math.PI * 45;
  const scoreOffset = circumference - (healthScore / 100) * circumference;

  // Profile completion
  const profileProgress = 66;
  const profileCirc = 2 * Math.PI * 16;
  const profileOffset = profileCirc - (profileProgress / 100) * profileCirc;

  const quickActions = [
    {icon: <Stethoscope size={24} color="#0ea5e9" />, label: 'Checkup', bg: 'bg-sky-500/10'},
    {icon: <Pill size={24} color="#10b981" />, label: 'Pharmacy', bg: 'bg-emerald-500/10'},
    {icon: <Calendar size={24} color="#818cf8" />, label: 'Book Appt', bg: 'bg-indigo-500/10'},
    {icon: <Activity size={24} color="#f43f5e" />, label: 'Log Vitals', bg: 'bg-rose-500/10'},
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-2 pb-4 px-6 bg-card border-b border-border flex-row justify-between items-center">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full border-2 border-primary/30 overflow-hidden">
            {user?.profile?.profile_image ? (
              <Image
                source={{uri: user.profile.profile_image}}
                className="w-full h-full rounded-full"
              />
            ) : (
              <View className="w-full h-full rounded-full bg-muted items-center justify-center">
                <Text className="text-foreground font-bold text-sm">
                  {firstName[0]}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text className="text-xs text-muted-foreground font-medium">
              {greeting()},
            </Text>
            <Text className="text-sm font-bold text-foreground">{firstName}</Text>
          </View>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-muted items-center justify-center border border-border relative">
          <Bell size={20} color={colors.foreground} />
          <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-28">
        {/* Health Score Orb */}
        <View className="bg-card px-6 py-8 border-b border-border items-center overflow-hidden relative">
          <View className="absolute top-0 right-0 w-64 h-64 bg-success/10 rounded-full opacity-50" />
          <View className="w-32 h-32 items-center justify-center mb-4">
            <Svg width={128} height={128} viewBox="0 0 100 100" style={{transform: [{rotate: '-90deg'}], position: 'absolute'}}>
              <Circle cx={50} cy={50} r={45} fill="none" stroke={colors.background} strokeWidth={6} />
              <Circle
                cx={50}
                cy={50}
                r={45}
                fill="none"
                stroke={colors.success}
                strokeWidth={6}
                strokeDasharray={circumference}
                strokeDashoffset={scoreOffset}
                strokeLinecap="round"
              />
            </Svg>
            <View className="items-center">
              <Text className="text-3xl font-bold text-foreground leading-none">{healthScore}</Text>
              <Text className="text-[10px] font-bold text-success uppercase tracking-wider">Excellent</Text>
            </View>
          </View>
          <Text className="text-sm text-foreground/70 text-center max-w-[250px]">
            Your health score is looking great today. Keep up the good work!
          </Text>
        </View>

        {/* Quick Stats Bar */}
        <View className="flex-row border-b border-border bg-background">
          {[
            {value: '1', label: 'Upcoming'},
            {value: '2', label: 'Rx Active'},
            {value: '45', label: 'AI Credits', highlight: true},
          ].map((stat, i) => (
            <View key={i} className={`flex-1 p-3 items-center ${i < 2 ? 'border-r border-border' : ''}`}>
              <Text className={`text-xl font-bold ${stat.highlight ? 'text-primary' : 'text-foreground'}`}>
                {stat.value}
              </Text>
              <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Profile Completion Banner */}
        <TouchableOpacity className="mx-4 mt-6 bg-card border border-border rounded-2xl p-4 flex-row items-center gap-4">
          <View className="w-12 h-12 items-center justify-center">
            <Svg width={48} height={48} viewBox="0 0 36 36" style={{transform: [{rotate: '-90deg'}]}}>
              <Circle cx={18} cy={18} r={16} fill="none" stroke={colors.background} strokeWidth={4} />
              <Circle
                cx={18}
                cy={18}
                r={16}
                fill="none"
                stroke={colors.secondary}
                strokeWidth={4}
                strokeDasharray={profileCirc}
                strokeDashoffset={profileOffset}
                strokeLinecap="round"
              />
            </Svg>
            <Text className="absolute text-xs font-bold text-foreground">{profileProgress}%</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-sm text-foreground">Complete your profile</Text>
            <Text className="text-[10px] text-muted-foreground leading-tight">
              Add medical history to get personalized insights.
            </Text>
          </View>
          <ChevronRight size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View className="p-4 gap-6">
          {/* Quick Actions */}
          <View>
            <Text className="font-bold text-foreground mb-3 px-1">Quick Actions</Text>
            <View className="flex-row gap-3">
              {quickActions.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  className="flex-1 items-center gap-2 bg-card border border-border py-3 rounded-2xl">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${item.bg}`}>
                    {item.icon}
                  </View>
                  <Text className="text-[10px] font-bold text-foreground/80">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Eka AI CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Eka')}
            activeOpacity={0.8}
            className="rounded-3xl bg-card border border-border p-5 overflow-hidden relative">
            <View className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full opacity-60" />
            <View className="flex-row gap-4 items-center relative z-10">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center"
                style={{backgroundColor: colors.primary}}>
                <BrainCircuit size={28} color={colors.white} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base text-foreground mb-1">Consult Eka AI</Text>
                <Text className="text-[11px] text-muted-foreground leading-relaxed">
                  Check symptoms or analyze your prescriptions instantly.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Next Appointment */}
          <View>
            <Text className="font-bold text-foreground mb-3 px-1">Next Appointment</Text>
            <View className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex-row gap-4 items-center overflow-hidden relative">
              <View className="absolute right-0 top-0 w-24 h-full bg-accent/10" />
              <View className="w-14 h-14 rounded-2xl bg-background items-center justify-center border border-accent/20">
                <Text className="text-xs font-bold text-accent uppercase">Oct</Text>
                <Text className="text-lg font-bold text-accent leading-none">12</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-foreground">Dr. Marcus Chen</Text>
                <Text className="text-xs text-muted-foreground">General Cardiology - Video Call</Text>
                <Text className="text-xs font-bold text-accent mt-1">Tomorrow, 10:00 AM</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
