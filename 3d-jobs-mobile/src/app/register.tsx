import { Link, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Your mobile account is saved in the same Neon database.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={submit} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Creating...' : 'Create account'}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already have an account? <Link href="/login" style={styles.link}>Login</Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 12 },
  title: { fontSize: 34, fontWeight: '800', color: '#111827' },
  subtitle: { marginBottom: 18, color: '#6b7280', fontSize: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  error: { borderWidth: 1, borderColor: '#fecdd3', borderRadius: 10, backgroundColor: '#fff1f2', color: '#be123c', padding: 12 },
  button: { marginTop: 8, borderRadius: 10, backgroundColor: '#2563eb', paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  footer: { marginTop: 14, textAlign: 'center', color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '800' },
});
