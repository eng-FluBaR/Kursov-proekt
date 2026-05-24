import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SelectOption, SimpleSelect } from '@/components/simple-select';
import { PreviewHint } from '@/components/preview-hint';
import { apiRequest, formatDuration, Job, Project, TaskType, TimeEntry } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { previewJobs, previewProjects, previewTaskTypes } from '@/lib/preview-data';

type JobView = 'active' | 'paused' | 'shared' | 'completed';

const viewOptions: SelectOption<JobView>[] = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Shared', value: 'shared' },
  { label: 'Completed', value: 'completed' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function JobsScreen() {
  const { token } = useAuth();
  const [view, setView] = useState<JobView>('active');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const projectOptions = useMemo(
    () => projects.map((project) => ({ label: project.name, value: project.id, color: project.color })),
    [projects],
  );
  const taskTypeOptions = useMemo(
    () => taskTypes.map((taskType) => ({ label: taskType.name, value: taskType.id })),
    [taskTypes],
  );
  const filterOptions = useMemo(
    () => [
      { label: 'All types', value: 'all' },
      ...taskTypes.map((taskType) => ({ label: taskType.name, value: taskType.id })),
    ],
    [taskTypes],
  );

  const loadData = useCallback(async () => {
    if (!token) {
      const previewVisibleJobs = view === 'shared'
        ? previewJobs.map((job) => ({ ...job, isShared: true, ownerEmail: 'preview@tasktimer.app' }))
        : previewJobs.filter((job) => job.status === view);
      setJobs(previewVisibleJobs);
      setProjects(previewProjects);
      setTaskTypes(previewTaskTypes);
      setProjectId((current) => current || previewProjects[0]?.id || '');
      setTaskTypeId((current) => current || previewTaskTypes[0]?.id || '');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      const statusQuery = view === 'shared' ? 'all&sharedOnly=true' : `${view}&ownOnly=true`;
      const [jobsResponse, projectsResponse, taskTypesResponse] = await Promise.all([
        apiRequest<{ jobs: Job[] }>(`/api/mobile/time-entries?status=${statusQuery}`, { token }),
        apiRequest<{ projects: Project[] }>('/api/mobile/projects', { token }),
        apiRequest<{ taskTypes: TaskType[] }>('/api/mobile/task-types', { token }),
      ]);
      setJobs(jobsResponse.jobs);
      setProjects(projectsResponse.projects);
      setTaskTypes(taskTypesResponse.taskTypes);
      setProjectId((current) => current || projectsResponse.projects[0]?.id || '');
      setTaskTypeId((current) => current || taskTypesResponse.taskTypes[0]?.id || '');
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [token, view]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const visibleJobs = jobs.filter((job) => {
    const matchesText = `${job.title} ${job.projectName} ${job.taskTypeName ?? ''} ${job.ownerEmail ?? ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesType = typeFilter === 'all' || job.taskTypeId === typeFilter;
    return matchesText && matchesType;
  });

  async function createJob() {
    if (!token || !projectId || !title.trim()) {
      if (!token) {
        setStatus('Login to create real jobs.');
        router.push('/login');
        return;
      }
      setStatus('Choose project and enter task name.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      await apiRequest('/api/mobile/time-entries', {
        method: 'POST',
        token,
        body: {
          projectId,
          taskTypeId,
          title,
          description,
        },
      });
      setTitle('');
      setDescription('');
      setStatus('Job created.');
      await loadData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not create job.');
    } finally {
      setIsSaving(false);
    }
  }

  async function updateSelectedJob(nextStatus?: 'active' | 'paused' | 'completed') {
    if (!token || !selectedJob) {
      if (!token) {
        setStatus('Login to edit jobs.');
        router.push('/login');
      }
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      await apiRequest(`/api/jobs/${selectedJob.id}`, {
        method: 'PATCH',
        token,
        body: {
          ...(nextStatus ? { status: nextStatus } : {}),
          description: notes,
        },
      });
      setStatus('Job updated.');
      setSelectedJob(null);
      await loadData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not update job.');
    } finally {
      setIsSaving(false);
    }
  }

  async function startTimer(job: Job) {
    if (!token) {
      setStatus('Login to start and save a real timer.');
      router.push('/login');
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      const activeResponse = await apiRequest<{ entry: TimeEntry | null }>('/api/time-entries/active', { token });
      if (activeResponse.entry?.id) {
        await apiRequest(`/api/time-entries/${activeResponse.entry.id}/stop`, { method: 'PATCH', token });
      }

      await apiRequest('/api/mobile/time-entries', {
        method: 'POST',
        token,
        body: {
          projectId: job.projectId,
          jobId: job.id,
          startedAt: new Date().toISOString(),
        },
      });
      setStatus(`Timer started for ${job.title}.`);
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not start timer.');
    } finally {
      setIsSaving(false);
    }
  }

  function openJob(job: Job) {
    setSelectedJob(job);
    setNotes(job.description ?? '');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Jobs</Text>
        {!token ? (
          <PreviewHint>
            Browse sample tasks by status, search by name or type, and open details. Login to create, edit, share and track real tasks.
          </PreviewHint>
        ) : null}

        <SimpleSelect value={view} options={viewOptions} onChange={setView} />

        <View style={styles.filters}>
          <TextInput style={styles.input} placeholder="Search jobs" value={search} onChangeText={setSearch} />
          <SimpleSelect value={typeFilter} options={filterOptions} onChange={setTypeFilter} />
        </View>

        {view === 'active' ? (
          <View style={styles.createCard}>
            <Text style={styles.sectionTitle}>Create job</Text>
            {!token ? <Text style={styles.helpText}>After login this form creates a task with project, task type, name and notes.</Text> : null}
            <SimpleSelect value={projectId} options={projectOptions} onChange={setProjectId} />
            <SimpleSelect value={taskTypeId} options={taskTypeOptions} onChange={setTaskTypeId} />
            {!token ? <Text style={styles.helpText}>Task name is what appears in lists, calendar and reports.</Text> : null}
            <TextInput style={styles.input} placeholder="Task name" value={title} onChangeText={setTitle} />
            {!token ? <Text style={styles.helpText}>Notes can hold print settings, requirements, blockers or client feedback.</Text> : null}
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Notes"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TouchableOpacity style={[styles.primaryButton, isSaving && styles.disabled]} onPress={createJob} disabled={isSaving}>
              <Text style={styles.primaryText}>{isSaving ? 'Saving...' : token ? 'Create job' : 'Login to create'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {selectedJob ? (
          <View style={styles.detailCard}>
            <Text style={styles.kicker}>Task details</Text>
            <Text style={styles.detailTitle}>{selectedJob.title}</Text>
            <Text style={styles.meta}>{selectedJob.projectName} - {selectedJob.taskTypeName ?? 'No type'}</Text>
            {selectedJob.isShared ? <Text style={styles.shared}>Shared by {selectedJob.ownerEmail ?? 'another user'}</Text> : null}
            <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} multiline editable={!selectedJob.isShared} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => startTimer(selectedJob)} disabled={isSaving}>
                <Text style={styles.primaryText}>Start timer</Text>
              </TouchableOpacity>
              {!selectedJob.isShared ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateSelectedJob()} disabled={isSaving}>
                  <Text style={styles.secondaryText}>Save</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {!selectedJob.isShared ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateSelectedJob('active')} disabled={isSaving}>
                  <Text style={styles.secondaryText}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateSelectedJob('paused')} disabled={isSaving}>
                  <Text style={styles.secondaryText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateSelectedJob('completed')} disabled={isSaving}>
                  <Text style={styles.secondaryText}>Complete</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedJob(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {visibleJobs.length === 0 && !isLoading ? <Text style={styles.emptyText}>No jobs found</Text> : null}

        {visibleJobs.map((job) => (
          <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => openJob(job)}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.badge}>{job.status}</Text>
            </View>
            <Text style={styles.meta}>{job.projectName} - {job.taskTypeName ?? 'No type'}</Text>
            <Text style={styles.meta}>Tracked: {formatDuration(job.totalDurationMinutes ?? 0)}</Text>
            {job.isShared ? <Text style={styles.shared}>Shared by {job.ownerEmail ?? 'another user'}</Text> : null}
            <Text style={styles.meta}>Created {formatDate(job.createdAt)}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  filters: { gap: 12, marginVertical: 16 },
  createCard: { gap: 12, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  helpText: { color: '#64748b', fontSize: 12, lineHeight: 17 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff', color: '#111827' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  status: { borderRadius: 10, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  detailCard: { gap: 12, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16 },
  kicker: { color: '#67e8f9', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  jobCard: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 10 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  jobTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#dbeafe', color: '#1e40af', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  meta: { marginTop: 4, color: '#64748b', fontSize: 12 },
  shared: { marginTop: 6, color: '#047857', fontSize: 12, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { flex: 1, alignItems: 'center', borderRadius: 10, backgroundColor: '#10b981', paddingVertical: 12 },
  primaryText: { color: '#052e16', fontWeight: '800' },
  secondaryButton: { flex: 1, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingVertical: 12 },
  secondaryText: { color: '#111827', fontWeight: '700' },
  closeButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingVertical: 12 },
  closeText: { color: '#e2e8f0', fontWeight: '700' },
  disabled: { opacity: 0.65 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 24 },
  spacer: { height: 24 },
});
