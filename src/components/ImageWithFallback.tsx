import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface ImageWithFallbackProps {
  sources: readonly (string | undefined)[];
  style?: StyleProp<ImageStyle>;
  testID: string;
}

function isHttpUrl(value: string | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function ImageWithFallback({
  sources,
  style,
  testID,
}: ImageWithFallbackProps): React.JSX.Element {
  const { t } = useTranslation();
  const validSources = useMemo(() => [...new Set(sources.filter(isHttpUrl))], [sources]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [validSources.join('\u0000')]);

  const source = validSources[sourceIndex];
  if (!source) {
    return (
      <View testID={`${testID}-placeholder`} style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>{t('images.unavailable')}</Text>
      </View>
    );
  }

  return (
    <Image
      testID={testID}
      source={{
        uri: source,
        headers: { 'User-Agent': 'OpenCoaster/0.1 (licensed image retrieval)' },
      }}
      style={style}
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  placeholderText: { color: '#4B5563', fontSize: 12 },
});
