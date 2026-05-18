import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Header, Label, PrimaryButton, Screen, SelectPills, TimerDigits } from '../../3d-jobs-mobile/src/components/tasktimer-ui';

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

export default function TimerScreen() {
	const [project, setProject] = useState<(typeof projects)[number]['value']>(projects[2].value);
	const [taskType, setTaskType] = useState<(typeof taskTypes)[number]['value']>(taskTypes[0].value);
	const [running, setRunning] = useState(true);
	const [elapsed, setElapsed] = useState(5 * 3600 + 18 * 60 + 42);

	useEffect(() => {
		if (!running) {
			return;
		}

		const timer = setInterval(() => {
			setElapsed((current) => current + 1);
		}, 1000);

		return () => clearInterval(timer);
	}, [running]);

	const selectedProject = useMemo(() => projects.find((item) => item.value === project) ?? projects[0], [project]);
	const selectedTask = useMemo(() => taskTypes.find((item) => item.value === taskType) ?? taskTypes[0], [taskType]);

	return (
		<Screen>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Header title="Timer" subtitle="Large countdown-style digits, project colour, and direct controls." />

				<View style={[styles.hero, { borderColor: `${selectedProject.color}33`, backgroundColor: `${selectedProject.color}16` }]}>
					<Text style={styles.heroLabel}>Active project</Text>
					<Text style={styles.heroProject}>{selectedProject.label}</Text>
					<TimerDigits value={formatTime(elapsed)} accent={selectedProject.color} />
					<Text style={styles.heroTask}>{selectedTask.label}</Text>
				</View>

				<Card>
					<Label>Project</Label>
					<SelectPills value={project} options={projects as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setProject} />

					<Label>Task type</Label>
					<SelectPills value={taskType} options={taskTypes as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setTaskType} />

					<View style={styles.buttonRow}>
						<PrimaryButton title={running ? 'Pause' : 'Start'} variant={running ? 'dark' : 'success'} onPress={() => setRunning((current) => !current)} style={{ flex: 1 }} />
						<PrimaryButton title="Stop" variant="danger" onPress={() => setRunning(false)} style={{ flex: 1 }} />
					</View>
				</Card>

				<Card>
					<Text style={styles.cardTitle}>Quick notes</Text>
					<Text style={styles.cardText}>This screen is meant for a single focus session. The timer and the project colour are intentionally dominant.</Text>
				</Card>
			</ScrollView>
		</Screen>
	);
}

function formatTime(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

const styles = StyleSheet.create({
	content: {
		paddingBottom: 24,
	},
	hero: {
		alignItems: 'center',
		borderRadius: 28,
		borderWidth: 1,
		paddingVertical: 30,
		paddingHorizontal: 18,
		marginBottom: 14,
	},
	heroLabel: {
		color: '#94a3b8',
		textTransform: 'uppercase',
		letterSpacing: 1.3,
		fontSize: 11,
		fontWeight: '800',
	},
	heroProject: {
		color: '#f8fafc',
		fontSize: 22,
		fontWeight: '800',
		marginTop: 10,
		marginBottom: 24,
		textAlign: 'center',
	},
	heroTask: {
		color: '#cbd5e1',
		marginTop: 18,
		fontSize: 16,
		fontWeight: '700',
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 14,
	},
	cardTitle: {
		color: '#f8fafc',
		fontSize: 17,
		fontWeight: '800',
	},
	cardText: {
		color: '#94a3b8',
		lineHeight: 20,
		marginTop: 8,
	},
});
