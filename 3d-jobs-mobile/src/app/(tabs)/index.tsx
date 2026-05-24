import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { apiRequest, formatDuration, Job, Project, TimeEntry } from '@/lib/api';
import { previewJobs, previewProjects, previewTimeEntries } from '@/lib/preview-data';
import { PreviewHint } from '@/components/preview-hint';

export default function DashboardScreen() {
  const { token, user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!token) {
      setProjects(previewProjects);
      setEntries(previewTimeEntries);
      setJobs(previewJobs);
      setIsLoading(false);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const [projectsResponse, entriesResponse, jobsResponse] = await Promise.all([
        apiRequest<{ projects: Project[] }>('/api/mobile/projects', { token }),
        apiRequest<{ timeEntries: TimeEntry[] }>('/api/mobile/time-entries', { token }),
        apiRequest<{ jobs: Job[] }>('/api/mobile/time-entries?status=all&ownOnly=true', { token }),
      ]);
      setProjects(projectsResponse.projects);
      setEntries(entriesResponse.timeEntries);
      setJobs(jobsResponse.jobs);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((entry) => entry.startedAt.slice(0, 10) === today);
  const totalMinutesToday = todayEntries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={token ? logout : () => router.push('/login')} style={styles.logoutButton}>
            <Text style={styles.logoutText}>{token ? 'Logout' : 'Login'}</Text>
          </TouchableOpacity>
        </View>
        {!token ? (
          <PreviewHint>
            Mobile review mode shows sample projects, tracked time, jobs and recent entries. Login to sync with the web app and Neon database.
          </PreviewHint>
        ) : null}

        {isLoading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today&apos;s Total</Text>
            <Text style={styles.statValue}>{formatDuration(totalMinutesToday)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Projects</Text>
            <Text style={styles.statValue}>{projects.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Jobs</Text>
            <Text style={styles.statValue}>{jobs.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {entries.length === 0 && !isLoading ? (
            <Text style={styles.emptyText}>No entries yet</Text>
          ) : (
            entries.slice(0, 8).map((entry) => (
              <View key={entry.id} style={styles.entryItem}>
                <View style={[styles.colorDot, { backgroundColor: entry.projectColor }]} />
                <View style={styles.entryContent}>
                  <Text style={styles.entryTitle}>{entry.projectName}</Text>
                  <Text style={styles.entrySubtitle}>
                  {entry.jobTitle ?? entry.taskTypeName ?? 'Task'} - {new Date(entry.startedAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.entryDuration}>{formatDuration(entry.durationMinutes)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { marginTop: 4, color: '#666' },
  logoutButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#333', fontWeight: '700' },
  error: { color: '#be123c', backgroundColor: '#fff1f2', borderRadius: 8, padding: 12, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  entryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  entryContent: { flex: 1 },
  entryTitle: { fontWeight: '600', fontSize: 14, marginBottom: 2 },
  entrySubtitle: { fontSize: 12, color: '#666' },
  entryDuration: { fontSize: 12, fontWeight: '600', color: '#666' },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 20 },
});
