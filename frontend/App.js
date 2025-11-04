import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import AppNavigator from "./navigation/AppNavigator";
import AddChildScreen from "./screens/AddChildScreen";
import ScreenTimeScreen from "./screens/ScreenTimeScreen";
import GoalsScreen from "./screens/GoalsScreen";
import LearningSuggestionsScreen from "./screens/LearningSuggestionsScreen";
import VideoPlayerScreen from "./screens/VideoPlayerScreen"; 

const Stack = createNativeStackNavigator();

export default function App() {
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';

// import LoginScreen from './screens/LoginScreen';
// // import Dashboard from './screens/Dashboard';
// import SignupScreen from './screens/SignupScreen';
// import SafetyScreen from './screens/SafetyScreen';
// import ProfileScreen from './screens/ProfileScreen';
// import ScreenTimeScreen from './screens/ScreenTimeScreen';
// import DashboardScreen from './screens/DashboardScreen'
// import AddChildScreen from "./screens/AddChildScreen";
// import AppNavigator from "./navigation/AppNavigator";
// import LearningSuggestionsScreen from "./screens/LearningSuggestionsScreen";
// import GoalsScreen from './screens/GoalsScreen';

// const Stack = createNativeStackNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Signup" component={SignupScreen} />
//         <Stack.Screen name="MainTabs" component={AppNavigator} />
//         <Stack.Screen name="AddChild" component={AddChildScreen} />
//         <Stack.Screen name="ChildScreenTime" component={ScreenTimeScreen} />
//         <Stack.Screen name="Goals" component={GoalsScreen} />
//         <Stack.Screen name="LearningSuggestions" component={LearningSuggestionsScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }