import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';

type MenuItem = {
  label: string;
  href: '/(tabs)' | '/(tabs)/jobs' | '/(tabs)/calendar' | '/(tabs)/completed' | '/(tabs)/admin' | '/(tabs)/settings';
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  { label: 'Analytics', href: '/(tabs)' },
  { label: 'Jobs', href: '/(tabs)/jobs' },
  { label: 'Calendar', href: '/(tabs)/calendar' },
  { label: 'Completed tasks', href: '/(tabs)/completed' },
  { label: 'Admin', href: '/(tabs)/admin', adminOnly: true },
  { label: 'Settings', href: '/(tabs)/settings' },
];

export function AppMenu({ title }: { title: string }) {
  const pathname = usePathname();
  const { token, user, logout } = useAuth();
  const { isDark, mode, toggleTheme } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  function goTo(href: MenuItem['href']) {
    setIsOpen(false);
    router.push(href);
  }

  async function handleAuthAction() {
    setIsOpen(false);

    if (token) {
      await logout();
      return;
    }

    router.push('/login');
  }

  async function handleThemeToggle() {
    await toggleTheme();
  }

  return (
    <View style={[styles.bar, isDark && styles.barDark]}>
      <TouchableOpacity style={[styles.menuButton, isDark && styles.menuButtonDark]} onPress={() => setIsOpen(true)}>
        <MaterialIcons name="menu" size={24} color={isDark ? '#f8fafc' : '#111827'} />
      </TouchableOpacity>
      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      <TouchableOpacity style={[styles.pillButton, isDark && styles.menuButtonDark]} onPress={handleThemeToggle}>
        <Text style={[styles.pillText, isDark && styles.titleDark]}>{mode === 'dark' ? 'Light' : 'Dark'}</Text>
      </TouchableOpacity>

      <Modal transparent visible={isOpen} animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable style={[styles.panel, isDark && styles.panelDark]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, isDark && styles.titleDark]}>Menu</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={[styles.closeButton, isDark && styles.menuButtonDark]}>
                <MaterialIcons name="close" size={22} color={isDark ? '#f8fafc' : '#111827'} />
              </TouchableOpacity>
            </View>

            {menuItems.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => {
              const active = item.href === '/(tabs)' ? pathname === '/' : pathname.endsWith(item.href.replace('/(tabs)', ''));
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[styles.menuItem, isDark && styles.menuItemDark, active && (isDark ? styles.menuItemActiveDark : styles.menuItemActive)]}
                  onPress={() => goTo(item.href)}
                >
                  <Text style={[styles.menuText, isDark && styles.titleDark, active && styles.menuTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[styles.authButton, token ? styles.logoutButton : styles.loginButton]} onPress={handleAuthAction}>
              <Text style={styles.authText}>{token ? 'Logout' : 'Login'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  barDark: { backgroundColor: '#020617' },
  menuButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  menuButtonDark: {
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  title: { flex: 1, color: '#111827', fontSize: 18, fontWeight: '800' },
  titleDark: { color: '#f8fafc' },
  pillButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  pillText: { color: '#111827', fontWeight: '800' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.42)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 54,
    paddingHorizontal: 16,
  },
  panel: {
    width: 280,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  panelDark: {
    borderColor: '#334155',
    backgroundColor: '#020617',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  panelTitle: { color: '#111827', fontSize: 20, fontWeight: '900' },
  closeButton: {
    height: 38,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  menuItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuItemDark: {
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  menuItemActive: {
    borderColor: '#22d3ee',
    backgroundColor: '#ecfeff',
  },
  menuItemActiveDark: {
    borderColor: '#22d3ee',
    backgroundColor: '#164e63',
  },
  menuText: { color: '#111827', fontWeight: '800' },
  menuTextActive: { color: '#0e7490' },
  authButton: {
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  loginButton: { backgroundColor: '#2563eb' },
  logoutButton: { backgroundColor: '#ef4444' },
  authText: { color: '#ffffff', fontWeight: '900' },
});
