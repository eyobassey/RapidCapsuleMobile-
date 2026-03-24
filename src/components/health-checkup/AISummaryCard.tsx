import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Lightbulb,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { Text } from '../ui/Text';

interface ConditionExplained {
  condition: string;
  explanation: string;
  urgency: string;
}

interface SummaryContent {
  overview: string;
  key_findings: string[];
  possible_conditions_explained: ConditionExplained[];
  recommendations: string[];
  when_to_seek_care: string;
  lifestyle_tips?: string[];
}

interface AISummaryCardProps {
  summary: {
    generated_at?: string;
    content?: SummaryContent;
    error?: string;
  } | null;
  loading: boolean;
  onGenerate: () => void;
  credits?: { available: boolean; remaining_credits?: number; has_unlimited?: boolean } | null;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  emergency: { color: colors.destructive, label: 'Emergency' },
  urgent: { color: colors.destructive, label: 'Urgent' },
  soon: { color: colors.secondary, label: 'See Soon' },
  routine: { color: colors.success, label: 'Routine' },
};

export default function AISummaryCard({
  summary,
  loading,
  onGenerate,
  credits,
  expanded = true,
  onToggleExpand,
}: AISummaryCardProps) {
  const content = summary?.content;

  // Loading state
  if (loading) {
    return (
      <View
        style={{
          backgroundColor: `${colors.primary}08`,
          borderWidth: 1,
          borderColor: `${colors.primary}25`,
          borderRadius: 20,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 8 }}>
          Generating AI Summary...
        </Text>
        <Text
          style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4, textAlign: 'center' }}
        >
          Our AI is analyzing your checkup results
        </Text>
      </View>
    );
  }

  // No summary — show generate button
  if (!content) {
    return (
      <View
        style={{
          backgroundColor: `${colors.primary}08`,
          borderWidth: 1,
          borderColor: `${colors.primary}25`,
          borderRadius: 20,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrainCircuit size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.foreground }}>
              AI Health Summary
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
              Get a detailed analysis powered by Claude AI
            </Text>
          </View>
        </View>

        {summary?.error ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <AlertCircle size={14} color={colors.destructive} />
            <Text style={{ fontSize: 12, color: colors.destructive, flex: 1 }}>
              {summary.error}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onGenerate}
          disabled={credits?.available === false}
          style={{
            backgroundColor: credits?.available === false ? colors.muted : colors.primary,
            borderRadius: 14,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Sparkles
            size={16}
            color={credits?.available === false ? colors.mutedForeground : colors.white}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: credits?.available === false ? colors.mutedForeground : colors.white,
            }}
          >
            Generate AI Summary
          </Text>
        </TouchableOpacity>

        {credits && !credits.has_unlimited && credits.remaining_credits != null && (
          <Text
            style={{
              fontSize: 10,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            {credits.remaining_credits} credit{credits.remaining_credits !== 1 ? 's' : ''} remaining
          </Text>
        )}
      </View>
    );
  }

  // Has summary — show it
  return (
    <View
      style={{
        backgroundColor: `${colors.primary}08`,
        borderWidth: 1,
        borderColor: `${colors.primary}25`,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleExpand}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 16,
          paddingBottom: expanded ? 12 : 16,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BrainCircuit size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.foreground }}>
            AI Health Summary
          </Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 1 }}>
            Powered by Claude AI
          </Text>
        </View>
        {onToggleExpand &&
          (expanded ? (
            <ChevronUp size={18} color={colors.mutedForeground} />
          ) : (
            <ChevronDown size={18} color={colors.mutedForeground} />
          ))}
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {/* Overview */}
          <Text
            style={{ fontSize: 13, color: colors.foreground, lineHeight: 20, marginBottom: 16 }}
          >
            {content.overview}
          </Text>

          {/* Key Findings */}
          {content.key_findings?.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={14} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: colors.foreground,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Key Findings
                </Text>
              </View>
              {content.key_findings.map((finding, i) => (
                <View
                  key={i}
                  style={{ flexDirection: 'row', gap: 8, marginBottom: 4, paddingLeft: 4 }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 1 }}>•</Text>
                  <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18, flex: 1 }}>
                    {finding}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Conditions Explained */}
          {content.possible_conditions_explained?.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={14} color={colors.secondary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: colors.foreground,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Conditions Explained
                </Text>
              </View>
              {content.possible_conditions_explained.map((item, i) => {
                const urgency = URGENCY_CONFIG[item.urgency] ?? {
                  color: colors.success,
                  label: 'Routine',
                };
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: 'bold',
                          color: colors.foreground,
                          flex: 1,
                        }}
                      >
                        {item.condition}
                      </Text>
                      <View
                        style={{
                          backgroundColor: `${urgency.color}15`,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: urgency.color }}>
                          {urgency.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
                      {item.explanation}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recommendations */}
          {content.recommendations?.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Lightbulb size={14} color={colors.accent} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: colors.foreground,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Recommendations
                </Text>
              </View>
              {content.recommendations.map((rec, i) => (
                <View
                  key={i}
                  style={{ flexDirection: 'row', gap: 8, marginBottom: 4, paddingLeft: 4 }}
                >
                  <Text style={{ fontSize: 12, color: colors.accent, marginTop: 1 }}>•</Text>
                  <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18, flex: 1 }}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* When to Seek Care */}
          {content.when_to_seek_care && (
            <View
              style={{
                backgroundColor: `${colors.destructive}10`,
                borderWidth: 1,
                borderColor: `${colors.destructive}25`,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Clock size={14} color={colors.destructive} />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.destructive }}>
                  When to Seek Care
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>
                {content.when_to_seek_care}
              </Text>
            </View>
          )}

          {/* Lifestyle Tips */}
          {content.lifestyle_tips && content.lifestyle_tips.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Heart size={14} color={colors.success} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: colors.foreground,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Lifestyle Tips
                </Text>
              </View>
              {content.lifestyle_tips.map((tip, i) => (
                <View
                  key={i}
                  style={{ flexDirection: 'row', gap: 8, marginBottom: 4, paddingLeft: 4 }}
                >
                  <Text style={{ fontSize: 12, color: colors.success, marginTop: 1 }}>•</Text>
                  <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18, flex: 1 }}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
