import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useFarm } from '../context/FarmContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
  } = useFarm();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          name: 'alert-circle' as const,
          bgColor: '#FDEAE6',
          iconColor: Colors.error,
        };
      case 'warning':
        return {
          name: 'warning' as const,
          bgColor: '#FEF5E7',
          iconColor: '#E67E22',
        };
      case 'info':
      default:
        return {
          name: 'rainy' as const,
          bgColor: '#EBF5FB',
          iconColor: '#3498DB',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={markAllNotificationsRead}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notificationsList}>
          {notifications.map((item) => {
            const iconConfig = getAlertIcon(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  !item.read && styles.unreadCard,
                ]}
                onPress={() => markNotificationRead(item.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: iconConfig.bgColor },
                  ]}
                >
                  <Ionicons
                    name={iconConfig.name}
                    size={20}
                    color={iconConfig.iconColor}
                  />
                </View>

                <View style={styles.textContent}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertMessage}>{item.message}</Text>
                  <Text style={styles.alertTime}>{item.time}</Text>
                </View>

                {!item.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  markAllText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: '700',
    color: Colors.oliveGreen,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  notificationsList: {
    gap: Spacing.sm + 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.pureWhite,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  unreadCard: {
    backgroundColor: '#FCFAF4',
    borderColor: Colors.goldenWheat,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  alertMessage: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  alertTime: {
    fontSize: 11,
    color: Colors.mutedGrey,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.oliveGreen,
    marginTop: 6,
  },
});
