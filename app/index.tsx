import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Field, Header, PrimaryButton, Screen } from '../3d-jobs-mobile/src/components/tasktimer-ui';

const demoStats = [
	{ label: 'Projects tracked', value: '184' },
	{ label: 'Files uploaded', value: '642' },
	{ label: 'Hours saved', value: '1,248' },
];

export default function LoginScreen() {
	const router = useRouter();
	const [email, setEmail] = useState('demo@tasktimer.app');
	const [password, setPassword] = useState('demo123');

	return (
		<SafeAreaView style={styles.safeArea}>
			<Screen style={styles.screen}>
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
					<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
						<Header title="Login" subtitle="Sign in to your TaskTimer workspace. Mock UI only for now." />

						<Card>
							<View style={styles.formGap}>
								<View>
									<Text style={styles.label}>Email</Text>
									<Field value={email} onChangeText={setEmail} placeholder="you@studio.com" keyboardType="email-address" />
								</View>
								<View>
									<Text style={styles.label}>Password</Text>
									<Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
								</View>
								<PrimaryButton title="Login" onPress={() => router.push('/dashboard')} />
							</View>
						</Card>

						<Card>
							<Text style={styles.cardTitle}>Demo accounts</Text>
							<Text style={styles.cardText}>Use these values to preview the rest of the app later.</Text>
							<View style={styles.demoBlock}>
								<Text style={styles.demoLine}>admin@tasktimer.app / admin123</Text>
								<Text style={styles.demoLine}>demo@tasktimer.app / demo123</Text>
							</View>
						</Card>

						<View style={styles.statsRow}>
							{demoStats.map((stat) => (
								<View key={stat.label} style={styles.statCard}>
									<Text style={styles.statValue}>{stat.value}</Text>
									<Text style={styles.statLabel}>{stat.label}</Text>
								</View>
							))}
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</Screen>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#07111f',
	},
	screen: {
		paddingTop: 0,
	},
	content: {
		paddingBottom: 24,
	},
	formGap: {
		gap: 14,
	},
	label: {
		color: '#cbd5e1',
		fontWeight: '700',
		marginBottom: 8,
		fontSize: 13,
	},
	cardTitle: {
		color: '#f8fafc',
		fontSize: 18,
		fontWeight: '800',
	},
	cardText: {
		color: '#94a3b8',
		marginTop: 8,
		lineHeight: 20,
	},
	demoBlock: {
		marginTop: 14,
		gap: 10,
	},
	demoLine: {
		color: '#e2e8f0',
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
		overflow: 'hidden',
	},
	statsRow: {
		flexDirection: 'row',
		gap: 10,
	},
	statCard: {
		flex: 1,
		borderRadius: 20,
		padding: 14,
		backgroundColor: 'rgba(15, 23, 42, 0.9)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
	},
	statValue: {
		color: '#67e8f9',
		fontSize: 24,
		fontWeight: '900',
	},
	statLabel: {
		color: '#94a3b8',
		marginTop: 6,
		fontSize: 12,
	},
});
