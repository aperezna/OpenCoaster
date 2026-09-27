import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ImageMetadata } from '../data/images/imageMetadata';

export function ImageAttribution({ image, testID }: { image: ImageMetadata; testID: string }) {
  const { t } = useTranslation();
  return (
    <View testID={testID} style={styles.container}>
      <Text style={styles.text}>{image.attribution || image.creator}</Text>
      <Text style={styles.text}>{image.license.name}</Text>
      <Pressable
        testID={`${testID}-source`}
        accessibilityRole="link"
        accessibilityLabel={t('images.openSource')}
        onPress={() => void Linking.openURL(image.sourceUrl).catch(() => undefined)}
      >
        <Text style={styles.link}>{t('images.source')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4, gap: 2 },
  text: { fontSize: 11, color: '#666' },
  link: { fontSize: 12, color: '#1565C0', textDecorationLine: 'underline' },
});
