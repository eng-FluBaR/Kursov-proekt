import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SimpleSelect } from '@/components/simple-select';
import { PreviewHint } from '@/components/preview-hint';
import { AppMenu } from '@/components/app-menu';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, formatDuration, Job, TimeEntry } from '@/lib/api';
import { previewJobs } from '@/lib/preview-data';

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const { token } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({
      label: `${job.title}${job.isShared ? ' (shared)' : ''}`,
      value: job.id,
    })),
    [jobs],
  );
  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  const loadTimer = useCallback(async () => {
    if (!token) {
      const activeJobs = previewJobs.filter((job) => job.status === 'active');
      setJobs(activeJobs);
      setSelectedJobId((current) => current || activeJobs[0]?.id || '');
      setActiveEntry(null);
      setIsRunning(false);
      setElapsed(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      const [jobsResponse, activeResponse] = await Promise.all([
        apiRequest<{ jobs: Job[] }>('/api/mobile/time-entries?status=active', { token }),
        apiRequest<{ entry: TimeEntry | null }>('/api/time-entries/active', { token }),
      ]);

      setJobs(jobsResponse.jobs);
      setActiveEntry(activeResponse.entry);

      if (activeResponse.entry) {
        setIsRunning(true);
        if (activeResponse.entry.jobId) {
          setSelectedJobId(activeResponse.entry.jobId);
        }
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(activeResponse.entry.startedAt).getTime()) / 1000)));
      } else {
        setIsRunning(false);
        setElapsed(0);
        setSelectedJobId((current) => current || jobsResponse.jobs[0]?.id || '');
      }
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load timer.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadTimer(); }, [loadTimer]));

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  async function startTimer() {
    if (!token || !selectedJob) {
      if (!token) {
        setStatus('Login to start and save a real timer.');
        router.push('/login');
        return;
      }
      setStatus('Choose a job first.');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      if (activeEntry?.id) {
        await apiRequest(`/api/time-entries/${activeEntry.id}/stop`, { method: 'PATCH', token });
      }

      const response = await apiRequest<{ entry: TimeEntry }>('/api/mobile/time-entries', {
        method: 'POST',
        token,
        body: {
          projectId: selectedJob.projectId,
          jobId: selectedJob.id,
          startedAt: new Date().toISOString(),
        },
      });

      setActiveEntry(response.entry);
      setElapsed(0);
      setIsRunning(true);
      setStatus(`Timer started for ${selectedJob.title}.`);
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not start timer.');
    } finally {
      setIsLoading(false);
    }
  }

  async function stopTimer() {
    if (!token || !activeEntry) {
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      await apiRequest(`/api/time-entries/${activeEntry.id}/stop`, { method: 'PATCH', token });
      setActiveEntry(null);
      setElapsed(0);
      setIsRunning(false);
      setStatus('Timer stopped.');
      await loadTimer();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not stop timer.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppMenu title="Timer" />
        <Text style={styles.title}>Timer</Text>
        {!token ? (
          <PreviewHint>
            Pick a sample job to see how the timer is organized. After login, Start and Stop save time directly to that task.
          </PreviewHint>
        ) : null}
        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={styles.displayCard}>
          <Text style={styles.displayTime}>{formatElapsed(elapsed)}</Text>
          <Text style={styles.displayLabel}>{selectedJob?.title || 'Select job'}</Text>
          {selectedJob ? <Text style={styles.displayMeta}>{selectedJob.projectName} - {selectedJob.taskTypeName ?? 'No type'}</Text> : null}
          {selectedJob ? <Text style={styles.displayMeta}>Total on task: {formatDuration(selectedJob.totalDurationMinutes ?? 0)}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Job</Text>
          <SimpleSelect value={selectedJobId} options={jobOptions} onChange={setSelectedJobId} />
        </View>

        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity style={[styles.controlButton, styles.startButton]} onPress={startTimer} disabled={isLoading}>
              <Text style={styles.controlButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopTimer} disabled={isLoading}>
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  displayCard: { backgroundColor: '#ecfeff', borderWidth: 3, borderColor: '#06b6d4', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 20 },
  displayTime: { fontSize: 48, fontWeight: 'bold', fontFamily: 'monospace', color: '#0e7490', marginBottom: 12 },
  displayLabel: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center' },
  displayMeta: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'center' },
  section: { marginVertical: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  controls: { flexDirection: 'row', gap: 12, marginTop: 20 },
  controlButton: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  startButton: { backgroundColor: '#10B981' },
  stopButton: { backgroundColor: '#EF4444' },
  controlButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  status: { borderRadius: 10, backgroundColor: '#f0f9ff', color: '#1d4ed8', padding: 12 },
});
