import React from 'react';
import {View, Image, TouchableOpacity, Dimensions, StatusBar} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {X} from 'lucide-react-native';
import {colors} from '../../theme/colors';

const {width, height} = Dimensions.get('window');

export default function MediaPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {url, type} = route.params as {url: string; type: string};

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <StatusBar barStyle="light-content" />

      {/* Close button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Close preview"
        style={{
          position: 'absolute',
          top: 50,
          right: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <X size={20} color="#fff" />
      </TouchableOpacity>

      {/* Image */}
      {type === 'image' && (
        <Image
          source={{uri: url}}
          style={{width, height, resizeMode: 'contain'}}
          accessibilityRole="image"
          accessibilityLabel="Full size image preview"
        />
      )}
    </View>
  );
}
