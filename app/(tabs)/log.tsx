import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Header, Label, PrimaryButton, Screen, SelectPills } from '../../3d-jobs-mobile/src/components/tasktimer-ui';

const projects = [
	{ value: 'demo-production', label: 'Demo Production Line', color: '#6366f1' },
	{ value: 'architectural-model', label: 'Architectural Model', color: '#0ea5e9' },
	{ value: 'prototype-lab', label: 'Prototype Lab', color: '#14b8a6' },
	{ value: 'client-review', label: 'Client Review Queue', color: '#f97316' },
] as const;

const taskTypes = [
	{ value: 'modelling', label: '3D Modelling' },
	{ value: 'printing', label: '3D Printing' },
	{ value: 'scanning', label: '3D Scanning' },
	{ value: 'review', label: 'Client review' },
] as const;

const fileTypes = '.jpg .png .webp .stl .obj .3mf .step';

export default function LogScreen() {
	const [project, setProject] = useState<(typeof projects)[number]['value']>(projects[0].value);
	const [taskType, setTaskType] = useState<(typeof taskTypes)[number]['value']>(taskTypes[1].value);
	const [date, setDate] = useState(new Date());
	const [startTime, setStartTime] = useState(new Date());
	const [endTime, setEndTime] = useState(new Date(Date.now() + 90 * 60 * 1000));
	const [note, setNote] = useState('');
	const [attachments, setAttachments] = useState<string[]>([]);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const selectedProject = useMemo(() => projects.find((item) => item.value === project) ?? projects[0], [project]);

	const pickFromLibrary = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsMultipleSelection: true,
			quality: 0.8,
		});

		if (!result.canceled) {
			setAttachments((current) => [
				...current,
				...result.assets.map((asset) => asset.fileName ?? asset.uri.split('/').pop() ?? 'attachment'),
			]);
		}
	};

	const openCamera = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) {
			return;
		}

		const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
		if (!result.canceled) {
			setAttachments((current) => [...current, result.assets[0].fileName ?? `camera-${current.length + 1}.jpg`]);
		}
	};

	const onDateChange = (_event: DateTimePickerEvent, pickedDate?: Date) => {
		setShowDatePicker(Platform.OS === 'ios');
		if (pickedDate) {
			setDate(pickedDate);
		}
	};

	const onStartChange = (_event: DateTimePickerEvent, pickedDate?: Date) => {
		setShowStartPicker(Platform.OS === 'ios');
		if (pickedDate) {
			setStartTime(pickedDate);
		}
	};

	const onEndChange = (_event: DateTimePickerEvent, pickedDate?: Date) => {
		setShowEndPicker(Platform.OS === 'ios');
		if (pickedDate) {
			setEndTime(pickedDate);
		}
	};

	return (
		<Screen>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
				<Header title="Manual entry" subtitle="Log an entry without the timer. Use the native camera or gallery picker for attachments." />

				<Card>
					<Label>Project</Label>
					<SelectPills value={project} options={projects as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setProject} />

					<Label>Task type</Label>
					<SelectPills value={taskType} options={taskTypes as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setTaskType} />

					<View style={styles.grid2}>
						<View style={{ flex: 1 }}>
							<Label>Date</Label>
							<Pressable style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
								<Text style={styles.pickerButtonText}>{formatDate(date)}</Text>
							</Pressable>
						</View>
						<View style={{ flex: 1 }}>
							<Label>Start</Label>
							<Pressable style={styles.pickerButton} onPress={() => setShowStartPicker(true)}>
								<Text style={styles.pickerButtonText}>{formatTime(startTime)}</Text>
							</Pressable>
						</View>
						<View style={{ flex: 1 }}>
							<Label>End</Label>
							<Pressable style={styles.pickerButton} onPress={() => setShowEndPicker(true)}>
								<Text style={styles.pickerButtonText}>{formatTime(endTime)}</Text>
							</Pressable>
						</View>
					</View>

					{showDatePicker ? <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} /> : null}
					{showStartPicker ? <DateTimePicker value={startTime} mode="time" display="default" onChange={onStartChange} /> : null}
					{showEndPicker ? <DateTimePicker value={endTime} mode="time" display="default" onChange={onEndChange} /> : null}

					<Label>Note</Label>
					<TextInput
						value={note}
						onChangeText={setNote}
						placeholder="Add context, blockers, or results"
						placeholderTextColor="#64748b"
						multiline
						style={styles.noteInput}
					/>

					<Label>File picker</Label>
					<Text style={styles.helperText}>Accepts {fileTypes}</Text>
					<View style={styles.buttonRow}>
						<PrimaryButton title="Open camera" variant="dark" onPress={openCamera} style={{ flex: 1 }} />
						<PrimaryButton title="Open gallery" variant="dark" onPress={pickFromLibrary} style={{ flex: 1 }} />
					</View>

					{attachments.length ? (
						<View style={styles.attachmentList}>
							{attachments.map((attachment) => (
								<View key={attachment} style={styles.attachmentChip}>
									<Text style={styles.attachmentText}>{attachment}</Text>
								</View>
							))}
						</View>
					) : null}

					<View style={styles.buttonRow}>
						<PrimaryButton title="Save entry" variant="success" style={{ flex: 1 }} />
					</View>
					<Text style={styles.note}>Manual entries stay local and mock-only for now. No real API calls.</Text>
				</Card>

				<Card>
					<Text style={styles.cardTitle}>Quick preview</Text>
					<Text style={styles.cardText}>Selected project: {selectedProject.label}</Text>
					<Text style={styles.cardText}>Attached files: {attachments.length || 'none yet'}</Text>
				</Card>
			</ScrollView>
		</Screen>
	);
}

function formatDate(date: Date) {
	return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date: Date) {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
	grid2: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginTop: 12,
		marginBottom: 12,
	},
	pickerButton: {
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.09)',
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 14,
	},
	pickerButtonText: {
		color: '#f8fafc',
		fontWeight: '700',
	},
	helperText: {
		color: '#94a3b8',
		marginBottom: 10,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 14,
	},
	attachmentList: {
		gap: 10,
		marginTop: 14,
	},
	attachmentChip: {
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	attachmentText: {
		color: '#e2e8f0',
	},
	note: {
		color: '#64748b',
		marginTop: 10,
		fontSize: 12,
	},
	noteInput: {
		minHeight: 96,
		backgroundColor: 'rgba(255,255,255,0.04)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.09)',
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 14,
		color: '#f8fafc',
		textAlignVertical: 'top',
	},
	cardTitle: {
		color: '#f8fafc',
		fontSize: 17,
		fontWeight: '800',
	},
	cardText: {
		color: '#94a3b8',
		marginTop: 8,
		lineHeight: 20,
	},
});
