import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { AppMenu } from '@/components/app-menu';
import { PreviewHint } from '@/components/preview-hint';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, formatDuration, Job } from '@/lib/api';
import { previewJobs } from '@/lib/preview-data';

export default function CompletedTasksScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');

  const loadJobs = useCallback(async () => {
    if (!token) {
      setJobs(previewJobs.filter((job) => job.status === 'completed'));
      setIsLoading(false);
      return;
    }

    setStatus('');
    setIsLoading(true);

    try {
      const response = await apiRequest<{ jobs: Job[] }>('/api/mobile/time-entries?status=completed&ownOnly=true', { token });
      setJobs(response.jobs);
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load completed tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadJobs(); }, [loadJobs]));

  function openJob(job: Job) {
    if (!token) {
      router.push('/login');
      return;
    }

    router.push({ pathname: '/jobs', params: { jobId: job.id } });
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="Completed tasks" />
        <Text style={[styles.title, isDark && styles.textLight]}>Finished work</Text>
        {!token ? <PreviewHint>Completed tasks collect finished jobs and their tracked time. Login to open reports and real task details.</PreviewHint> : null}
        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {jobs.length === 0 && !isLoading ? <Text style={[styles.empty, isDark && styles.textMuted]}>No completed tasks yet.</Text> : null}
        {jobs.map((job) => (
          <TouchableOpacity key={job.id} style={[styles.card, isDark && styles.cardDark]} onPress={() => openJob(job)}>
            <Text style={[styles.jobTitle, isDark && styles.textLight]}>{job.title}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]}>{job.projectName} - {job.taskTypeName ?? 'No type'}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]}>Tracked: {formatDuration(job.totalDurationMinutes ?? 0)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 10 },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  jobTitle: { color: '#111827', fontWeight: '800', fontSize: 16 },
  meta: { marginTop: 5, color: '#64748b', fontSize: 12 },
  status: { borderRadius: 10, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  empty: { color: '#64748b', textAlign: 'center', paddingVertical: 24 },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
