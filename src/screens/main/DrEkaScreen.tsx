import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  CalendarCheck,
  ChevronRight,
  Eye,
  Heart,
  Lightbulb,
  MapPin,
  Newspaper,
  Pill,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, Skeleton } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import {
  useDigestHistoryQuery,
  useGenerateDigestMutation,
  useGenerateWeeklyReportMutation,
  useLatestWeeklyReportQuery,
  useTodaysDigestQuery,
  useWeeklyReportsQuery,
} from '../../hooks/queries';
import type {
  DailyDigest,
  DigestItem,
  DigestItemType,
  DigestPriority,
  WeeklyReport,
} from '../../services/drEka.service';
import { colors } from '../../theme/colors';
import { formatDate, timeAgo } from '../../utils/formatters';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<DigestPriority, string> = {
  urgent: '#f43f5e',
  high: '#f59e0b',
  medium: '#0ea5e9',
  low: '#10b981',
};

const PRIORITY_LABELS: Record<DigestPriority, string> = {
  urgent: 'Urgent',
  high: 'High Priority',
  medium: 'Info',
  low: 'Tip',
};

const TYPE_ICONS: Record<DigestItemType, React.ElementType> = {
  observation: Eye,
  recommendation: Lightbulb,
  medication: Pill,
  follow_up: CalendarCheck,
  onboarding: UserCheck,
  drug_interaction: AlertTriangle,
  recovery: ShieldCheck,
  travel: MapPin,
  health_news: Newspaper,
  motivation: Heart,
};

const TYPE_LABELS: Record<DigestItemType, string> = {
  observation: 'Observation',
  recommendation: 'Recommendation',
  medication: 'Medication',
  follow_up: 'Follow-up',
  onboarding: 'Getting Started',
  drug_interaction: 'Drug Interaction',
  recovery: 'Recovery',
  travel: 'Travel',
  health_news: 'Health News',
  motivation: 'Motivation',
};

type TabKey = 'today' | 'history' | 'reports';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'history', label: 'History' },
  { key: 'reports', label: 'Reports' },
];

// ─── Helper: extract numeric score from number or object ──────────────────────

function extractScore(score: any): number | null {
  if (score == null) return null;
  if (typeof score === 'number') return score;
  if (typeof score === 'object' && score.current != null) return score.current;
  return null;
}

function getScoreColor(score: any): string {
  const val = extractScore(score);
  if (val == null) return '#94a3b8';
  if (val >= 80) return '#10b981';
  if (val >= 60) return '#0ea5e9';
  if (val >= 40) return '#f59e0b';
  return '#f43f5e';
}

// ─── Digest Item Card ─────────────────────────────────────────────────────────

function DigestItemCard({ item }: { item: DigestItem }) {
  const IconComp = TYPE_ICONS[item.type] || Eye;
  const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.low;
  const typeLabel = TYPE_LABELS[item.type] || item.type;

  return (
    <View className="mx-5 mb-3 bg-card border border-border rounded-2xl p-4">
      {/* Priority + Type row */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor }} />
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: priorityColor }}
          >
            {PRIORITY_LABELS[item.priority] || 'Info'}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
          <IconComp size={12} color={colors.mutedForeground} />
          <Text className="text-[10px] font-medium text-muted-foreground">{typeLabel}</Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-sm font-bold text-foreground mb-1.5">{item.title}</Text>

      {/* Content */}
      <Text className="text-xs text-muted-foreground leading-relaxed">{item.content}</Text>

      {/* Action Button */}
      {item.action_text && (
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={item.action_text}
          className="bg-primary rounded-xl py-2.5 mt-3 flex-row items-center justify-center gap-1.5"
        >
          <Text className="text-xs font-bold text-white">{item.action_text}</Text>
          <ChevronRight size={14} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Health Joke Card ─────────────────────────────────────────────────────────

function HealthJokeCard({ joke }: { joke: string }) {
  return (
    <View
      className="mx-5 mb-3 rounded-2xl p-4 border"
      style={{
        backgroundColor: '#f59e0b12',
        borderColor: '#f59e0b30',
      }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-base">😄</Text>
        <Text className="text-xs font-bold" style={{ color: '#f59e0b' }}>
          Dr. Eka's Health Joke
        </Text>
      </View>
      <Text className="text-xs leading-relaxed" style={{ color: '#fbbf24' }}>
        {joke}
      </Text>
    </View>
  );
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function DigestSkeleton() {
  return (
    <View className="mx-5 mb-3 bg-card border border-border rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width={80} height={12} />
        <Skeleton width={90} height={20} borderRadius={10} />
      </View>
      <Skeleton width="85%" height={14} />
      <View className="mt-2">
        <Skeleton width="100%" height={10} />
      </View>
      <View className="mt-1">
        <Skeleton width="65%" height={10} />
      </View>
    </View>
  );
}

// ─── Dr. Eka Greeting Card ───────────────────────────────────────────────────

function DrEkaGreetingCard({ summary }: { summary?: string }) {
  return (
    <View className="mx-5 mt-2 mb-4 bg-card border border-primary/20 rounded-3xl p-5 overflow-hidden relative">
      {/* Decorative orbs */}
      <View className="absolute -top-8 -right-8 w-32 h-32 bg-primary/8 rounded-full" />
      <View className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/5 rounded-full" />

      <View className="flex-row items-center gap-4 relative z-10">
        {/* Avatar */}
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <Text className="text-2xl">🩺</Text>
        </View>

        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">Dr. Eka</Text>
          <Text className="text-[11px] font-medium text-primary mt-0.5">
            Your Personal AI Physician
          </Text>
        </View>
      </View>

      {summary ? (
        <View className="mt-4 bg-background/40 rounded-xl p-3 relative z-10">
          <Text className="text-xs text-muted-foreground leading-relaxed">{summary}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({
  activeTab,
  onChangeTab,
}: {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}) {
  return (
    <View className="flex-row mx-5 mb-4 bg-muted rounded-2xl p-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onChangeTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="flex-1 py-2.5 rounded-xl items-center justify-center"
            style={isActive ? { backgroundColor: colors.primary } : undefined}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: isActive ? colors.white : colors.mutedForeground }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Today Tab Content ────────────────────────────────────────────────────────

function TodayTab() {
  const { data: digest, isLoading, refetch } = useTodaysDigestQuery();
  const generateMutation = useGenerateDigestMutation();

  const items = digest?.items || [];
  const hasDigest = items.length > 0;

  const handleGenerate = useCallback(() => {
    generateMutation.mutate();
  }, [generateMutation]);

  if (isLoading) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <DigestSkeleton />
        <DigestSkeleton />
        <DigestSkeleton />
      </ScrollView>
    );
  }

  if (!hasDigest) {
    return (
      <View className="flex-1 items-center justify-center px-10">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <Sparkles size={36} color={colors.primary} />
        </View>
        <Text className="text-base font-bold text-foreground text-center mb-2">
          No digest for today yet
        </Text>
        <Text className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
          Dr. Eka will analyze your health data and create a personalized daily digest.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleGenerate}
          disabled={generateMutation.isPending}
          className="bg-primary rounded-2xl py-3.5 px-8 flex-row items-center gap-2"
        >
          {generateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <RefreshCw size={16} color={colors.white} />
          )}
          <Text className="text-sm font-bold text-white">
            {generateMutation.isPending ? 'Generating...' : "Generate Today's Digest"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {items.map((item, idx) => (
        <DigestItemCard key={`${item.type}-${idx}`} item={item} />
      ))}
      {digest?.health_joke ? <HealthJokeCard joke={digest.health_joke} /> : null}
    </ScrollView>
  );
}

// ─── History Tab Content ──────────────────────────────────────────────────────

function HistoryTab() {
  const [page] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading, refetch } = useDigestHistoryQuery(page);

  const digests = data?.digests || [];

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 px-5 pt-2">
        <DigestSkeleton />
        <DigestSkeleton />
        <DigestSkeleton />
      </View>
    );
  }

  if (digests.length === 0) {
    return (
      <EmptyState
        icon={<Star size={40} color={colors.mutedForeground} />}
        title="No digest history"
        subtitle="Your daily digests will appear here once Dr. Eka generates them."
      />
    );
  }

  return (
    <FlatList
      data={digests}
      keyExtractor={(item: DailyDigest) => item._id}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      renderItem={({ item }: { item: DailyDigest }) => {
        const isExpanded = expandedId === item._id;
        const itemCount = item.items?.length || 0;

        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleExpand(item._id)}
            className="mx-5 mb-3 bg-card border border-border rounded-2xl overflow-hidden"
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-sm font-bold text-foreground">
                  {formatDate(item.created_at)}
                </Text>
                <View className="bg-primary/10 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-semibold text-primary">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              <Text
                className="text-xs text-muted-foreground leading-relaxed"
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.summary}
              </Text>
              <Text className="text-[10px] text-muted-foreground/60 mt-1.5">
                {timeAgo(item.created_at)}
              </Text>
            </View>

            {isExpanded && item.items && (
              <View className="border-t border-border px-4 pt-3 pb-4">
                {item.items.map((digestItem, idx) => {
                  const IconComp = TYPE_ICONS[digestItem.type] || Eye;
                  const priorityColor = PRIORITY_COLORS[digestItem.priority] || PRIORITY_COLORS.low;
                  return (
                    <View key={idx} className="flex-row items-start gap-3 mb-3 last:mb-0">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
                        style={{ backgroundColor: `${priorityColor}1A` }}
                      >
                        <IconComp size={14} color={priorityColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-foreground">
                          {digestItem.title}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                          {digestItem.content}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {item.health_joke && (
                  <View className="mt-2 rounded-xl p-3" style={{ backgroundColor: '#f59e0b12' }}>
                    <Text className="text-[10px] leading-relaxed" style={{ color: '#fbbf24' }}>
                      😄 {item.health_joke}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Weekly Report Detail ─────────────────────────────────────────────────────

function WeeklyReportDetail({ report, onClose }: { report: WeeklyReport; onClose: () => void }) {
  const scoreColor =
    extractScore(report.health_score) != null ? getScoreColor(report.health_score) : colors.primary;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onClose}
        className="mx-5 mb-4 flex-row items-center gap-1"
      >
        <ChevronRight
          size={16}
          color={colors.primary}
          style={{ transform: [{ rotate: '180deg' }] }}
        />
        <Text className="text-xs font-semibold text-primary">Back to Reports</Text>
      </TouchableOpacity>

      {/* Health Score */}
      {extractScore(report.health_score) != null && (
        <View className="mx-5 mb-4 bg-card border border-border rounded-2xl p-5 items-center">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Health Score
          </Text>
          <View
            className="w-20 h-20 rounded-full items-center justify-center border-4"
            style={{ borderColor: scoreColor }}
          >
            <Text className="text-2xl font-bold" style={{ color: scoreColor }}>
              {extractScore(report.health_score)}
            </Text>
          </View>
        </View>
      )}

      {/* Summary */}
      {report.summary && (
        <View className="mx-5 mb-4 bg-card border border-border rounded-2xl p-4">
          <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Summary
          </Text>
          <Text className="text-xs text-muted-foreground leading-relaxed">{report.summary}</Text>
        </View>
      )}

      {/* Medications */}
      {report.medications && report.medications.length > 0 && (
        <View className="mx-5 mb-4 bg-card border border-border rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Pill size={14} color={colors.primary} />
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
              Medications
            </Text>
          </View>
          {report.medications.map((med: any, idx: number) => (
            <View key={idx} className="flex-row items-start gap-2 mb-2 last:mb-0">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <Text className="text-xs text-muted-foreground flex-1 leading-relaxed">
                {typeof med === 'string' ? med : med.name || med.title || JSON.stringify(med)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <View className="mx-5 mb-4 bg-card border border-border rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Lightbulb size={14} color="#f59e0b" />
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
              Recommendations
            </Text>
          </View>
          {report.recommendations.map((rec: any, idx: number) => {
            const recText =
              typeof rec === 'string' ? rec : rec.title || rec.text || rec.content || '';
            const recDetail = typeof rec === 'object' ? rec.detail || rec.description || '' : '';
            return (
              <View key={idx} className="mb-3 last:mb-0">
                <View className="flex-row items-start gap-2">
                  <View
                    className="w-1.5 h-1.5 rounded-full mt-1.5"
                    style={{ backgroundColor: '#f59e0b' }}
                  />
                  <Text className="text-xs text-foreground font-semibold flex-1">{recText}</Text>
                </View>
                {recDetail ? (
                  <Text className="text-[10px] text-muted-foreground ml-3.5 mt-0.5 leading-relaxed">
                    {recDetail}
                  </Text>
                ) : null}
                {typeof rec === 'object' && rec.action_text && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="ml-3.5 mt-1.5 bg-primary/10 rounded-lg py-1.5 px-3 self-start"
                  >
                    <Text className="text-[10px] font-semibold text-primary">
                      {rec.action_text}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Health News */}
      {report.health_news && report.health_news.length > 0 && (
        <View className="mx-5 mb-4 bg-card border border-border rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Newspaper size={14} color={colors.accent} />
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
              Health News
            </Text>
          </View>
          {report.health_news.map((news: any, idx: number) => (
            <View key={idx} className="mb-2.5 last:mb-0">
              <Text className="text-xs text-foreground font-semibold">
                {typeof news === 'string' ? news : news.title || news.headline || ''}
              </Text>
              {typeof news === 'object' && (news.summary || news.content) && (
                <Text className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {news.summary || news.content}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Doctor's Note */}
      {report.doctors_note && (
        <View
          className="mx-5 mb-4 rounded-2xl p-4 border"
          style={{
            backgroundColor: `${colors.primary}08`,
            borderColor: `${colors.primary}25`,
          }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-base">🩺</Text>
            <Text className="text-xs font-bold text-primary uppercase tracking-wider">
              Doctor's Note
            </Text>
          </View>
          <Text className="text-xs leading-relaxed italic" style={{ color: colors.foreground }}>
            "{report.doctors_note}"
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Reports Tab Content ──────────────────────────────────────────────────────

function ReportsTab() {
  const [page] = useState(1);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const { data: latestReport } = useLatestWeeklyReportQuery();
  const { data, isLoading, refetch } = useWeeklyReportsQuery(page);
  const generateMutation = useGenerateWeeklyReportMutation();

  const reports = useMemo(() => {
    const list = data?.reports || [];
    // Ensure latest report is included if not in the list (only if it has an _id)
    if (latestReport?._id && !list.find((r: WeeklyReport) => r._id === latestReport._id)) {
      return [latestReport, ...list];
    }
    return list;
  }, [data?.reports, latestReport]);

  if (selectedReport) {
    return <WeeklyReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 px-5 pt-2">
        <DigestSkeleton />
        <DigestSkeleton />
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-10">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.accent}15` }}
        >
          <Star size={36} color={colors.accent} />
        </View>
        <Text className="text-base font-bold text-foreground text-center mb-2">
          No weekly reports yet
        </Text>
        <Text className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
          Dr. Eka will compile a comprehensive weekly health report for you.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="bg-primary rounded-2xl py-3.5 px-8 flex-row items-center gap-2"
        >
          {generateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <RefreshCw size={16} color={colors.white} />
          )}
          <Text className="text-sm font-bold text-white">
            {generateMutation.isPending ? 'Generating...' : 'Generate Weekly Report'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={reports}
      keyExtractor={(item: WeeklyReport) => item._id}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      renderItem={({ item }: { item: WeeklyReport }) => {
        const scoreColor =
          extractScore(item.health_score) != null
            ? getScoreColor(item.health_score)
            : colors.mutedForeground;
        const safeFormatDate = (d: any) => {
          if (!d) return '';
          const parsed = new Date(d);
          return isNaN(parsed.getTime()) ? '' : formatDate(d);
        };
        const dateRange =
          item.week_start && item.week_end
            ? `${safeFormatDate(item.week_start)} - ${safeFormatDate(item.week_end)}`
            : safeFormatDate(item.created_at) || 'Recent';

        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedReport(item)}
            className="mx-5 mb-3 bg-card border border-border rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-medium text-muted-foreground">{dateRange}</Text>
              {extractScore(item.health_score) != null && (
                <View
                  className="rounded-full px-3 py-1 flex-row items-center gap-1.5"
                  style={{ backgroundColor: `${scoreColor}1A` }}
                >
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: scoreColor }} />
                  <Text className="text-xs font-bold" style={{ color: scoreColor }}>
                    {extractScore(item.health_score)}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-sm font-bold text-foreground mb-1">Weekly Health Report</Text>
            <Text className="text-xs text-muted-foreground leading-relaxed" numberOfLines={3}>
              {item.summary}
            </Text>

            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-[10px] text-muted-foreground/60">
                {timeAgo(item.created_at)}
              </Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-[10px] font-semibold text-primary">View Report</Text>
                <ChevronRight size={12} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DrEkaScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const { data: digest } = useTodaysDigestQuery();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Dr. Eka" onBack={() => navigation.goBack()} />

      {/* Greeting card — only show on today tab */}
      {activeTab === 'today' && <DrEkaGreetingCard summary={digest?.summary} />}

      {/* Tab bar */}
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'today' && <TodayTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </SafeAreaView>
  );
}
