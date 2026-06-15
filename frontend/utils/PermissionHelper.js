// utils/PermissionHelper.js
import { Linking, Platform, Alert } from 'react-native';

export const requestUsageStatsPermission = () => {
  if (Platform.OS === 'android') {
    Alert.alert(
      "Permission Required",
      "Please enable Usage Access for this app",
      [
        {
          text: "Open Settings",
          onPress: () => Linking.openSettings(),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }
};


// Guide user to: Settings > Apps > Special access > Usage access