import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppMenu } from '@/components/app-menu';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';

export default function SettingsScreen() {
  const { token, user, logout } = useAuth();
  const { isDark, mode, toggleTheme } = useAppTheme();

  async function handleAuthAction() {
    if (token) {
      await logout();
      return;
    }

    router.push('/login');
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scroll}>
        <AppMenu title="Settings" />
        <Text style={[styles.title, isDark && styles.textLight]}>Settings</Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Account</Text>
          <Text style={[styles.value, isDark && styles.textLight]}>{user?.email ?? 'Review mode'}</Text>
        </View>

        <TouchableOpacity style={[styles.card, isDark && styles.cardDark]} onPress={toggleTheme}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Appearance</Text>
          <Text style={[styles.value, isDark && styles.textLight]}>{mode === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.authButton, token ? styles.logoutButton : styles.loginButton]} onPress={handleAuthAction}>
          <Text style={styles.authText}>{token ? 'Logout' : 'Login'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#f8fafc', padding: 16, marginBottom: 12 },
  cardDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  label: { color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  value: { color: '#111827', fontSize: 16, fontWeight: '800' },
  authButton: { marginTop: 10, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  loginButton: { backgroundColor: '#2563eb' },
  logoutButton: { backgroundColor: '#ef4444' },
  authText: { color: '#fff', fontWeight: '900' },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
