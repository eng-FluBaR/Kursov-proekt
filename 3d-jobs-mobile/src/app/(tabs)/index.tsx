import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppMenu } from '@/components/app-menu';
import { PreviewHint } from '@/components/preview-hint';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, formatDuration, Job, TimeEntry } from '@/lib/api';
import { previewJobs, previewTimeEntries } from '@/lib/preview-data';

const colors = ['#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#a78bfa', '#60a5fa'];

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(new Date(value));
}

export default function AnalyticsScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!token) {
      setEntries(previewTimeEntries);
      setJobs(previewJobs);
      setIsLoading(false);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const [entriesResponse, jobsResponse] = await Promise.all([
        apiRequest<{ timeEntries: TimeEntry[]; entries?: TimeEntry[] }>('/api/mobile/time-entries', { token }),
        apiRequest<{ jobs: Job[] }>('/api/mobile/time-entries?status=all&ownOnly=true', { token }),
      ]);

      setEntries(entriesResponse.entries ?? entriesResponse.timeEntries ?? []);
      setJobs(jobsResponse.jobs);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const taskTypeRows = useMemo(() => {
    const totals = new Map<string, number>();

    for (const entry of entries) {
      const name = entry.taskTypeName ?? 'Other';
      totals.set(name, (totals.get(name) ?? 0) + (entry.durationMinutes ?? 0));
    }

    return Array.from(totals.entries())
      .map(([name, minutes], index) => ({ name, minutes, color: colors[index % colors.length] }))
      .sort((left, right) => right.minutes - left.minutes);
  }, [entries]);

  const recentDayRows = useMemo(() => {
    const totals = new Map<string, { label: string; minutes: number }>();

    for (const entry of entries) {
      const key = entry.startedAt.slice(0, 10);
      const current = totals.get(key) ?? { label: shortDate(entry.startedAt), minutes: 0 };
      totals.set(key, { ...current, minutes: current.minutes + (entry.durationMinutes ?? 0) });
    }

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-14)
      .map(([, value]) => value);
  }, [entries]);

  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  const runningEntries = entries.filter((entry) => !entry.endedAt).length;
  const activeJobs = jobs.filter((job) => job.status === 'active').length;
  const completedJobs = jobs.filter((job) => job.status === 'completed').length;
  const topTaskMinutes = Math.max(...taskTypeRows.map((row) => row.minutes), 1);
  const topDayMinutes = Math.max(...recentDayRows.map((row) => row.minutes), 1);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <AppMenu title="Analytics" />
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, isDark && styles.textMuted]}>Analytics</Text>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={2}>Your work overview</Text>
          <Text style={[styles.subtitle, isDark && styles.textMuted]}>These numbers are calculated only from your own tracked time.</Text>
        </View>

        {!token ? (
          <PreviewHint>
            Analytics summarizes tracked time, active tasks, completed tasks and time split by work type.
          </PreviewHint>
        ) : null}

        {isLoading ? <ActivityIndicator /> : null}
        {error ? <Text style={[styles.error, isDark && styles.errorDark]}>{error}</Text> : null}

        <View style={styles.statsGrid}>
          <StatCard
            label="Total time"
            value={formatDuration(totalMinutes)}
            detail={runningEntries > 0 ? `${runningEntries} running timer` : `${entries.length} time entries`}
            tone="cyan"
            isDark={isDark}
          />
          <StatCard
            label="Active tasks"
            value={String(activeJobs)}
            detail="Open current task list"
            tone="amber"
            isDark={isDark}
            onPress={() => router.push('/(tabs)/jobs')}
          />
          <StatCard
            label="Completed tasks"
            value={String(completedJobs)}
            detail="Open completed task list"
            tone="emerald"
            isDark={isDark}
            onPress={() => router.push('/(tabs)/completed')}
          />
        </View>

        <Panel isDark={isDark}>
          <SectionTitle eyebrow="Task types" title="Time by task type" description="A breakdown of where your tracked minutes went." isDark={isDark} />
          {taskTypeRows.length === 0 && !isLoading ? (
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>No tracked time yet.</Text>
          ) : (
            <View style={styles.bars}>
              {taskTypeRows.map((row) => (
                <View key={row.name} style={styles.barBlock}>
                  <View style={styles.barHeader}>
                    <Text style={[styles.barLabel, isDark && styles.textLight]} numberOfLines={1}>{row.name}</Text>
                    <Text style={[styles.barValue, isDark && styles.textMuted]}>{formatDuration(row.minutes)}</Text>
                  </View>
                  <View style={[styles.track, isDark && styles.trackDark]}>
                    <View style={[styles.fill, { width: `${(row.minutes / topTaskMinutes) * 100}%`, backgroundColor: row.color }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Panel>

        <Panel isDark={isDark}>
          <SectionTitle eyebrow="Share" title="Task type split" description="Percent of your total tracked time." isDark={isDark} />
          <View style={styles.splitTotal}>
            <Text style={[styles.splitTotalLabel, isDark && styles.textMuted]}>Total</Text>
            <Text style={[styles.splitTotalValue, isDark && styles.textLight]}>{formatDuration(totalMinutes)}</Text>
          </View>
          <View style={styles.splitGrid}>
            {taskTypeRows.length === 0 && !isLoading ? (
              <Text style={[styles.emptyText, isDark && styles.textMuted]}>No split data yet.</Text>
            ) : (
              taskTypeRows.map((row) => (
                <View key={row.name} style={[styles.splitItem, isDark && styles.splitItemDark]}>
                  <View style={[styles.dot, { backgroundColor: row.color }]} />
                  <Text style={[styles.splitText, isDark && styles.textLight]} numberOfLines={2}>
                    {row.name}: {totalMinutes > 0 ? Math.round((row.minutes / totalMinutes) * 100) : 0}%
                  </Text>
                </View>
              ))
            )}
          </View>
        </Panel>

        <Panel isDark={isDark}>
          <SectionTitle eyebrow="Recent days" title="Tracked time per day" description="The last days with recorded work sessions." isDark={isDark} />
          {recentDayRows.length === 0 && !isLoading ? (
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>No daily activity yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysChart}>
              {recentDayRows.map((row) => (
                <View key={row.label} style={styles.dayColumn}>
                  <View style={styles.dayBarWrap}>
                    <View style={[styles.dayBar, { height: Math.max(8, (row.minutes / topDayMinutes) * 132) }]} />
                  </View>
                  <Text style={[styles.dayLabel, isDark && styles.textMuted]} numberOfLines={1}>{row.label}</Text>
                  <Text style={[styles.dayValue, isDark && styles.textLight]} numberOfLines={1} adjustsFontSizeToFit>{formatDuration(row.minutes)}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </Panel>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ eyebrow, title, description, isDark }: { eyebrow: string; title: string; description: string; isDark: boolean }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionEyebrow, isDark && styles.textMuted]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, isDark && styles.textLight]} numberOfLines={2}>{title}</Text>
      <Text style={[styles.sectionDescription, isDark && styles.textMuted]}>{description}</Text>
    </View>
  );
}

function Panel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return <View style={[styles.panel, isDark && styles.panelDark]}>{children}</View>;
}

function StatCard({
  label,
  value,
  detail,
  tone,
  isDark,
  onPress,
}: {
  label: string;
  value: string;
  detail: string;
  tone: 'cyan' | 'amber' | 'emerald';
  isDark: boolean;
  onPress?: () => void;
}) {
  const toneStyle = tone === 'cyan' ? styles.toneCyan : tone === 'amber' ? styles.toneAmber : styles.toneEmerald;
  const content = (
    <>
      <Text style={[styles.statLabel, isDark && styles.textMuted]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, isDark && styles.textLight]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{value}</Text>
      <Text style={[styles.statDetail, isDark && styles.textMuted]} numberOfLines={2}>{detail}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.statCard, isDark && styles.panelDark, toneStyle]} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.statCard, isDark && styles.panelDark, toneStyle]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  content: { gap: 16 },
  heading: { gap: 6 },
  eyebrow: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#111827', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 14, lineHeight: 20 },
  error: { color: '#be123c', backgroundColor: '#fff1f2', borderRadius: 10, padding: 12 },
  errorDark: { color: '#fecdd3', backgroundColor: '#4c0519' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexGrow: 1, flexBasis: 150, minHeight: 116, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc', padding: 14 },
  toneCyan: { borderLeftWidth: 4, borderLeftColor: '#22d3ee' },
  toneAmber: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  toneEmerald: { borderLeftWidth: 4, borderLeftColor: '#34d399' },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  statValue: { color: '#111827', fontSize: 24, fontWeight: '900', marginTop: 10 },
  statDetail: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 8 },
  panel: { gap: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc', padding: 16 },
  panelDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  sectionHeading: { gap: 5 },
  sectionEyebrow: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  sectionTitle: { color: '#111827', fontSize: 18, fontWeight: '900' },
  sectionDescription: { color: '#64748b', fontSize: 13, lineHeight: 19 },
  bars: { gap: 16 },
  barBlock: { gap: 8 },
  barHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  barLabel: { flex: 1, color: '#111827', fontSize: 14, fontWeight: '800' },
  barValue: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  track: { height: 14, overflow: 'hidden', borderRadius: 999, backgroundColor: '#e2e8f0' },
  trackDark: { backgroundColor: '#1e293b' },
  fill: { height: '100%', borderRadius: 999 },
  splitTotal: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: 152, height: 152, borderRadius: 76, borderWidth: 18, borderColor: '#22d3ee', backgroundColor: '#ffffff' },
  splitTotalLabel: { color: '#64748b', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  splitTotalValue: { color: '#111827', fontSize: 24, fontWeight: '900', marginTop: 4 },
  splitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  splitItem: { flexGrow: 1, flexBasis: 142, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff', padding: 10 },
  splitItemDark: { borderColor: '#334155', backgroundColor: '#020617' },
  dot: { width: 11, height: 11, borderRadius: 6 },
  splitText: { flex: 1, color: '#111827', fontSize: 12, fontWeight: '800' },
  daysChart: { alignItems: 'flex-end', gap: 12, paddingTop: 6, paddingBottom: 4 },
  dayColumn: { width: 54, alignItems: 'center', gap: 6 },
  dayBarWrap: { height: 140, justifyContent: 'flex-end' },
  dayBar: { width: 28, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#67e8f9' },
  dayLabel: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  dayValue: { width: '100%', color: '#111827', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 20 },
  spacer: { height: 24 },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
