import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SimpleSelect } from '@/components/simple-select';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, Project, TaskType } from '@/lib/api';

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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Log Entry</Text>
        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          <SimpleSelect value={projectId} options={projectOptions} onChange={setProjectId} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Task Type</Text>
          <SimpleSelect value={taskTypeId} options={taskTypeOptions} onChange={setTaskTypeId} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
        </View>

        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput style={styles.input} placeholder="HH:MM" value={startTime} onChangeText={setStartTime} />
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.label}>End Time</Text>
            <TextInput style={styles.input} placeholder="HH:MM" value={endTime} onChangeText={setEndTime} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="What did you work on?" value={note} onChangeText={setNote} multiline numberOfLines={4} />
        </View>

        <TouchableOpacity style={[styles.submitButton, isSaving && styles.buttonDisabled]} onPress={saveEntry} disabled={isSaving}>
          <Text style={styles.submitButtonText}>{isSaving ? 'Saving...' : 'Save Entry'}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  textarea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfSection: { flex: 1, marginBottom: 16 },
  submitButton: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  status: { borderRadius: 8, backgroundColor: '#f0f9ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  spacer: { height: 20 },
});
