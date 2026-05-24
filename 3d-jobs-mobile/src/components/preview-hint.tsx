import { StyleSheet, Text, View } from 'react-native';

type PreviewHintProps = {
  children: string;
};

export function PreviewHint({ children }: PreviewHintProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Review mode</Text>
      <Text style={styles.text}>{children}</Text>
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
});
