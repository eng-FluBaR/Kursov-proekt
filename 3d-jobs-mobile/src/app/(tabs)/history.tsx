import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SimpleSelect } from '@/components/simple-select';
import { PreviewHint } from '@/components/preview-hint';
import { AppMenu } from '@/components/app-menu';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, formatDuration, Project, TimeEntry } from '@/lib/api';
import { previewProjects, previewTimeEntries } from '@/lib/preview-data';

export default function HistoryScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const [selectedProject, setSelectedProject] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const projectOptions = useMemo(
    () => [
      { label: 'All Projects', value: 'all' },
      ...projects.map((project) => ({ label: project.name, value: project.id, color: project.color })),
    ],
    [projects],
  );

  const loadData = useCallback(async () => {
    if (!token) {
      setProjects(previewProjects);
      setEntries(previewTimeEntries);
      setIsLoading(false);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const [projectsResponse, entriesResponse] = await Promise.all([
        apiRequest<{ projects: Project[] }>('/api/mobile/projects', { token }),
        apiRequest<{ timeEntries: TimeEntry[] }>('/api/mobile/time-entries', { token }),
      ]);
      setProjects(projectsResponse.projects);
      setEntries(entriesResponse.timeEntries);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load history.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filteredEntries = selectedProject !== 'all'
    ? entries.filter((entry) => entry.projectId === selectedProject)
    : entries;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="History" />
        <Text style={[styles.title, isDark && styles.textLight]}>History</Text>
        {!token ? (
          <PreviewHint>
            History shows saved sessions, duration, notes and project filters. Login to see your real time entries.
          </PreviewHint>
        ) : null}

        <View style={styles.filterSection}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Filter by Project</Text>
          <SimpleSelect value={selectedProject} options={projectOptions} onChange={setSelectedProject} />
        </View>

        {isLoading ? <ActivityIndicator /> : null}
        {error ? <Text style={[styles.error, isDark && styles.errorDark]}>{error}</Text> : null}

        {filteredEntries.length === 0 && !isLoading ? (
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>No entries found</Text>
        ) : (
          filteredEntries.map((entry) => (
            <View key={entry.id} style={[styles.entryItem, isDark && styles.cardDark]}>
              <View style={[styles.colorDot, { backgroundColor: entry.projectColor }]} />
              <View style={styles.entryContent}>
                <Text style={[styles.entryTitle, isDark && styles.textLight]}>{entry.projectName}</Text>
                <Text style={[styles.entrySubtitle, isDark && styles.textMuted]}>
                  {entry.jobTitle ?? entry.taskTypeName ?? 'Task'} - {new Date(entry.startedAt).toLocaleString()}
                </Text>
                {entry.note ? <Text style={[styles.entryNote, isDark && styles.textMuted]}>{entry.note}</Text> : null}
              </View>
              <Text style={[styles.entryDuration, isDark && styles.textMuted]}>{formatDuration(entry.durationMinutes)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  filterSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  error: { color: '#be123c', backgroundColor: '#fff1f2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorDark: { color: '#fecdd3', backgroundColor: '#4c0519' },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 40, fontSize: 16 },
  entryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  entryContent: { flex: 1 },
  entryTitle: { fontWeight: '600', fontSize: 14, marginBottom: 2 },
  entrySubtitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  entryNote: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  entryDuration: { fontSize: 12, fontWeight: '600', color: '#666' },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
