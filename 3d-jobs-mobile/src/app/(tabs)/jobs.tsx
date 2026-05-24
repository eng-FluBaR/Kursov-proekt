import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SelectOption, SimpleSelect } from '@/components/simple-select';
import { PreviewHint } from '@/components/preview-hint';
import { AppMenu } from '@/components/app-menu';
import { apiRequest, formatDuration, Job, Project, TaskType, TimeEntry } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { previewJobs, previewProjects, previewTaskTypes } from '@/lib/preview-data';

type JobView = 'active' | 'paused' | 'shared';

const viewOptions: SelectOption<JobView>[] = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Shared', value: 'shared' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export default function JobsScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [timerJobId, setTimerJobId] = useState('');
  const [elapsed, setElapsed] = useState(0);

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
  const activeJobs = useMemo(() => jobs.filter((job) => job.status === 'active'), [jobs]);
  const timerJob = activeJobs.find((job) => job.id === timerJobId) ?? activeJobs[0];
  const isTimerRunning = Boolean(activeEntry);
  const selectedProjectId = projects.some((project) => project.id === projectId)
    ? projectId
    : projects[0]?.id ?? '';
  const selectedTaskTypeId = taskTypes.some((taskType) => taskType.id === taskTypeId)
    ? taskTypeId
    : taskTypes[0]?.id ?? '';

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
      setTimerJobId((current) => current || previewJobs.find((job) => job.status === 'active')?.id || '');
      setActiveEntry(null);
      setElapsed(0);
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
      setTimerJobId((current) => current || jobsResponse.jobs.find((job) => job.status === 'active')?.id || '');

      const activeResponse = await apiRequest<{ entry: TimeEntry | null }>('/api/time-entries/active', { token });
      setActiveEntry(activeResponse.entry);
      if (activeResponse.entry?.jobId) {
        setTimerJobId(activeResponse.entry.jobId);
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(activeResponse.entry.startedAt).getTime()) / 1000)));
      } else {
        setElapsed(0);
      }
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [token, view]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    if (view !== 'active') {
      setShowCreateForm(false);
    }
  }, [view]);

  useEffect(() => {
    if (!activeEntry) {
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  const visibleJobs = jobs.filter((job) => {
    const matchesText = `${job.title} ${job.projectName} ${job.taskTypeName ?? ''} ${job.ownerEmail ?? ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesType = typeFilter === 'all' || job.taskTypeId === typeFilter;
    return matchesText && matchesType;
  });

  async function createJob() {
    if (!token || !selectedProjectId || !selectedTaskTypeId || !title.trim()) {
      if (!token) {
        setStatus('Login to create real jobs.');
        router.push('/login');
        return;
      }
      if (!selectedProjectId) {
        setStatus('No project is available for this account.');
        return;
      }
      if (!selectedTaskTypeId) {
        setStatus('Please select a task type.');
        return;
      }
      setStatus('Task name is required.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      await apiRequest('/api/mobile/time-entries', {
        method: 'POST',
        token,
        body: {
          projectId: selectedProjectId,
          taskTypeId: selectedTaskTypeId,
          title,
          description,
        },
      });
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
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

  async function startTimer(job?: Job) {
    const selectedTimerJob = job ?? timerJob;
    
    if (!token) {
      setStatus('Login to start and save a real timer.');
      router.push('/login');
      return;
    }

    if (!selectedTimerJob) {
      setStatus('Choose an active job first.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      const activeResponse = await apiRequest<{ entry: TimeEntry | null }>('/api/time-entries/active', { token });
      if (activeResponse.entry?.id) {
        await apiRequest(`/api/time-entries/${activeResponse.entry.id}/stop`, { method: 'PATCH', token });
      }

      const response = await apiRequest<{ entry: TimeEntry }>('/api/mobile/time-entries', {
        method: 'POST',
        token,
        body: {
          projectId: selectedTimerJob.projectId,
          jobId: selectedTimerJob.id,
          startedAt: new Date().toISOString(),
        },
      });
      setActiveEntry(response.entry);
      setTimerJobId(selectedTimerJob.id);
      setElapsed(0);
      setStatus(`Timer started for ${selectedTimerJob.title}.`);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not start timer.');
    } finally {
      setIsSaving(false);
    }
  }

  async function stopTimer() {
    if (!token || !activeEntry) {
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      await apiRequest(`/api/time-entries/${activeEntry.id}/stop`, { method: 'PATCH', token });
      setActiveEntry(null);
      setElapsed(0);
      setStatus('Timer stopped and saved to the task.');
      await loadData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not stop timer.');
    } finally {
      setIsSaving(false);
    }
  }

  function openJob(job: Job) {
    setSelectedJob(job);
    setNotes(job.description ?? '');
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView ref={scrollRef} style={styles.scroll}>
        <AppMenu title="Jobs" />
        <Text style={[styles.title, isDark && styles.textLight]}>Jobs</Text>
        {!token ? (
          <PreviewHint>
            Browse sample tasks by status, search by name or type, and open details. Login to create, edit, share and track real tasks.
          </PreviewHint>
        ) : null}

        <View style={[styles.timerCard, isDark && styles.cardDark]}>
          <View style={styles.timerHeader}>
            <View style={styles.timerTitleWrap}>
              <Text style={[styles.kickerLight, isDark && styles.textMuted]}>Active timer</Text>
              <Text style={[styles.timerTime, isDark && styles.textLight]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatElapsed(elapsed)}</Text>
              <Text style={[styles.timerState, isDark && styles.textMuted]}>{isTimerRunning ? 'Tracking live in seconds' : 'Timer idle'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.timerButton, isTimerRunning ? styles.stopTimerButton : styles.startTimerButton, isSaving && styles.disabled]}
              onPress={isTimerRunning ? stopTimer : () => startTimer()}
              disabled={isSaving || activeJobs.length === 0}
            >
              <Text style={styles.timerButtonText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{isTimerRunning ? 'Stop timer' : 'Start timer'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timerSelect}>
            <Text style={[styles.fieldLabel, isDark && styles.textMuted]}>Select Job</Text>
            <SimpleSelect
              value={timerJob?.id ?? ''}
              options={activeJobs.map((job) => ({ label: `${job.title} - ${job.projectName}`, value: job.id }))}
              onChange={setTimerJobId}
            />
          </View>
          {timerJob ? (
            <View style={styles.timerMetaRow}>
              <Text style={[styles.metaChip, isDark && styles.metaChipDark]} numberOfLines={2}>{timerJob.title}</Text>
              <Text style={[styles.metaChip, isDark && styles.metaChipDark]} numberOfLines={2}>{timerJob.projectName}</Text>
              <Text style={[styles.metaChip, isDark && styles.metaChipDark]} numberOfLines={2}>{timerJob.taskTypeName ?? 'No type'}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.controlBlock}>
          <Text style={[styles.fieldLabel, isDark && styles.textMuted]}>Task list</Text>
          <SimpleSelect value={view} options={viewOptions} onChange={setView} />
        </View>

        <View style={styles.filters}>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Search jobs" placeholderTextColor={isDark ? '#64748b' : undefined} value={search} onChangeText={setSearch} />
          <View style={styles.controlBlock}>
            <Text style={[styles.fieldLabel, isDark && styles.textMuted]}>Task type</Text>
            <SimpleSelect value={typeFilter} options={filterOptions} onChange={setTypeFilter} />
          </View>
        </View>

        {view === 'active' ? (
          <TouchableOpacity
            style={[styles.openCreateButton, showCreateForm && styles.openCreateButtonActive, isSaving && styles.disabled]}
            onPress={() => setShowCreateForm((current) => !current)}
            disabled={isSaving}
          >
            <Text style={styles.primaryText} numberOfLines={1} adjustsFontSizeToFit>
              {showCreateForm ? 'Hide Task Form' : 'Create New Task'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {view === 'active' && showCreateForm ? (
          <View style={[styles.createCard, isDark && styles.cardDark]}>
            <View>
              <Text style={[styles.sectionEyebrow, isDark && styles.textMuted]}>Task form</Text>
              <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Create New Task</Text>
              {!token ? <Text style={[styles.helpText, isDark && styles.textMuted]}>After login this form creates a task with type, name and notes.</Text> : null}
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formColumn}>
                <Text style={[styles.fieldLabel, isDark && styles.textMuted]}>Task name</Text>
                {!token ? <Text style={[styles.helpText, isDark && styles.textMuted]}>This name appears in lists, calendar and reports.</Text> : null}
                <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Enter task name..." placeholderTextColor={isDark ? '#64748b' : undefined} value={title} onChangeText={setTitle} />
              </View>
              <View style={styles.formColumn}>
                <Text style={[styles.fieldLabel, isDark && styles.textMuted]}>Task type</Text>
                {!token ? <Text style={[styles.helpText, isDark && styles.textMuted]}>Types group tracked time by work activity.</Text> : null}
                <SimpleSelect value={selectedTaskTypeId} options={taskTypeOptions} onChange={setTaskTypeId} />
              </View>
            </View>

            <Text style={[styles.fieldLabel, isDark && styles.textMuted]}>Notes / description (optional)</Text>
            {!token ? <Text style={[styles.helpText, isDark && styles.textMuted]}>Notes can hold print settings, requirements, blockers or client feedback.</Text> : null}
            <TextInput
              style={[styles.input, styles.textarea, isDark && styles.inputDark]}
              placeholder="Add notes about this task..."
              placeholderTextColor={isDark ? '#64748b' : undefined}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TouchableOpacity
              style={[styles.createSubmitButton, isSaving && styles.disabled]}
              onPress={createJob}
              disabled={isSaving || projects.length === 0 || taskTypes.length === 0}
            >
              <Text style={styles.primaryText} numberOfLines={1} adjustsFontSizeToFit>
                {isSaving
                  ? 'Saving...'
                  : projects.length === 0
                    ? 'No project available'
                    : taskTypes.length === 0
                      ? 'No task types available'
                      : token ? 'Create Task' : 'Login to create'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={[styles.status, isDark && styles.statusDark]}>{status}</Text> : null}

        {selectedJob ? (
          <View style={styles.detailCard}>
            <Text style={styles.kicker}>Task details</Text>
            <Text style={styles.detailTitle}>{selectedJob.title}</Text>
            <Text style={[styles.meta, styles.detailMeta]}>{selectedJob.projectName} - {selectedJob.taskTypeName ?? 'No type'}</Text>
            {selectedJob.isShared ? <Text style={styles.shared}>Shared by {selectedJob.ownerEmail ?? 'another user'}</Text> : null}
            <TextInput style={[styles.input, styles.textarea, isDark && styles.inputDark]} value={notes} onChangeText={setNotes} multiline editable={!selectedJob.isShared} />
            <View style={styles.buttonRow}>
              {selectedJob.status === 'active' ? (
                <TouchableOpacity style={styles.primaryButton} onPress={() => startTimer(selectedJob)} disabled={isSaving}>
                  <Text style={styles.primaryText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>Start timer</Text>
                </TouchableOpacity>
              ) : null}
              {!selectedJob.isShared ? (
                <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={() => updateSelectedJob()} disabled={isSaving}>
                  <Text style={[styles.secondaryText, isDark && styles.secondaryTextDark]} numberOfLines={1} adjustsFontSizeToFit>Save</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {!selectedJob.isShared ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={() => updateSelectedJob('active')} disabled={isSaving}>
                  <Text style={[styles.secondaryText, isDark && styles.secondaryTextDark]} numberOfLines={1} adjustsFontSizeToFit>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={() => updateSelectedJob('paused')} disabled={isSaving}>
                  <Text style={[styles.secondaryText, isDark && styles.secondaryTextDark]} numberOfLines={1} adjustsFontSizeToFit>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={() => updateSelectedJob('completed')} disabled={isSaving}>
                  <Text style={[styles.secondaryText, isDark && styles.secondaryTextDark]} numberOfLines={1} adjustsFontSizeToFit>Complete</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedJob(null)}>
              <Text style={styles.closeText} numberOfLines={1} adjustsFontSizeToFit>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {visibleJobs.length === 0 && !isLoading ? <Text style={[styles.emptyText, isDark && styles.textMuted]}>No jobs found</Text> : null}

        {visibleJobs.map((job) => (
          <TouchableOpacity key={job.id} style={[styles.jobCard, isDark && styles.cardDark]} onPress={() => openJob(job)}>
            <View style={styles.jobHeader}>
              <Text style={[styles.jobTitle, isDark && styles.textLight]}>{job.title}</Text>
              <Text style={[styles.badge, isDark && styles.badgeDark]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{job.status}</Text>
            </View>
            <Text style={[styles.meta, isDark && styles.textMuted]}>{job.projectName} - {job.taskTypeName ?? 'No type'}</Text>
            <Text style={[styles.meta, isDark && styles.textMuted]}>Tracked: {formatDuration(job.totalDurationMinutes ?? 0)}</Text>
            {job.isShared ? <Text style={styles.shared}>Shared by {job.ownerEmail ?? 'another user'}</Text> : null}
            <Text style={[styles.meta, isDark && styles.textMuted]}>Created {formatDate(job.createdAt)}</Text>
          </TouchableOpacity>
        ))}

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
  controlBlock: { gap: 8 },
  filters: { gap: 12, marginVertical: 16 },
  timerCard: { gap: 14, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 16 },
  timerHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  timerTitleWrap: { flex: 1 },
  kickerLight: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  timerTime: { color: '#111827', fontSize: 32, fontWeight: '900', fontFamily: 'monospace', marginTop: 6 },
  timerState: { color: '#64748b', fontSize: 12, marginTop: 4 },
  timerButton: { minWidth: 112, maxWidth: '100%', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  startTimerButton: { backgroundColor: '#34d399' },
  stopTimerButton: { backgroundColor: '#fb7185' },
  timerButtonText: { color: '#052e16', fontWeight: '900', fontSize: 13 },
  timerSelect: { gap: 8 },
  timerMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { maxWidth: '100%', overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#334155', paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '700' },
  metaChipDark: { borderColor: '#334155', backgroundColor: '#020617', color: '#cbd5e1' },
  createCard: { gap: 12, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 16 },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  sectionEyebrow: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  helpText: { color: '#64748b', fontSize: 12, lineHeight: 17 },
  fieldLabel: { color: '#334155', fontSize: 13, fontWeight: '800' },
  formGrid: { gap: 12 },
  formColumn: { gap: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff', color: '#111827' },
  inputDark: { backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  status: { borderRadius: 10, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  statusDark: { backgroundColor: '#172554', color: '#bfdbfe' },
  detailCard: { gap: 12, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16 },
  kicker: { color: '#67e8f9', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  jobCard: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 10 },
  jobHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  jobTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: { maxWidth: 120, overflow: 'hidden', borderRadius: 999, backgroundColor: '#dbeafe', color: '#1e40af', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  badgeDark: { backgroundColor: '#164e63', color: '#cffafe' },
  meta: { marginTop: 4, color: '#64748b', fontSize: 12 },
  detailMeta: { color: '#cbd5e1' },
  shared: { marginTop: 6, color: '#047857', fontSize: 12, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  openCreateButton: { alignItems: 'center', borderRadius: 10, backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 18, marginBottom: 16 },
  openCreateButtonActive: { backgroundColor: '#67e8f9' },
  createSubmitButton: { alignSelf: 'flex-start', minWidth: 148, maxWidth: '100%', alignItems: 'center', borderRadius: 10, backgroundColor: '#10b981', paddingVertical: 11, paddingHorizontal: 18 },
  primaryButton: { flexGrow: 1, flexBasis: 120, alignItems: 'center', borderRadius: 10, backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 10 },
  primaryText: { color: '#052e16', fontWeight: '800' },
  secondaryButton: { flexGrow: 1, flexBasis: 92, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 8 },
  secondaryButtonDark: { borderColor: '#334155', backgroundColor: '#020617' },
  secondaryText: { color: '#111827', fontWeight: '700' },
  secondaryTextDark: { color: '#f8fafc' },
  closeButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingVertical: 12 },
  closeText: { color: '#e2e8f0', fontWeight: '700' },
  disabled: { opacity: 0.65 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 24 },
  spacer: { height: 24 },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
