import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PreviewHint } from '@/components/preview-hint';
import { AppMenu } from '@/components/app-menu';
import { SelectOption, SimpleSelect } from '@/components/simple-select';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, Job } from '@/lib/api';
import { previewJobs } from '@/lib/preview-data';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;

  const loadJobs = useCallback(async () => {
    if (!token) {
      setJobs(previewJobs);
      setIsLoading(false);
      return;
    }

    setStatus('');
    setIsLoading(true);

    try {
      const response = await apiRequest<{ jobs: Job[] }>('/api/mobile/time-entries?status=all&ownOnly=true', { token });
      setJobs(response.jobs);
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load calendar.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadJobs(); }, [loadJobs]));

  const typeOptions = useMemo<SelectOption<string>[]>(
    () => [
      { label: 'All types', value: 'all' },
      ...Array.from(new Set(jobs.map((job) => job.taskTypeName ?? 'No type'))).map((typeName) => ({
        label: typeName,
        value: typeName,
      })),
    ],
    [jobs],
  );

  const filteredJobs = selectedType === 'all'
    ? jobs
    : jobs.filter((job) => (job.taskTypeName ?? 'No type') === selectedType);

  const jobsByDay: Record<number, Job[]> = {};
  for (const job of filteredJobs) {
    const created = new Date(job.createdAt);
    if (created.getFullYear() === year && created.getMonth() === month) {
      const day = created.getDate();
      jobsByDay[day] = [...(jobsByDay[day] ?? []), job];
    }
  }

  function openJob(job: Job) {
    if (!token) {
      setStatus('Login to open and edit real task details.');
      router.push('/login');
      return;
    }

    router.push({ pathname: '/jobs', params: { jobId: job.id } });
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="Calendar" />
        <Text style={[styles.title, isDark && styles.textLight]}>{today.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
        {!token ? (
          <PreviewHint>
            Calendar previews how tasks appear by creation day. Login to open real task details from each date.
          </PreviewHint>
        ) : null}

        <View style={styles.filter}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Task type</Text>
          <SimpleSelect value={selectedType} options={typeOptions} onChange={setSelectedType} />
        </View>

        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={styles.weekRow}>
          {weekdays.map((day) => <Text key={day} style={[styles.weekday, isDark && styles.textMuted]}>{day}</Text>)}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: firstDayOffset }).map((_, index) => <View key={`blank-${index}`} style={[styles.dayCard, isDark && styles.dayCardDark]} />)}
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
            const dayJobs = jobsByDay[day] ?? [];
            return (
              <View key={day} style={[styles.dayCard, isDark && styles.dayCardDark, dayJobs.length > 0 && (isDark ? styles.dayCardActiveDark : styles.dayCardActive)]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayNumber, isDark && styles.textLight]}>{day}</Text>
                  {dayJobs.length > 0 ? <Text style={styles.count}>{dayJobs.length}</Text> : null}
                </View>
                {dayJobs.slice(0, 2).map((job) => (
                  <TouchableOpacity key={job.id} style={styles.jobPill} onPress={() => openJob(job)}>
                    <Text style={styles.jobPillText} numberOfLines={1}>{job.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  filter: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  status: { borderRadius: 10, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  weekRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', color: '#64748b', fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCard: { width: '13.4%', minHeight: 82, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#f8fafc', padding: 6 },
  dayCardDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  dayCardActive: { borderColor: '#67e8f9', backgroundColor: '#ecfeff' },
  dayCardActiveDark: { borderColor: '#22d3ee', backgroundColor: '#164e63' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  dayNumber: { color: '#111827', fontWeight: '800', fontSize: 12 },
  count: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#0891b2', color: '#fff', fontSize: 10, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 1 },
  jobPill: { borderRadius: 7, backgroundColor: '#cffafe', paddingHorizontal: 5, paddingVertical: 4, marginBottom: 4 },
  jobPillText: { color: '#155e75', fontSize: 10, fontWeight: '700' },
  spacer: { height: 24 },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
