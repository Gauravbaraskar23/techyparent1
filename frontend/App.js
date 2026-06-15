import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceService from "./services/VoiceService";
import { PermissionsAndroid, Platform, AppState } from 'react-native';

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import AppNavigator from "./navigation/AppNavigator";
import AddChildScreen from "./screens/AddChildScreen";
import EditChildScreen from "./screens/EditChildScreen";
import ScreenTimeScreen from "./screens/ScreenTimeScreen";
import GoalsScreen from "./screens/GoalsScreen";
import LearningSuggestionsScreen from "./screens/LearningSuggestionsScreen";
import VideoPlayerScreen from "./screens/VideoPlayerScreen"; 
import Notificationsscreen from "./screens/Notificationsscreen";
import ScreenTimeService from "./services/ScreenTimeService";
import DailyRoutineScreen from "./screens/DailyRoutineScreen";
import SetPinScreen from "./screens/SetPinScreen";
import CreateGoalScreen from "./screens/CreateGoalScreen";
import FamilyBondingScreen from "./screens/FamilyBondingScreen";
import TemplatesScreen from "./screens/TemplatesScreen";
// import PdfViewer from "./screens/PdfViewerScreen";
const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize with child ID (get from your auth/storage)
    const initializeTracking = async () => {
      const childId = await AsyncStorage.getItem('selectedChildId');
      if (childId) {
        const id = parseInt(childId);
      //  ScreenTimeService.init(parseInt(childId));
        ScreenTimeService.scheduleMidnightReset();

        // First take mic permission
        await requestMicPermission();

        // For Voice start 
      // await VoiceService.start(id);

      ScreenTimeService.init(childId);
      }
    };

    initializeTracking();

    // initializeVoice()  // for voice tracking but doesn't exist

    // For mic permission (Android)
        const requestMicPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("❌ Mic permission denied");
        }
      }
    };

    return () => {
      if (VoiceService?.stop){
        VoiceService.stop();
      }
    };
  }, []);
  

  useEffect(() => {
  const handleAppStateChange = (nextState) => {
    if (nextState === 'active') {
      console.log("📱 App in foreground");

      // Restart listening if needed
      if (VoiceService?.isActive) {
        VoiceService.startContinuousListening();
      }
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
  };
}, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="MainTabs" component={AppNavigator} />
        <Stack.Screen name="AddChild" component={AddChildScreen} />
        <Stack.Screen name="ChildScreenTime" component={ScreenTimeScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen
          name="LearningSuggestions"
          component={LearningSuggestionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options= {{ title: "Now Playing", headerShown: true }}
        />

        <Stack.Screen
          name="Notifications"
          component={Notificationsscreen}
          options={{ headerShown: true, title: "Notifications" }}
        />

        <Stack.Screen
          name="DailyRoutine"
          component={DailyRoutineScreen}
          options={{ headerShown: true, title: "DailyRoutine" }}
        />
        <Stack.Screen name="EditChild" component={EditChildScreen} />
        <Stack.Screen name="SetPin" component={SetPinScreen} />
        <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
        <Stack.Screen name="FamilyBonding" component={FamilyBondingScreen} />
        <Stack.Screen name="Templates" component={TemplatesScreen} />
        {/* <Stack.Screen name="PdfViewer" component={PdfViewerScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
