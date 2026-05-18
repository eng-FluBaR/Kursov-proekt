import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>TaskTimer</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  keyboardType,
  multiline,
}: {
  value: string;
  placeholder: string;
  onChangeText?: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[styles.input, multiline && styles.inputMultiline]}
    />
  );
}

export function SelectPills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; color?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              selected && { backgroundColor: option.color ?? '#22d3ee', borderColor: option.color ?? '#22d3ee' },
            ]}
          >
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ProjectDot({ color }: { color: string }) {
  return <View style={[styles.projectDot, { backgroundColor: color }]} />;
}

export function EntryRow({
  projectColor,
  taskIcon,
  project,
  task,
  duration,
  date,
}: {
  projectColor: string;
  taskIcon: keyof typeof Ionicons.glyphMap;
  project: string;
  task: string;
  duration: string;
  date: string;
}) {
  return (
    <View style={styles.entryRow}>
      <ProjectDot color={projectColor} />
      <View style={styles.entryIcon}>
        <Ionicons name={taskIcon} size={16} color="#e2e8f0" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryTitle}>{project}</Text>
        <Text style={styles.entrySubtitle}>{task} • {date}</Text>
      </View>
      <Text style={styles.entryDuration}>{duration}</Text>
    </View>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="sad-outline" size={22} color="#38bdf8" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

export function PrimaryButton({ title, onPress, variant = 'light', style }: { title: string; onPress?: () => void; variant?: 'light' | 'dark' | 'danger' | 'success'; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        variant === 'dark' && styles.buttonDark,
        variant === 'danger' && styles.buttonDanger,
        variant === 'success' && styles.buttonSuccess,
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'light' && styles.buttonTextDark]}>{title}</Text>
    </Pressable>
  );
}

export function TimerDigits({ value, accent }: { value: string; accent: string }) {
  return <Text style={[styles.timerDigits, { color: accent }]}>{value}</Text>;
}

export function SkeletonBar({ width = '100%' }: { width?: string }) {
  return <View style={[styles.skeletonBar, { width }]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07111f',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 18,
  },
  kicker: {
    color: '#67e8f9',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  card: {
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  pillRow: {
    gap: 10,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pillText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextSelected: {
    color: '#03111f',
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  entryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  entryTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
  entrySubtitle: {
    color: '#94a3b8',
    marginTop: 3,
    fontSize: 12,
  },
  entryDuration: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56,189,248,0.12)',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#e2e8f0',
  },
  buttonDark: {
    backgroundColor: '#0f172a',
  },
  buttonDanger: {
    backgroundColor: '#e11d48',
  },
  buttonSuccess: {
    backgroundColor: '#22c55e',
  },
  buttonText: {
    color: '#07111f',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonTextDark: {
    color: '#f8fafc',
  },
  timerDigits: {
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 1.5,
    fontWeight: '900',
  },
  skeletonBar: {
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});