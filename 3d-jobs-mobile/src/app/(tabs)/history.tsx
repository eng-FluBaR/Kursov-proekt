import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Picker } from 'react-native';
import { MOCK_ENTRIES, MOCK_PROJECTS, getProject } from '@/mockData';

export default function HistoryScreen() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const filteredEntries = selectedProject
    ? MOCK_ENTRIES.filter(e => e.projectId === selectedProject)
    : MOCK_ENTRIES;

  const groupedByDate = filteredEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    },
    {} as Record<string, typeof MOCK_ENTRIES>
  );

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>📜 History</Text>

        {/* Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.label}>Filter by Project</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProject}
              onValueChange={setSelectedProject}
              style={styles.picker}
            >
              <Picker.Item label="All Projects" value={null} />
              {MOCK_PROJECTS.map(p => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Grouped Entries */}
        {filteredEntries.length === 0 ? (
          <Text style={styles.emptyText}>No entries found</Text>
        ) : (
          sortedDates.map(date => {
            const entries = groupedByDate[date];
            return (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{new Date(date + 'T00:00:00').toLocaleDateString()}</Text>
                {entries.map(entry => {
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
                        {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
                      </View>
                      <Text style={styles.entryDuration}>{entry.duration}m</Text>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
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
  filterSection: {
    marginBottom: 20,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40,
    fontSize: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginBottom: 4,
  },
  entryNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  entryDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
