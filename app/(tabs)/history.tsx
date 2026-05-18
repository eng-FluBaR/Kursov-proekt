import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, EntryRow, Header, Label, Screen, SelectPills } from '../../3d-jobs-mobile/src/components/tasktimer-ui';

const projects = [
	{ value: 'all', label: 'All projects', color: '#94a3b8' },
	{ value: 'demo-production', label: 'Demo Production Line', color: '#6366f1' },
	{ value: 'architectural-model', label: 'Architectural Model', color: '#0ea5e9' },
	{ value: 'prototype-lab', label: 'Prototype Lab', color: '#14b8a6' },
	{ value: 'client-review', label: 'Client Review Queue', color: '#f97316' },
] as const;

const historyData = [
	{
		date: 'Today',
		entries: [
			{ project: 'Demo Production Line', color: '#6366f1', icon: 'scan-outline' as const, task: 'Scanning prep', duration: '01:35', time: '09:10' },
			{ project: 'Prototype Lab', color: '#14b8a6', icon: 'cube-outline' as const, task: 'Modeling session', duration: 'Open', time: '11:45' },
		],
	},
	{
		date: 'Yesterday',
		entries: [
			{ project: 'Architectural Model', color: '#0ea5e9', icon: 'print-outline' as const, task: 'Print started', duration: '02:00', time: '13:15' },
			{ project: 'Client Review Queue', color: '#f97316', icon: 'chatbubble-outline' as const, task: 'Feedback review', duration: '00:45', time: '16:30' },
		],
	},
	{
		date: '2 days ago',
		entries: [
			{ project: 'Prototype Lab', color: '#14b8a6', icon: 'color-palette-outline' as const, task: 'Post-processing cleanup', duration: '01:00', time: '17:05' },
			{ project: 'Demo Production Line', color: '#6366f1', icon: 'search-outline' as const, task: 'Research', duration: '00:50', time: '19:20' },
		],
	},
] as const;

export default function HistoryScreen() {
	const [project, setProject] = useState<(typeof projects)[number]['value']>('all');

	const groupedEntries = useMemo(() => {
		if (project === 'all') {
			return historyData;
		}

		return historyData
			.map((group) => ({
				date: group.date,
				entries: group.entries.filter((entry) => entry.project.toLowerCase().includes(project.replaceAll('-', ' '))),
			}))
			.filter((group) => group.entries.length > 0);
	}, [project]);

	return (
		<Screen>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
				<Header title="History" subtitle="A grouped list of past entries with a project filter." />

				<Card>
					<Label>Filter by project</Label>
					<SelectPills value={project} options={projects as unknown as Array<{ value: string; label: string; color?: string }>} onChange={setProject} />
				</Card>

				{groupedEntries.length ? (
					groupedEntries.map((group) => (
						<View key={group.date} style={styles.groupBlock}>
							<Text style={styles.groupTitle}>{group.date}</Text>
							<Card style={{ paddingVertical: 8 }}>
								{group.entries.map((entry) => (
									<EntryRow
										key={`${group.date}-${entry.project}-${entry.time}`}
										projectColor={entry.color}
										taskIcon={entry.icon}
										project={entry.project}
										task={entry.task}
										duration={entry.duration}
										date={entry.time}
									/>
								))}
							</Card>
						</View>
					))
				) : (
					<EmptyState title="No history found" description="Try a different project filter or seed more mock entries later." />
				)}
			</ScrollView>
		</Screen>
	);
}

const styles = StyleSheet.create({
	groupBlock: {
		marginBottom: 10,
	},
	groupTitle: {
		color: '#cbd5e1',
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		fontWeight: '800',
		marginBottom: 10,
		marginTop: 4,
	},
});
