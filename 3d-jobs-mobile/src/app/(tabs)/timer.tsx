import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SimpleSelect } from '@/components/simple-select';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, Project, TaskType } from '@/lib/api';

export default function TimerScreen() {
  const { token } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [taskType, setTaskType] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const projectOptions = useMemo(
    () => projects.map((project) => ({ label: project.name, value: project.id, color: project.color })),
    [projects],
  );
  const taskTypeOptions = useMemo(
    () => taskTypes.map((item) => ({ label: item.name, value: item.id })),
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
      setSelectedProject((current) => current || projectsResponse.projects[0]?.id || '');
      setTaskType((current) => current || taskTypesResponse.taskTypes[0]?.id || '');
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load timer options.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadOptions(); }, [loadOptions]));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning) {
      interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const selectedProjectObj = projects.find((project) => project.id === selectedProject);

  function startTimer() {
    setStatus('');
    setStartedAt(new Date());
    setElapsed(0);
    setIsRunning(true);
  }

  async function stopTimer() {
    if (!token || !startedAt || !selectedProject || !taskType) {
      setStatus('Choose a project and task type first.');
      return;
    }

    const endedAt = new Date();
    setIsRunning(false);

    try {
      await apiRequest('/api/mobile/time-entries', {
        method: 'POST',
        token,
        body: {
          projectId: selectedProject,
          taskTypeId: taskType,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationMinutes: Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)),
          note: 'Tracked from mobile timer',
        },
      });
      setElapsed(0);
      setStartedAt(null);
      setStatus('Timer entry saved.');
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not save timer entry.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Timer</Text>
        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={[styles.displayCard, selectedProjectObj && { borderColor: selectedProjectObj.color }]}>
          <Text style={styles.displayTime}>
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <Text style={styles.displayLabel}>{selectedProjectObj?.name || 'Select Project'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          <SimpleSelect value={selectedProject} options={projectOptions} onChange={setSelectedProject} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Task Type</Text>
          <SimpleSelect value={taskType} options={taskTypeOptions} onChange={setTaskType} />
        </View>

        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity style={[styles.controlButton, styles.startButton]} onPress={startTimer}>
              <Text style={styles.controlButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopTimer}>
              <Text style={styles.controlButtonText}>Stop and Save</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  displayCard: { backgroundColor: '#f0f9ff', borderWidth: 3, borderColor: '#3B82F6', borderRadius: 16, padding: 40, alignItems: 'center', marginBottom: 20 },
  displayTime: { fontSize: 56, fontWeight: 'bold', fontFamily: 'monospace', color: '#3B82F6', marginBottom: 12 },
  displayLabel: { fontSize: 16, fontWeight: '600', color: '#666' },
  section: { marginVertical: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  controls: { flexDirection: 'row', gap: 12, marginTop: 20 },
  controlButton: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  startButton: { backgroundColor: '#10B981' },
  stopButton: { backgroundColor: '#EF4444' },
  controlButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  status: { borderRadius: 8, backgroundColor: '#f0f9ff', color: '#1d4ed8', padding: 12 },
});
