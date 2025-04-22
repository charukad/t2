import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../utils/themeUtils';

const FallbackMap = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={64} color={colors.primary} />
      <Text style={styles.title}>Map Unavailable</Text>
      <Text style={styles.description}>
        We're having trouble loading the map. This could be due to network issues or device compatibility.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.md,
    color: colors.text,
  },
  description: {
    fontSize: 16,
    marginTop: spacing.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FallbackMap; 