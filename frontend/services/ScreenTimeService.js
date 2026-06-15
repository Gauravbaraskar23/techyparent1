// ScreenTimeService.js
// This service runs in the background and tracks app usage

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundTimer from 'react-native-background-timer';
import UsageStats from 'react-native-usage-stats';
import PushNotification from 'react-native-push-notification';
import { updateScreenTime, checkAppAccess } from '../src/api/screentimeApi';
import { NativeModules } from 'react-native';
const { BlockerModule } = NativeModules;

class ScreenTimeService {
  constructor() {
    this.isTracking = false;
    this.currentApp = null;
    this.appStartTime = null;
    this.trackingInterval = null;
    this.childId = null;
    this.blockedApps = new Set();
    this.lastSentData = null;
    this.getTodayUsageStats = this.getTodayUsageStats.bind(this);
  }


  // Initialize the service
  async init(childId) {
    this.childId = childId;
    await this.requestPermissions();
    this.setupNotifications();
    this.startTracking();
    this.scheduleMidnightReset();   // Schedule daily reset at midnight
  }

  // Request necessary permissions (Android)
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        // Request Usage Stats permission
        const granted = await UsageStats.checkPermission();
        
        if (!granted) {
          console.log('Usage  permission not granted');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    return true;
  }

  // Setup push notifications
  setupNotifications() {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'screentime-alerts',
        channelName: 'Screen Time Alerts',
        channelDescription: 'Notifications for screen time limits',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  // Start tracking app usage
  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    console.log('Screen time tracking started');

    // Track every minute
    this.trackingInterval = BackgroundTimer.setInterval(() => {
      this.trackCurrentUsage();
    }, 30000); // 30 seconds

    // Also track when app state changes
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.trackCurrentUsage();
      }
    });
  }

  // Stop tracking
  stopTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    if (this.trackingInterval) {
      BackgroundTimer.clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    console.log('Screen time tracking stopped');
  }

  // Get usage stats for today
  // async getTodayUsageStats() {
  //   try {
  //     if (Platform.OS === 'android') {
  //       const start = new Date();
  //       start.setHours(0, 0, 0, 0);
  //       // const now = Date.now();
  //       // const start = now - 5 * 60 * 1000; // Last 5 minutes
        
  //       // const tomorrow = new Date(start);
  //       // tomorrow.setDate(tomorrow.getDate() + 1);

  //       const usageStats = await UsageStats.queryUsageStats(
  //         start.getTime(), 
  //         // now,
  //         // tomorrow.getTime()
  //       );

  //       return this.processUsageStats(usageStats);
  //     }
      
  //     // iOS - would need different implementation
  //     return this.getStoredUsageStats();
      
  //   } catch (error) {
  //     console.error('Error getting usage stats:', error);
  //     return [];
  //   }
  // }

  // Updated getTodayUsageStats to handle empty stats and prevent unnecessary API calls
  async getTodayUsageStats() {
  try {
    if (Platform.OS === 'android') {

      const now = Date.now();

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const usageStats = await UsageStats.queryUsageStats(
        // UsageStats.INTERVAL_DAILY, // Use daily interval for better performance
        startDate.getTime(),
        now
        // 'daily',  // **IMP** added interval type to get daily stats (if supported by the library)
      );

      console.log("RAW STATS:", usageStats);

      return this.processUsageStats(usageStats);
    }

    return [];
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return [];
  }
}

  // Process raw usage stats
  // processUsageStats(rawStats) {
  //   const appUsage = [];
  //   if (!rawStats) return appUsage;
  //   Object.keys(rawStats).forEach((packageName) => {
  //     const stats = rawStats[packageName];
      
  //     if (stats.totalTimeInForeground > 0) {
  //       appUsage.push({
  //         app_name: this.getAppName(packageName),
  //         app_package: packageName,
  //         duration_minutes: Math.floor(stats.totalTimeInForeground / 60000) // Convert to minutes
  //       });
  //     }
  //   });

  //   const appUsageString = JSON.stringify(appUsage);

  //   if (this.lastSentData === appUsageString) {
  //     return; // no change, skip API call
  //   }

  //   this.lastSentData = appUsageString;

  //   return appUsage;
  // }

  processUsageStats(rawStats) {
  const appUsage = [];

  if (!rawStats || rawStats.length === 0){ 
    console.log("No usage stats available");
    return []
  };

  rawStats.forEach((stats) => {
    if (stats.totalTimeInForeground > 0) {
      appUsage.push({
        app_name: stats.packageName,   // TEMP (we fix name later)
        app_package: stats.packageName,
        duration_minutes: Math.floor(stats.totalTimeInForeground / 60000),
      });
    }
  });

  
    const appUsageString = JSON.stringify(appUsage);

    if (this.lastSentData === appUsageString) {
      return; // no change, skip API call
    }

    this.lastSentData = appUsageString;

  return appUsage;
}

  // Get app name from package (simplified - you might want to use a mapping)
  getAppName(packageName) {
    const parts = packageName.split('.');
    return parts[parts.length - 1]
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Store usage stats locally (fallback for iOS or offline)
  async storeUsageStats(appUsage) {
    try {
      const stored = await AsyncStorage.getItem('daily_usage_stats');
      const today = new Date().toDateString();
      
      let stats = stored ? JSON.parse(stored) : {};
      
      // Reset if new day
      if (stats.date !== today) {
        stats = { date: today, apps: {} };
      }

      // Update usage
      appUsage.forEach(app => {
        stats.apps[app.app_package] = app;
      });

      await AsyncStorage.setItem('daily_usage_stats', JSON.stringify(stats));
    } catch (error) {
      console.error('Error storing usage stats:', error);
    }
  }

  // Get stored usage stats
  async getStoredUsageStats() {
    try {
      const stored = await AsyncStorage.getItem('daily_usage_stats');
      const today = new Date().toDateString();
      
      if (!stored) return [];
      
      const stats = JSON.parse(stored);
      
      // Return empty if different day
      if (stats.date !== today) return [];
      
      return Object.values(stats.apps);
    } catch (error) {
      console.error('Error getting stored usage stats:', error);
      return [];
    }
  }

  // Track current usage and sync with backend
  async trackCurrentUsage() {
    if (!this.childId) return;

    try {
      const appUsage = await this.getTodayUsageStats();
      
      if (!appUsage ||appUsage.length === 0) return;

      // Store locally
      await this.storeUsageStats(appUsage);

      // Sync with backend
      const response = await updateScreenTime(this.childId, appUsage);

      // Update blocked apps list
      if (response.blocked_apps && response.blocked_apps.length > 0) {
        response.blocked_apps.forEach(app => {
          
          if(!this.blockedApps.has(app.app_package)){
            this.blockedApps.add(app.app_package);
            // Auto block app
            if(BlockerModule){
              BlockerModule.blockApp(app.app_package);
            }
            console.log("AUTO BLOCKED: ", app.app_package);
          }
        });
      }

      // Show notifications for exceeded limits
      if (response.exceeded_apps && response.exceeded_apps.length > 0) {
        response.exceeded_apps.forEach(app => {

          // Show notification
          this.showLimitExceededNotification(app.app_name);
          //Prevent Duplicate Blocking
          if (!this.blockedApps.has(app.app_package)) {
            this.blockedApps.add(app.app_package);

          //Auto Block
          if(BlockerModule){
            BlockerModule.blockApp(app.app_package);
          }
          console.log("AUTO BLOCKED: ", app.app_package);
        }
        });
      }

    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  // Check if app should be blocked
  async shouldBlockApp(appPackage) {
    try {
      const response = await checkAppAccess(this.childId, appPackage);
      return !response.allowed;
    } catch (error) {
      console.error('Error checking app access:', error);
      return false;
    }
  }

  // Show notification when limit exceeded
  showLimitExceededNotification(appName) {
    PushNotification.localNotification({
      channelId: 'screentime-alerts',
      title: 'Screen Time Limit Reached',
      message: `${appName} has reached its daily limit!`,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
    });
  }

  // Show warning when approaching limit
  showWarningNotification(appName, remainingMinutes) {
    PushNotification.localNotification({
      channelId: 'screentime-alerts',
      title: 'Screen Time Warning',
      message: `Only ${remainingMinutes} minutes left for ${appName}`,
      playSound: true,
      soundName: 'default',
      importance: 'default',
    });
  }

  // Get today's total screen time
  async getTodayTotal() {
    const appUsage = await this.getStoredUsageStats();
    const total = appUsage.reduce((sum, app) => sum + app.duration_minutes, 0);
    return total;
  }

  // Reset daily stats (called at midnight)
  async resetDailyStats() {
    try {
      await AsyncStorage.removeItem('daily_usage_stats');
      this.blockedApps.clear();
      console.log('Daily stats reset');
    } catch (error) {
      console.error('Error resetting daily stats:', error);
    }
  }

  // Schedule midnight reset
  scheduleMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    BackgroundTimer.setTimeout(() => {
      this.resetDailyStats();
      this.scheduleMidnightReset(); // Schedule next reset
    }, timeUntilMidnight);
  }

  
}

// Export singleton instance
export default new ScreenTimeService();