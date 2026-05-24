import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppMenu } from '@/components/app-menu';
import { PreviewHint } from '@/components/preview-hint';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest } from '@/lib/api';

type AdminStats = {
  totals?: Record<string, number>;
};

export default function AdminScreen() {
  const { token, user } = useAuth();
  const { isDark } = useAppTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const loadStats = useCallback(async () => {
    if (!token || user?.role !== 'admin') {
      return;
    }

    setStatus('');
    setIsLoading(true);

    try {
      const response = await apiRequest<AdminStats>('/api/admin/stats', { token });
      setStats(response);
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load admin stats.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.role]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="Admin" />
        <Text style={[styles.title, isDark && styles.textLight]}>Admin</Text>
        {!token ? <PreviewHint>Admin is available only after login with an admin account.</PreviewHint> : null}

        {user?.role !== 'admin' ? (
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>{token ? 'Admin account required' : 'Login as admin'}</Text>
          </TouchableOpacity>
        ) : null}

        {isLoading ? <ActivityIndicator /> : null}
        {status ? <Text style={[styles.status, isDark && styles.statusDark]}>{status}</Text> : null}

        {stats?.totals ? (
          <View style={styles.grid}>
            {Object.entries(stats.totals).map(([key, value]) => (
              typeof value === 'number' ? (
                <View key={key} style={[styles.card, isDark && styles.cardDark]}>
                  <Text style={[styles.label, isDark && styles.textMuted]}>{key.replace(/Count$/, '')}</Text>
                  <Text style={[styles.value, isDark && styles.textLight]}>{value}</Text>
                </View>
              ) : null
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  grid: { gap: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#f8fafc', padding: 16 },
  cardDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  label: { color: '#64748b', fontWeight: '800', textTransform: 'capitalize' },
  value: { marginTop: 6, color: '#111827', fontSize: 24, fontWeight: '900' },
  status: { borderRadius: 10, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: 12, marginBottom: 12 },
  statusDark: { backgroundColor: '#172554', color: '#bfdbfe' },
  loginButton: { borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', paddingVertical: 14, marginBottom: 12 },
  buttonText: { color: '#fff', fontWeight: '900' },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
