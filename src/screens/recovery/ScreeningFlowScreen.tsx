import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';
import type {ScreeningQuestion} from '../../types/recovery.types';

export default function ScreeningFlowScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {instrument, questions} = route.params as {
    instrument: string;
    questions: ScreeningQuestion[];
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const canGoNext = question && answers[question.id] !== undefined;
  const isLast = currentIndex === totalQuestions - 1;

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {toValue: 0, duration: 150, useNativeDriver: true}).start(() => {
      callback();
      Animated.timing(fadeAnim, {toValue: 1, duration: 150, useNativeDriver: true}).start();
    });
  };

  const goNext = () => {
    if (isLast) {
      handleSubmit();
    } else {
      animateTransition(() => setCurrentIndex(i => i + 1));
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      animateTransition(() => setCurrentIndex(i => i - 1));
    }
  };

  const selectAnswer = (value: number) => {
    setAnswers(prev => ({...prev, [question.id]: value}));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const duration_ms = Date.now() - startTime.current;
      const result = await recoveryService.submitScreening(instrument, answers, duration_ms);
      navigation.replace('ScreeningResult', {
        screeningId: result._id,
        result,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit screening.');
      setSubmitting(false);
    }
  };

  if (!question) return null;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header
        title={instrument.toUpperCase()}
        onBack={() => {
          Alert.alert('Leave Screening?', 'Your progress will be lost.', [
            {text: 'Stay', style: 'cancel'},
            {text: 'Leave', style: 'destructive', onPress: () => navigation.goBack()},
          ]);
        }}
      />

      {/* Progress bar */}
      <View style={{paddingHorizontal: 16, paddingTop: 8}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6}}>
          <Text style={{fontSize: 11, color: colors.mutedForeground, fontWeight: '600'}}>
            Question {currentIndex + 1} of {totalQuestions}
          </Text>
          <Text style={{fontSize: 11, color: colors.primary, fontWeight: '600'}}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={{height: 4, backgroundColor: colors.muted, borderRadius: 2}}>
          <View
            style={{
              height: 4,
              width: `${progress}%`,
              backgroundColor: colors.primary,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      {/* Question content */}
      <Animated.View style={{flex: 1, padding: 20, opacity: fadeAnim}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.foreground,
            lineHeight: 26,
            marginBottom: 24,
          }}>
          {question.text}
        </Text>

        {/* Options */}
        <View style={{gap: 10}}>
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.7}
                onPress={() => selectAnswer(option.value)}
                style={{
                  backgroundColor: isSelected ? `${colors.primary}12` : colors.card,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: 14,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.mutedForeground,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isSelected && (
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? '600' : '400',
                      color: colors.foreground,
                    }}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Navigation buttons */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: currentIndex > 0 ? colors.card : colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ChevronLeft
            size={20}
            color={currentIndex > 0 ? colors.foreground : colors.mutedForeground}
          />
        </TouchableOpacity>

        <View style={{flex: 1}}>
          <Button
            variant="primary"
            onPress={goNext}
            disabled={!canGoNext || submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : isLast ? (
              'Submit'
            ) : (
              'Next'
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
