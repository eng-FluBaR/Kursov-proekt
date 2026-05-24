import { Link, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { isDark, mode, toggleTheme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError('');
    setIsSubmitting(true);

    try {
      await register(email, password);
      router.replace('/(tabs)');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Registration failed.');
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
        <Text style={[styles.title, isDark && styles.textLight]}>Create account</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>Your mobile account is saved in the same Neon database.</Text>

        <Text style={[styles.label, isDark && styles.textMuted]}>Email</Text>
        <TextInput style={[styles.input, isDark && styles.inputDark]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={[styles.label, isDark && styles.textMuted]}>Password</Text>
        <TextInput style={[styles.input, isDark && styles.inputDark]} value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={submit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Creating...' : 'Create account'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.previewButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.previewText}>Review app first</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, isDark && styles.textMuted]}>
          Already have an account? <Link href="/login" style={styles.link}>Login</Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 12 },
  title: { fontSize: 34, fontWeight: '800', color: '#111827' },
  subtitle: { marginBottom: 18, color: '#6b7280', fontSize: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  inputDark: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' },
  error: { borderWidth: 1, borderColor: '#fecdd3', borderRadius: 10, backgroundColor: '#fff1f2', color: '#be123c', padding: 12 },
  button: { marginTop: 8, borderRadius: 10, backgroundColor: '#2563eb', paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  previewButton: { borderWidth: 1, borderColor: '#bae6fd', borderRadius: 10, backgroundColor: '#ecfeff', paddingVertical: 13, alignItems: 'center' },
  previewText: { color: '#0e7490', fontWeight: '800' },
  footer: { marginTop: 14, textAlign: 'center', color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '800' },
  themeButton: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 18 },
  themeButtonDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
  themeText: { color: '#111827', fontWeight: '800' },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
