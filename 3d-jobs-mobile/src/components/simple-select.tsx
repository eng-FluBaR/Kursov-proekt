import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

export type SelectOption<T extends string> = {
  label: string;
  value: T;
  color?: string;
};

type SimpleSelectProps<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

export function SimpleSelect<T extends string>({ value, options, onChange }: SimpleSelectProps<T>) {
  const { isDark } = useAppTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              isDark && styles.optionDark,
              selected && styles.optionSelected,
              selected && isDark && styles.optionSelectedDark,
              selected && option.color ? { borderColor: option.color } : null,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: option.color ?? '#3B82F6' }]} />
            <Text style={[styles.optionText, isDark && styles.optionTextDark, selected && styles.optionTextSelected, selected && isDark && styles.optionTextSelectedDark]} numberOfLines={2}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  option: {
    minHeight: 42,
    maxWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  optionDark: {
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  optionSelectedDark: {
    backgroundColor: '#164e63',
  },
  optionText: {
    flexShrink: 1,
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#111827',
  },
  optionTextDark: {
    color: '#f8fafc',
  },
  optionTextSelectedDark: {
    color: '#ecfeff',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
