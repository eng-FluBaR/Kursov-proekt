import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SimpleSelect } from '@/components/simple-select';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, formatDuration, Project, TimeEntry } from '@/lib/api';

export default function HistoryScreen() {
  const { token } = useAuth();
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>History</Text>

        <View style={styles.filterSection}>
          <Text style={styles.label}>Filter by Project</Text>
          <SimpleSelect value={selectedProject} options={projectOptions} onChange={setSelectedProject} />
        </View>

        {isLoading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {filteredEntries.length === 0 && !isLoading ? (
          <Text style={styles.emptyText}>No entries found</Text>
        ) : (
          filteredEntries.map((entry) => (
            <View key={entry.id} style={styles.entryItem}>
              <View style={[styles.colorDot, { backgroundColor: entry.projectColor }]} />
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>{entry.projectName}</Text>
                <Text style={styles.entrySubtitle}>
                  {entry.jobTitle ?? entry.taskTypeName ?? 'Task'} - {new Date(entry.startedAt).toLocaleString()}
                </Text>
                {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
              </View>
              <Text style={styles.entryDuration}>{formatDuration(entry.durationMinutes)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  filterSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  error: { color: '#be123c', backgroundColor: '#fff1f2', borderRadius: 8, padding: 12, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 40, fontSize: 16 },
  entryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  entryContent: { flex: 1 },
  entryTitle: { fontWeight: '600', fontSize: 14, marginBottom: 2 },
  entrySubtitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  entryNote: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  entryDuration: { fontSize: 12, fontWeight: '600', color: '#666' },
});
