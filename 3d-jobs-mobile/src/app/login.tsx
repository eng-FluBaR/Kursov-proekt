import { Link, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const { isDark, mode, toggleTheme } = useAppTheme();
  const [email, setEmail] = useState('admin@tasktimer.app');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={[styles.themeButton, isDark && styles.themeButtonDark]} onPress={toggleTheme}>
          <Text style={[styles.themeText, isDark && styles.textLight]}>{mode === 'dark' ? 'Light mode' : 'Dark mode'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.textLight]}>TaskTimer</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>Login with your web account.</Text>

        <View style={styles.form}>
          <Text style={[styles.label, isDark && styles.textMuted]}>Email</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={[styles.label, isDark && styles.textMuted]}>Password</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={[styles.error, isDark && styles.errorDark]}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={submit} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.previewButton, isDark && styles.previewButtonDark]} onPress={() => router.replace('/(tabs)')}>
            <Text style={[styles.previewText, isDark && styles.previewTextDark]}>Review app without login</Text>
          </TouchableOpacity>

          <View style={styles.demoRow}>
            <TouchableOpacity onPress={() => { setEmail('admin@tasktimer.app'); setPassword('admin123'); }} style={[styles.demoButton, isDark && styles.demoButtonDark]}>
              <Text style={[styles.demoTitle, isDark && styles.textLight]}>Admin</Text>
              <Text style={[styles.demoText, isDark && styles.textMuted]}>admin@tasktimer.app</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmail('demo@tasktimer.app'); setPassword('demo123'); }} style={[styles.demoButton, isDark && styles.demoButtonDark]}>
              <Text style={[styles.demoTitle, isDark && styles.textLight]}>Demo</Text>
              <Text style={[styles.demoText, isDark && styles.textMuted]}>demo@tasktimer.app</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, isDark && styles.textMuted]}>
            No account? <Link href="/register" style={styles.link}>Register</Link>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 8, marginBottom: 28, color: '#6b7280', fontSize: 16 },
  form: { gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  inputDark: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' },
  error: { borderWidth: 1, borderColor: '#fecdd3', borderRadius: 10, backgroundColor: '#fff1f2', color: '#be123c', padding: 12 },
  errorDark: { borderColor: '#be123c', backgroundColor: '#4c0519', color: '#fecdd3' },
  button: { marginTop: 8, borderRadius: 10, backgroundColor: '#2563eb', paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  previewButton: { borderWidth: 1, borderColor: '#bae6fd', borderRadius: 10, backgroundColor: '#ecfeff', paddingVertical: 13, alignItems: 'center' },
  previewButtonDark: { borderColor: '#155e75', backgroundColor: '#0f172a' },
  previewText: { color: '#0e7490', fontWeight: '800' },
  previewTextDark: { color: '#67e8f9' },
  demoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  demoButton: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#f9fafb' },
  demoButtonDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  demoTitle: { fontWeight: '800', color: '#111827' },
  demoText: { marginTop: 4, fontSize: 11, color: '#6b7280' },
  footer: { marginTop: 14, textAlign: 'center', color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '800' },
  themeButton: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 18 },
  themeButtonDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  themeText: { color: '#111827', fontWeight: '800' },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
