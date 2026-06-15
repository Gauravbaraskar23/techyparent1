import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/DashboardScreen";
import ScreenTimeScreen from "../screens/ScreenTimeScreen";
import GoalsScreen from "../screens/GoalsScreen";
import LearningSuggestionsScreen from "../screens/LearningSuggestionsScreen";
import FamilyBondingScreen from "../screens/FamilyBondingScreen";
import ReportsScreen from "../screens/ReportsScreen";
// import NotificationsScreen from "../screens/Notificationsscreen";
// import NotificationBadge from "../components/NotificationBadge";
// import DailyRoutineScreen from "../screens/DailyRoutineScreen";
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Dashboard":
              iconName = "home-outline";
              break;
            case "Screen Time":
              iconName = "time-outline";
              break;
            case "Goals":
              iconName = "trophy-outline";
              break;
            case "Learning":
              iconName = "book-outline";
              break;
            case "Family":
              iconName = "people-outline";
              break;
            case "Reports":
              iconName = "bar-chart-outline";
              break;
            // case "Routine":
            //   iconName = "calendar-outline";
              return (
                <View>
                  <Ionicons name={iconName} size={size} color={color} />
                </View>
              );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Screen Time" component={ScreenTimeScreen} />
      {/* <Tab.Screen name="Routine" component={DailyRoutineScreen} /> */}
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Learning" component={LearningSuggestionsScreen} />
      <Tab.Screen name="Family" component={FamilyBondingScreen} />
      {/* <Tab.Screen name="Notifications" component={NotificationsScreen} /> */}
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

