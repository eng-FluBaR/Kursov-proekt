import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EntryRow, EmptyState, Header, Label, PrimaryButton, SectionTitle, SelectPills, Screen } from '../../3d-jobs-mobile/src/components/tasktimer-ui';

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

const todayEntries = [
	{ project: 'Demo Production Line', color: '#6366f1', icon: 'scan-outline' as const, task: 'Scanning prep', duration: '01:35', date: '09:10' },
	{ project: 'Prototype Lab', color: '#14b8a6', icon: 'cube-outline' as const, task: 'Modeling session', duration: 'Open', date: '11:45' },
	{ project: 'Architectural Model', color: '#0ea5e9', icon: 'print-outline' as const, task: 'Print started', duration: '02:00', date: '13:15' },
	{ project: 'Client Review Queue', color: '#f97316', icon: 'chatbubble-outline' as const, task: 'Feedback review', duration: '00:45', date: '16:30' },
];

function formatTime(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function DashboardScreen() {
	const [project, setProject] = useState<(typeof projects)[number]['value']>(projects[0].value);
	const [taskType, setTaskType] = useState<(typeof taskTypes)[number]['value']>(taskTypes[0].value);
	const [running, setRunning] = useState(true);
	const [elapsed, setElapsed] = useState(7 * 3600 + 42 * 60);

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
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
				<Header title="Dashboard" subtitle="Today's total, quick timer control, and your latest entries." />

				<View style={styles.statsGrid}>
					<Card style={styles.heroCard}>
						<Text style={styles.heroLabel}>Today's total time</Text>
						<Text style={styles.heroValue}>07h 42m</Text>
						<Text style={styles.heroText}>92% of the target is already complete.</Text>
					</Card>
					<Card style={styles.smallStatCard}>
						<Ionicons name="play-circle-outline" size={22} color="#67e8f9" />
						<Text style={styles.smallStatValue}>1</Text>
						<Text style={styles.smallStatLabel}>Active timer</Text>
					</Card>
				</View>

				<Card>
					<SectionTitle title="Active timer" />
					<View style={styles.timerBox}>
						<Text style={[styles.timerDigits, { color: selectedProject.color }]}>{formatTime(elapsed)}</Text>
						<Text style={styles.timerMeta}>{selectedProject.label}</Text>
						<Text style={styles.timerMeta}>{selectedTask.label}</Text>
					</View>

					<Label>Project</Label>
					<SelectPills value={project} options={projects as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setProject} />

					<Label>Task type</Label>
					<SelectPills value={taskType} options={taskTypes as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setTaskType} />

					<View style={styles.buttonRow}>
						<PrimaryButton title={running ? 'Stop' : 'Start'} variant={running ? 'danger' : 'success'} onPress={() => setRunning((current) => !current)} style={{ flex: 1 }} />
						<PrimaryButton title="Pause" variant="dark" onPress={() => setRunning(false)} style={{ flex: 1 }} />
					</View>
				</Card>

				<SectionTitle title="Today's entries" />
				{todayEntries.length ? (
					<Card style={{ paddingVertical: 8 }}>
						{todayEntries.map((entry) => (
							<EntryRow
								key={`${entry.project}-${entry.date}`}
								projectColor={entry.color}
								taskIcon={entry.icon}
								project={entry.project}
								task={entry.task}
								duration={entry.duration}
								date={entry.date}
							/>
						))}
					</Card>
				) : (
					<EmptyState title="No entries yet" description="The list will populate once tracking starts." />
				)}
			</ScrollView>
		</Screen>
	);
}

const styles = StyleSheet.create({
	statsGrid: {
		flexDirection: 'row',
		gap: 12,
	},
	heroCard: {
		flex: 1,
	},
	heroLabel: {
		color: '#94a3b8',
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 1.4,
		fontWeight: '800',
	},
	heroValue: {
		color: '#f8fafc',
		fontSize: 28,
		fontWeight: '900',
		marginTop: 10,
	},
	heroText: {
		color: '#94a3b8',
		marginTop: 8,
		lineHeight: 20,
	},
	smallStatCard: {
		width: 120,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	smallStatValue: {
		color: '#f8fafc',
		fontSize: 30,
		fontWeight: '900',
	},
	smallStatLabel: {
		color: '#94a3b8',
		fontSize: 12,
		textAlign: 'center',
	},
	timerBox: {
		alignItems: 'center',
		paddingVertical: 14,
		marginBottom: 12,
	},
	timerDigits: {
		fontSize: 42,
		fontWeight: '900',
		letterSpacing: 1.2,
	},
	timerMeta: {
		color: '#cbd5e1',
		marginTop: 4,
		fontWeight: '700',
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 14,
	},
});
