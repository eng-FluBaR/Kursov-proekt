import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Picker } from 'react-native';
import { MOCK_PROJECTS } from '@/mockData';

export default function TimerScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedProject, setSelectedProject] = useState('1');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const selectedProjectObj = MOCK_PROJECTS.find(p => p.id === selectedProject);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⏲️ Timer</Text>

        {/* Large Display */}
        <View style={[styles.displayCard, selectedProjectObj && { borderColor: selectedProjectObj.color }]}>
          <Text style={styles.displayTime}>
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <Text style={styles.displayLabel}>{selectedProjectObj?.name || 'Select Project'}</Text>
        </View>

        {/* Project Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProject}
              onValueChange={setSelectedProject}
              style={styles.picker}
            >
              {MOCK_PROJECTS.map(project => (
                <Picker.Item key={project.id} label={project.name} value={project.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Task Type Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Task Type</Text>
          <View style={styles.pickerContainer}>
            <Picker style={styles.picker}>
              <Picker.Item label="Design" value="Design" />
              <Picker.Item label="Development" value="Development" />
              <Picker.Item label="Testing" value="Testing" />
              <Picker.Item label="Documentation" value="Documentation" />
              <Picker.Item label="Meeting" value="Meeting" />
            </Picker>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={() => setIsRunning(true)}
            >
              <Text style={styles.controlButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={() => setIsRunning(false)}
              >
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={() => {
                  setIsRunning(false);
                  setElapsed(0);
                }}
              >
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  displayCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  displayTime: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#3B82F6',
    marginBottom: 12,
  },
  displayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  section: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
