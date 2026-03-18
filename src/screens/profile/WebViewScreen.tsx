import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Text } from '../../components/ui/Text';
import { colors } from '../../theme/colors';

type RouteParams = {
  title: string;
  url: string;
};

export default function WebViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { title, url } = route.params as RouteParams;
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="h-14 bg-card border-b border-border flex-row items-center px-4 gap-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-9 h-9 rounded-full bg-background border border-border items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="flex-1 font-semibold text-base text-foreground" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <WebView
        source={{ uri: url }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1, backgroundColor: colors.background }}
      />

      {loading && (
        <View className="absolute inset-0 top-14 items-center justify-center bg-background">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}
