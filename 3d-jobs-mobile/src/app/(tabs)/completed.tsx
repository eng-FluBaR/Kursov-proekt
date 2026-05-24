import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
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
    setSelectedJob(job);
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="Completed tasks" />
        <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Finished work</Text>
        {!token ? <PreviewHint>Completed tasks collect finished jobs and their tracked time. Login to open reports and real task details.</PreviewHint> : null}
        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={[styles.status, isDark && styles.statusDark]}>{status}</Text> : null}

        {selectedJob ? (
          <View style={[styles.detailCard, isDark && styles.detailCardDark]}>
            <Text style={styles.kicker}>Completed task</Text>
            <Text style={styles.detailTitle}>{selectedJob.title}</Text>
            <Text style={styles.detailMeta}>{selectedJob.projectName} - {selectedJob.taskTypeName ?? 'No type'}</Text>
            <Text style={styles.detailMeta}>Tracked: {formatDuration(selectedJob.totalDurationMinutes ?? 0)}</Text>
            {selectedJob.description ? <Text style={styles.description}>{selectedJob.description}</Text> : null}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedJob(null)}>
              <Text style={styles.closeText} numberOfLines={1} adjustsFontSizeToFit>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {jobs.length === 0 && !isLoading ? <Text style={[styles.empty, isDark && styles.textMuted]}>No completed tasks yet.</Text> : null}
        {jobs.map((job) => (
          <TouchableOpacity key={job.id} style={[styles.card, isDark && styles.cardDark]} onPress={() => openJob(job)}>
            <Text style={[styles.jobTitle, isDark && styles.textLight]} numberOfLines={2}>{job.title}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]} numberOfLines={2}>{job.projectName} - {job.taskTypeName ?? 'No type'}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]} numberOfLines={1} adjustsFontSizeToFit>Tracked: {formatDuration(job.totalDurationMinutes ?? 0)}</Text>
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
  detailCard: { gap: 10, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16 },
  detailCardDark: { backgroundColor: '#111827' },
  kicker: { color: '#67e8f9', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  detailMeta: { color: '#cbd5e1', fontSize: 12 },
  description: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  closeButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingVertical: 12, marginTop: 2 },
  closeText: { color: '#e2e8f0', fontWeight: '700' },
  status: { borderRadius: 10, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  statusDark: { backgroundColor: '#172554', color: '#bfdbfe' },
  empty: { color: '#64748b', textAlign: 'center', paddingVertical: 24 },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
