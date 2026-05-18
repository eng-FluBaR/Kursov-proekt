import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '../../3d-jobs-mobile/src/components/haptic-tab';

const TAB_BAR_BG = '#06111f';
const TAB_ACTIVE = '#38bdf8';
const TAB_INACTIVE = '#64748b';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarActiveTintColor: TAB_ACTIVE,
				tabBarInactiveTintColor: TAB_INACTIVE,
				tabBarStyle: {
					backgroundColor: TAB_BAR_BG,
					borderTopColor: 'rgba(255,255,255,0.08)',
					height: 84,
					paddingTop: 10,
					paddingBottom: 14,
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: '600',
				},
			}}
		>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: 'Dashboard',
					tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size ?? 22} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="timer"
				options={{
					title: 'Timer',
					tabBarIcon: ({ color, size }) => <Ionicons name="timer-outline" size={size ?? 22} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="log"
				options={{
					title: 'Log',
					tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size ?? 22} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: 'History',
					tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size ?? 22} color={color} />,
				}}
			/>
		</Tabs>
	);
}
