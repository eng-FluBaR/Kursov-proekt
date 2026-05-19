import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Picker } from 'react-native';
import { MOCK_PROJECTS } from '@/mockData';

export default function ManualEntryScreen() {
  const [projectId, setProjectId] = useState('1');
  const [taskType, setTaskType] = useState('Design');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [note, setNote] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>➕ Log Entry</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={projectId}
              onValueChange={setProjectId}
              style={styles.picker}
            >
              {MOCK_PROJECTS.map(p => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Task Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={taskType}
              onValueChange={setTaskType}
              style={styles.picker}
            >
              <Picker.Item label="Design" value="Design" />
              <Picker.Item label="Development" value="Development" />
              <Picker.Item label="Testing" value="Testing" />
              <Picker.Item label="Documentation" value="Documentation" />
              <Picker.Item label="Meeting" value="Meeting" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="What did you work on?"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Attachment</Text>
          <TouchableOpacity style={styles.fileButton}>
            <Text style={styles.fileButtonText}>📸 Pick Image or 3D File</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Accepted: .jpg .png .webp .stl .obj .3mf .step</Text>
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Save Entry</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
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
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfSection: {
    flex: 1,
    marginBottom: 16,
  },
  fileButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
  },
  fileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  spacer: {
    height: 20,
  },
});
