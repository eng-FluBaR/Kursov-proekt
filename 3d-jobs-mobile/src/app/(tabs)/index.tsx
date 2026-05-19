import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { getTodayEntries, getProject } from '@/mockData';

export default function DashboardScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const todayEntries = getTodayEntries();
  const totalMinutesToday = todayEntries.reduce((sum, e) => sum + e.duration, 0);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>📊 Dashboard</Text>

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today&apos;s Total</Text>
            <Text style={styles.statValue}>{Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tasks</Text>
            <Text style={styles.statValue}>{todayEntries.length}</Text>
          </View>
        </View>

        {/* Timer Widget */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Active Timer</Text>
          <Text style={styles.timerDisplay}>
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <View style={styles.buttonRow}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={() => setIsRunning(true)}
              >
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={() => setIsRunning(false)}
              >
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Today's Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Entries</Text>
          {todayEntries.length === 0 ? (
            <Text style={styles.emptyText}>No entries yet</Text>
          ) : (
            todayEntries.map(entry => {
              const project = getProject(entry.projectId);
              return (
                <View key={entry.id} style={styles.entryItem}>
                  <View
                    style={[styles.colorDot, { backgroundColor: project?.color }]}
                  />
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>{project?.name}</Text>
                    <Text style={styles.entrySubtitle}>
                      {entry.taskType} • {entry.startTime}-{entry.endTime}
                    </Text>
                  </View>
                  <Text style={styles.entryDuration}>{entry.duration}m</Text>
                </View>
              );
            })
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
  scroll: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  timerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#3B82F6',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  entrySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  entryDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
});
