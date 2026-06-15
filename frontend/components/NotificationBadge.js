import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNotificationSummary } from '../api/NotificationApi';

export default function NotificationBadge({ childId, size = 18 }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [childId]);

  const loadUnreadCount = async () => {
    try {
      const summary = await getNotificationSummary(childId);
      setUnreadCount(summary.unread_count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  if (unreadCount === 0) return null;

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.6 }]}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 18,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});