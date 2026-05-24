import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  function chooseOption(nextValue: T) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.trigger, isDark && styles.triggerDark, isOpen && styles.triggerOpen]}
        onPress={() => setIsOpen((current) => !current)}
        disabled={options.length === 0}
      >
        <View style={styles.triggerContent}>
          {selectedOption ? <View style={[styles.dot, { backgroundColor: selectedOption.color ?? '#3B82F6' }]} /> : null}
          <Text style={[styles.triggerText, isDark && styles.triggerTextDark]} numberOfLines={1} adjustsFontSizeToFit>
            {selectedOption?.label ?? 'No options'}
          </Text>
        </View>
        <Text style={[styles.chevron, isDark && styles.triggerTextDark]}>{isOpen ? '^' : 'v'}</Text>
      </TouchableOpacity>

      {isOpen ? (
        <View style={[styles.menu, isDark && styles.menuDark]}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => chooseOption(option.value)}
                style={[styles.option, selected && styles.optionSelected, selected && isDark && styles.optionSelectedDark]}
              >
                <View style={[styles.dot, { backgroundColor: option.color ?? '#3B82F6' }]} />
                <Text style={[styles.optionText, isDark && styles.optionTextDark, selected && styles.optionTextSelected, selected && isDark && styles.optionTextSelectedDark]} numberOfLines={2}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  trigger: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  triggerDark: {
    borderColor: '#334155',
    backgroundColor: '#020617',
  },
  triggerOpen: {
    borderColor: '#22d3ee',
  },
  triggerContent: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  triggerTextDark: {
    color: '#f8fafc',
  },
  chevron: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 10,
  },
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  menuDark: {
    borderColor: '#334155',
    backgroundColor: '#020617',
  },
  option: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionSelected: {
    backgroundColor: '#f0f9ff',
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
