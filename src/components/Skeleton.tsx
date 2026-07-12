import React, { useRef, useMemo } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ViewStyle, StyleProp } from 'react-native';
import type { ThemeColors } from '../theme/colors';

// ---------------------------------------------------------------------------
// SkeletonBlock — pulse-animated rectangle
// ---------------------------------------------------------------------------

interface SkeletonBlockProps {
  width: number | string;
  height: number | string;
  // These are applied directly as style dimensions (Animated.View accepts DimensionValue)
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function SkeletonBlock({
  width,
  height,
  borderRadius = 4,
  style,
  testID,
}: SkeletonBlockProps): React.JSX.Element {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          width: width as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          height: height as any,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// ParkDetailSkeleton
// ---------------------------------------------------------------------------

function ParkDetailSkeleton(): React.JSX.Element {
  const { colors } = useTheme();
  const s = useMemo(() => createMainStyles(colors), [colors]);

  return (
    <View testID="park-detail-skeleton" style={s.parkDetailContainer}>
      {/* Photo placeholder */}
      <SkeletonBlock width="100%" height={220} borderRadius={0} />

      {/* Info section */}
      <View style={s.infoSection}>
        <SkeletonBlock width="60%" height={26} style={s.infoName} />
        <SkeletonBlock width="40%" height={16} style={s.infoLine} />
        <SkeletonBlock width="50%" height={14} style={s.infoSmall} />
        <SkeletonBlock width="30%" height={14} style={s.infoSmall} />
        <SkeletonBlock width={120} height={44} borderRadius={8} />
      </View>

      {/* Weather + Hours card row */}
      <View style={s.cardsRow}>
        <View style={s.card}>
          <SkeletonBlock width="40%" height={14} style={s.cardTitle} />
          <SkeletonBlock width="60%" height={32} style={s.cardContentBlock} />
          <SkeletonBlock width="40%" height={14} />
        </View>
        <View style={s.card}>
          <SkeletonBlock width="40%" height={14} style={s.cardTitle} />
          <SkeletonBlock width="50%" height={20} style={s.cardContentBlock} />
          <SkeletonBlock width="40%" height={14} style={s.cardLabel} />
          <SkeletonBlock width="50%" height={20} />
        </View>
      </View>

      {/* Attractions section */}
      <View style={s.attractionsSection}>
        <SkeletonBlock width="40%" height={18} style={s.sectionTitle} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={s.attractionItem}>
            <View style={s.attractionItemLeft}>
              <SkeletonBlock width="50%" height={16} style={s.attractionName} />
              <SkeletonBlock width="30%" height={12} />
            </View>
            <SkeletonBlock width={50} height={16} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ParksListSkeleton
// ---------------------------------------------------------------------------

function ParksListSkeleton(): React.JSX.Element {
  const { colors } = useTheme();
  const s = useMemo(() => createMainStyles(colors), [colors]);

  return (
    <View testID="parks-list-skeleton" style={s.parksListContainer}>
      {/* Search input */}
      <SkeletonBlock width="100%" height={44} borderRadius={8} style={s.searchInput} />

      {/* Park list items */}
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={s.parkItem}>
          <View style={s.parkItemLeft}>
            <SkeletonBlock width="60%" height={16} style={s.parkItemName} />
            <SkeletonBlock width="40%" height={12} />
          </View>
          <SkeletonBlock width={40} height={12} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProfileSkeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton(): React.JSX.Element {
  const { colors } = useTheme();
  const s = useMemo(() => createMainStyles(colors), [colors]);

  return (
    <View testID="profile-skeleton" style={s.profileContainer}>
      {/* Avatar */}
      <SkeletonBlock width={80} height={80} borderRadius={40} style={s.avatar} />

      {/* Username & email */}
      <SkeletonBlock width="40%" height={24} style={s.username} />
      <SkeletonBlock width="50%" height={16} style={s.email} />

      {/* Info row */}
      <SkeletonBlock width="100%" height={44} borderRadius={8} style={s.infoRow} />

      {/* Favorites section */}
      <View style={s.favoritesSection}>
        <SkeletonBlock width="30%" height={18} style={s.sectionTitle} />
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} width="100%" height={48} borderRadius={8} style={s.favoriteItem} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function createMainStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // ParkDetailSkeleton
    parkDetailContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    infoSection: {
      padding: 16,
      backgroundColor: colors.surface,
      marginBottom: 12,
    },
    infoName: {
      marginBottom: 8,
    },
    infoLine: {
      marginBottom: 8,
    },
    infoSmall: {
      marginBottom: 4,
    },
    cardsRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
    },
    cardTitle: {
      marginBottom: 12,
    },
    cardContentBlock: {
      marginBottom: 8,
    },
    cardLabel: {
      marginBottom: 4,
    },
    attractionsSection: {
      paddingHorizontal: 16,
      marginTop: 16,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    attractionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    attractionItemLeft: {
      flex: 1,
      marginRight: 12,
    },
    attractionName: {
      marginBottom: 4,
    },

    // ParksListSkeleton
    parksListContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchInput: {
      margin: 12,
    },
    parkItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      marginHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    parkItemLeft: {
      flex: 1,
      marginRight: 12,
    },
    parkItemName: {
      marginBottom: 4,
    },

    // ProfileSkeleton
    profileContainer: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 24,
      backgroundColor: colors.background,
    },
    avatar: {
      marginBottom: 16,
    },
    username: {
      marginBottom: 4,
    },
    email: {
      marginBottom: 24,
    },
    infoRow: {
      marginBottom: 16,
    },
    favoritesSection: {
      width: '100%',
      marginTop: 24,
      paddingHorizontal: 16,
    },
    favoriteItem: {
      marginBottom: 8,
    },
  });
}

// ---------------------------------------------------------------------------
// WeatherCardSkeleton — matches WeatherCard layout
// ---------------------------------------------------------------------------

function WeatherCardSkeleton(): React.JSX.Element {
  const { colors } = useTheme();
  const cs = useMemo(() => createCardSkeletonStyles(colors), [colors]);

  return (
    <View style={cs.cardSkeleton} testID="weather-card-skeleton">
      <SkeletonBlock width={40} height={14} borderRadius={4} style={cs.cardTitleSkeleton} />
      <View style={cs.cardContentCenter}>
        <SkeletonBlock width={36} height={36} borderRadius={18} style={cs.cardEmojiSkeleton} />
        <SkeletonBlock width={60} height={28} borderRadius={4} style={cs.cardValueSkeleton} />
        <SkeletonBlock width={50} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// HoursCardSkeleton — matches HoursCard layout
// ---------------------------------------------------------------------------

function HoursCardSkeleton(): React.JSX.Element {
  const { colors } = useTheme();
  const cs = useMemo(() => createCardSkeletonStyles(colors), [colors]);

  return (
    <View style={cs.cardSkeleton} testID="hours-card-skeleton">
      <SkeletonBlock width={50} height={14} borderRadius={4} style={cs.cardTitleSkeleton} />
      <View style={cs.cardContentCenter}>
        <SkeletonBlock width={40} height={12} borderRadius={4} style={cs.cardLabelSkeleton} />
        <SkeletonBlock width={70} height={20} borderRadius={4} style={cs.cardValueSkeleton} />
        <SkeletonBlock width={40} height={12} borderRadius={4} style={cs.cardLabelSkeleton} />
        <SkeletonBlock width={70} height={20} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AttractionListSkeleton — a few item rows
// ---------------------------------------------------------------------------

function AttractionListSkeleton(): React.JSX.Element {
  const { colors } = useTheme();
  const cs = useMemo(() => createCardSkeletonStyles(colors), [colors]);

  return (
    <View style={cs.attractionListSkeleton} testID="attraction-list-skeleton">
      <SkeletonBlock width={120} height={18} borderRadius={4} style={cs.sectionTitleSkeleton} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={cs.attractionItemSkeleton}>
          <View style={cs.attractionItemLeft}>
            <SkeletonBlock width="60%" height={16} borderRadius={4} style={cs.attrNameSkeleton} />
            <SkeletonBlock width="30%" height={12} borderRadius={4} />
          </View>
          <SkeletonBlock width={50} height={16} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Style additions for card skeletons
// ---------------------------------------------------------------------------

function createCardSkeletonStyles(colors: ThemeColors) {
  return StyleSheet.create({
    cardSkeleton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
    },
    cardContentCenter: {
      alignItems: 'center',
    },
    cardTitleSkeleton: {
      marginBottom: 12,
    },
    cardEmojiSkeleton: {
      marginBottom: 8,
    },
    cardValueSkeleton: {
      marginBottom: 4,
    },
    cardLabelSkeleton: {
      marginBottom: 4,
    },
    attractionListSkeleton: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    sectionTitleSkeleton: {
      marginBottom: 12,
    },
    attractionItemSkeleton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    attractionItemLeft: {
      flex: 1,
      marginRight: 12,
    },
    attrNameSkeleton: {
      marginBottom: 4,
    },
  });
}

export {
  SkeletonBlock,
  ParkDetailSkeleton,
  ParksListSkeleton,
  ProfileSkeleton,
  WeatherCardSkeleton,
  HoursCardSkeleton,
  AttractionListSkeleton,
};
