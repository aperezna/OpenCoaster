import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const IMAGE_USER_AGENT = 'OpenCoaster/0.1 (https://github.com/aperezna/OpenCoaster)';
const WIKIMEDIA_REFERER = 'https://commons.wikimedia.org/';

export interface ImageWithFallbackProps {
  sources: readonly (string | undefined)[];
  style?: StyleProp<ImageStyle>;
  testID: string;
}

function isHttpUrl(value: string | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function isWikimediaHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  return normalizedHostname === 'wikimedia.org' || normalizedHostname.endsWith('.wikimedia.org');
}

export function normalizeWikimediaImageUrl(source: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(source);
  } catch {
    return source;
  }

  if (!isWikimediaHost(parsedUrl.hostname)) {
    return source;
  }

  for (const parameter of [...parsedUrl.searchParams.keys()]) {
    if (/^utm_/i.test(parameter)) {
      parsedUrl.searchParams.delete(parameter);
    }
  }

  return parsedUrl.toString();
}

function getImageHeaders(source: string): Record<string, string> {
  const headers = { 'User-Agent': IMAGE_USER_AGENT };
  try {
    if (isWikimediaHost(new URL(source).hostname)) {
      return { ...headers, Referer: WIKIMEDIA_REFERER };
    }
  } catch {
    // isHttpUrl already filters invalid values before this function is called.
  }
  return headers;
}

export function ImageWithFallback({
  sources,
  style,
  testID,
}: ImageWithFallbackProps): React.JSX.Element {
  const { t } = useTranslation();
  const validSources = useMemo(
    () => [...new Set(sources.filter(isHttpUrl).map(normalizeWikimediaImageUrl))],
    [sources],
  );
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
        headers: getImageHeaders(source),
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
