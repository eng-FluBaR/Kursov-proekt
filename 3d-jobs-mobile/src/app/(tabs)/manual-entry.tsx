import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SimpleSelect } from '@/components/simple-select';
import { PreviewHint } from '@/components/preview-hint';
import { AppMenu } from '@/components/app-menu';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, Project, TaskType } from '@/lib/api';
import { previewProjects, previewTaskTypes } from '@/lib/preview-data';

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function durationBetween(startDate: string, startTime: string, endDate: string, endTime: string) {
  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export default function ManualEntryScreen() {
  const { token } = useAuth();
  const { isDark } = useAppTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [projectId, setProjectId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [note, setNote] = useState('');
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

  const loadOptions = useCallback(async () => {
    if (!token) {
      setProjects(previewProjects);
      setTaskTypes(previewTaskTypes);
      setProjectId((current) => current || previewProjects[0]?.id || '');
      setTaskTypeId((current) => current || previewTaskTypes[0]?.id || '');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [projectsResponse, taskTypesResponse] = await Promise.all([
        apiRequest<{ projects: Project[] }>('/api/mobile/projects', { token }),
        apiRequest<{ taskTypes: TaskType[] }>('/api/mobile/task-types', { token }),
      ]);
      setProjects(projectsResponse.projects);
      setTaskTypes(taskTypesResponse.taskTypes);
      setProjectId((current) => current || projectsResponse.projects[0]?.id || '');
      setTaskTypeId((current) => current || taskTypesResponse.taskTypes[0]?.id || '');
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load options.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadOptions(); }, [loadOptions]));

  async function saveEntry() {
    if (!token || !projectId || !taskTypeId) {
      if (!token) {
        setStatus('Login to save a manual entry.');
        router.push('/login');
        return;
      }
      setStatus('Choose a project and task type first.');
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
          startedAt: toIsoDateTime(date, startTime),
          endedAt: toIsoDateTime(date, endTime),
          durationMinutes: durationBetween(date, startTime, date, endTime),
          note,
        },
      });
      setNote('');
      setStatus('Entry saved.');
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not save entry.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="Manual log" />
        <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Log Entry</Text>
        {!token ? (
          <PreviewHint>
            Manual entries are for work you forgot to start with the timer. Pick project, task type, date, start/end time and notes.
          </PreviewHint>
        ) : null}
        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={[styles.status, isDark && styles.statusDark]}>{status}</Text> : null}

        <View style={styles.section}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Project</Text>
          <SimpleSelect value={projectId} options={projectOptions} onChange={setProjectId} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Task Type</Text>
          <SimpleSelect value={taskTypeId} options={taskTypeOptions} onChange={setTaskTypeId} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Date</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="YYYY-MM-DD" placeholderTextColor={isDark ? '#64748b' : undefined} value={date} onChangeText={setDate} />
        </View>

        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={[styles.label, isDark && styles.textMuted]}>Start Time</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="HH:MM" placeholderTextColor={isDark ? '#64748b' : undefined} value={startTime} onChangeText={setStartTime} />
          </View>
          <View style={styles.halfSection}>
            <Text style={[styles.label, isDark && styles.textMuted]}>End Time</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="HH:MM" placeholderTextColor={isDark ? '#64748b' : undefined} value={endTime} onChangeText={setEndTime} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Notes</Text>
          <TextInput style={[styles.input, styles.textarea, isDark && styles.inputDark]} placeholder="What did you work on?" placeholderTextColor={isDark ? '#64748b' : undefined} value={note} onChangeText={setNote} multiline numberOfLines={4} />
        </View>

        <TouchableOpacity style={[styles.submitButton, isSaving && styles.buttonDisabled]} onPress={saveEntry} disabled={isSaving}>
          <Text style={styles.submitButtonText} numberOfLines={1} adjustsFontSizeToFit>{isSaving ? 'Saving...' : token ? 'Save Entry' : 'Login to save'}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  inputDark: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' },
  textarea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  halfSection: { flexGrow: 1, flexBasis: 130, marginBottom: 16 },
  submitButton: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  status: { borderRadius: 8, backgroundColor: '#f0f9ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  statusDark: { backgroundColor: '#172554', color: '#bfdbfe' },
  spacer: { height: 20 },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
