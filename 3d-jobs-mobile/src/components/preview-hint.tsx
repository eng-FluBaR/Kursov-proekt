import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

type PreviewHintProps = {
  children: string;
};

export function PreviewHint({ children }: PreviewHintProps) {
  const { isDark } = useAppTheme();

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>Review mode</Text>
      <Text style={[styles.text, isDark && styles.textDark]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  title: { color: '#0e7490', fontWeight: '800', marginBottom: 4 },
  text: { color: '#155e75', fontSize: 13, lineHeight: 18 },
  cardDark: { borderColor: '#155e75', backgroundColor: '#0f172a' },
  titleDark: { color: '#67e8f9' },
  textDark: { color: '#cffafe' },
});
