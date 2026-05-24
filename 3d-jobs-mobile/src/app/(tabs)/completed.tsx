import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppMenu } from '@/components/app-menu';
import { PreviewHint } from '@/components/preview-hint';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, formatDuration, Job } from '@/lib/api';
import { previewJobs } from '@/lib/preview-data';

type PaginationState = {
  limit: number;
  offset: number;
  returned: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export default function CompletedTasksScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [status, setStatus] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const visibleJobs = normalizedSearch
    ? jobs.filter((job) => `${job.title} ${job.projectName} ${job.taskTypeName ?? ''} ${job.description ?? ''}`.toLowerCase().includes(normalizedSearch))
    : jobs;

  const loadJobs = useCallback(async (nextOffset = 0, append = false) => {
    if (!token) {
      setJobs(previewJobs.filter((job) => job.status === 'completed'));
      setIsLoading(false);
      return;
    }

    setStatus('');
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await apiRequest<{ jobs: Job[]; pagination?: PaginationState }>(
        `/api/mobile/time-entries?status=completed&ownOnly=true&limit=25&offset=${nextOffset}`,
        { token },
      );
      setJobs((currentJobs) => append ? [...currentJobs, ...response.jobs] : response.jobs);
      setPagination(response.pagination ?? null);
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load completed tasks.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    setJobs([]);
    setPagination(null);
    loadJobs();
  }, [loadJobs]));

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

        <View style={[styles.searchCard, isDark && styles.cardDark]}>
          <View style={styles.searchHeader}>
            <View style={styles.searchTitleRow}>
              <View style={[styles.searchIcon, isDark && styles.searchIconDark]}>
                <MaterialIcons name="search" size={18} color={isDark ? '#cffafe' : '#0e7490'} />
              </View>
              <View>
                <Text style={[styles.searchTitle, isDark && styles.textLight]}>Search completed</Text>
                <Text style={[styles.searchCount, isDark && styles.textMuted]}>{visibleJobs.length} of {jobs.length} tasks shown</Text>
              </View>
            </View>
            {search ? (
              <TouchableOpacity style={[styles.clearButton, isDark && styles.clearButtonDark]} onPress={() => setSearch('')}>
                <Text style={[styles.clearText, isDark && styles.textLight]}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={[styles.searchBox, isDark && styles.inputDark]}>
            <MaterialIcons name="search" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Search by task, project, type or notes"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

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
        {jobs.length > 0 && visibleJobs.length === 0 && !isLoading ? <Text style={[styles.empty, isDark && styles.textMuted]}>No completed tasks match your search.</Text> : null}
        {visibleJobs.map((job) => (
          <TouchableOpacity key={job.id} style={[styles.card, isDark && styles.cardDark]} onPress={() => openJob(job)}>
            <Text style={[styles.jobTitle, isDark && styles.textLight]} numberOfLines={2}>{job.title}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]} numberOfLines={2}>{job.projectName} - {job.taskTypeName ?? 'No type'}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]} numberOfLines={1} adjustsFontSizeToFit>Tracked: {formatDuration(job.totalDurationMinutes ?? 0)}</Text>
          </TouchableOpacity>
        ))}
        {pagination?.hasMore ? (
          <View style={[styles.loadMoreCard, isDark && styles.cardDark]}>
            <Text style={[styles.loadMoreText, isDark && styles.textMuted]}>
              Showing {jobs.length} loaded completed tasks. More are available.
            </Text>
            <TouchableOpacity
              style={[styles.loadMoreButton, isLoadingMore && styles.disabled]}
              onPress={() => loadJobs(pagination.nextOffset ?? jobs.length, true)}
              disabled={isLoadingMore}
            >
              <Text style={styles.loadMoreButtonText} numberOfLines={1} adjustsFontSizeToFit>
                {isLoadingMore ? 'Loading more...' : 'Load more completed tasks'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : pagination ? (
          <Text style={[styles.empty, isDark && styles.textMuted]}>All loaded completed tasks are shown.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  searchCard: { gap: 12, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#dbeafe', padding: 14, marginBottom: 16 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  searchTitleRow: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cffafe' },
  searchIconDark: { backgroundColor: '#164e63' },
  searchTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  searchCount: { marginTop: 2, color: '#64748b', fontSize: 12, fontWeight: '700' },
  clearButton: { borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
  clearButtonDark: { borderColor: '#334155', backgroundColor: '#020617' },
  clearText: { color: '#111827', fontSize: 12, fontWeight: '800' },
  searchBox: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  searchInput: { flex: 1, color: '#111827', fontSize: 14, fontWeight: '600', paddingVertical: 10 },
  searchInputDark: { color: '#f8fafc' },
  inputDark: { backgroundColor: '#020617', borderColor: '#334155' },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 10 },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  loadMoreCard: { alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#dbeafe', padding: 14, marginTop: 6 },
  loadMoreText: { color: '#64748b', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  loadMoreButton: { alignItems: 'center', borderRadius: 10, backgroundColor: '#22d3ee', paddingHorizontal: 18, paddingVertical: 12 },
  loadMoreButtonText: { color: '#083344', fontWeight: '900' },
  disabled: { opacity: 0.65 },
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
