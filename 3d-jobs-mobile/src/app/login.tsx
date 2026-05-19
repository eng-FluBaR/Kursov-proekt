import { Link, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>TaskTimer</Text>
        <Text style={styles.subtitle}>Login with your web account.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={submit} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>

          <View style={styles.demoRow}>
            <TouchableOpacity onPress={() => { setEmail('admin@tasktimer.app'); setPassword('admin123'); }} style={styles.demoButton}>
              <Text style={styles.demoTitle}>Admin</Text>
              <Text style={styles.demoText}>admin@tasktimer.app</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmail('demo@tasktimer.app'); setPassword('demo123'); }} style={styles.demoButton}>
              <Text style={styles.demoTitle}>Demo</Text>
              <Text style={styles.demoText}>demo@tasktimer.app</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            No account? <Link href="/register" style={styles.link}>Register</Link>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 8, marginBottom: 28, color: '#6b7280', fontSize: 16 },
  form: { gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  error: { borderWidth: 1, borderColor: '#fecdd3', borderRadius: 10, backgroundColor: '#fff1f2', color: '#be123c', padding: 12 },
  button: { marginTop: 8, borderRadius: 10, backgroundColor: '#2563eb', paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  demoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  demoButton: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#f9fafb' },
  demoTitle: { fontWeight: '800', color: '#111827' },
  demoText: { marginTop: 4, fontSize: 11, color: '#6b7280' },
  footer: { marginTop: 14, textAlign: 'center', color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '800' },
});
