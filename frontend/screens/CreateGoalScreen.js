

import React, { useState } from 'react';
import {
View, Text, TextInput, TouchableOpacity,
StyleSheet, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = 'http://10.176.131.220:8000/api/goals';

export default function CreateGoalScreen({ navigation }) {
const [title, setTitle] = useState('');
const [target, setTarget] = useState('');
const [unit, setUnit] = useState('');
const [loading, setLoading] = useState(false);

const createGoal = async () => {
if (!title || !target || !unit) {
Alert.alert("Error", "All fields are required");
return;
}

try {
  setLoading(true);

  const token = await AsyncStorage.getItem('authToken');
  const childId = await AsyncStorage.getItem('selectedChildId');

  await axios.post(
    `${API_BASE}/list/${childId}/`,
    {
      title,
      target_value: parseInt(target),
      unit,
      category: 1, // valid category (from DB)
      
    },
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  Alert.alert(
    "Success 🎉",
    "Goal created successfully",
    [
      {
        text: "OK",
        onPress: () => navigation.replace('GoalScreen'),
      },
    ]
  );

} catch (error) {
  console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);
  console.log("FULL ERROR:", error);

  if (error.response) {
    Alert.alert("Error", "Server Error: " + error.response.status);
  }
} finally {
  setLoading(false);
}

};

return (

  <ScrollView contentContainerStyle={styles.container}>
    
    <TouchableOpacity onPress={() => navigation.goBack()}>
       <Text style={{ fontSize: 16, marginBottom: 10 }}>← Back</Text>
    </TouchableOpacity>

    <Text style={styles.title}>Create New Goal 🎯</Text>

    <TextInput
      placeholder="Goal Title (e.g. Study 2 hours)"
      value={title}
      onChangeText={setTitle}
      style={styles.input}
    />

    <TextInput
      placeholder="Target Value (e.g. 120)"
      value={target}
      onChangeText={setTarget}
      keyboardType="numeric"
      style={styles.input}
    />

    <TextInput
      placeholder="Unit (e.g. minutes, pages)"
      value={unit}
      onChangeText={setUnit}
      style={styles.input}
    />

    <TouchableOpacity
      style={styles.button}
      onPress={createGoal}
      disabled={loading}
    >
      <Text style={styles.buttonText}>
        {loading ? "Creating..." : "Create Goal"}
      </Text>
    </TouchableOpacity>

  </ScrollView>
);
}

const styles = StyleSheet.create({
container: {
padding: 20,
flexGrow: 1,
justifyContent: 'center',
},
title: {
fontSize: 22,
fontWeight: '700',
marginBottom: 20,
textAlign: 'center',
},
input: {
borderWidth: 1,
borderColor: '#ccc',
padding: 12,
borderRadius: 10,
marginBottom: 15,
},
button: {
backgroundColor: '#6366f1',
padding: 14,
borderRadius: 10,
alignItems: 'center',
},
buttonText: {
color: '#fff',
fontWeight: '600',
},
});



// import React, { useState } from 'react';
// import {
// View, Text, TextInput, TouchableOpacity,
// StyleSheet, Alert, ScrollView
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Dropdown } from 'react-native-element-dropdown';
// import { Ionicons } from '@expo/vector-icons';

// const API_BASE = 'http://10.176.131.220:8000/api/goals';

// const PRIORITY_OPTIONS = [
// { label: 'High 🔥', value: 'high' },
// { label: 'Medium ⚡', value: 'medium' },
// { label: 'Low 🌿', value: 'low' },
// ];

// const CATEGORY_OPTIONS = [
// { label: 'Study 📚', value: 'study' },
// { label: 'Fitness 💪', value: 'fitness' },
// { label: 'Reading 📖', value: 'reading' },
// { label: 'Screen Time 📱', value: 'screen' },
// ];

// const ICON_OPTIONS = [
// 'book-outline',
// 'barbell-outline',
// 'time-outline',
// 'school-outline',
// 'fitness-outline',
// 'trophy-outline'
// ];

// export default function CreateGoalScreen({ navigation }) {
// const [title, setTitle] = useState('');
// const [target, setTarget] = useState('');
// const [unit, setUnit] = useState('');
// const [priority, setPriority] = useState('medium');
// const [category, setCategory] = useState(null);
// const [icon, setIcon] = useState('flag-outline');
// const [loading, setLoading] = useState(false);

// const createGoal = async () => {
// if (!title || !target || !unit) {
// Alert.alert("Error", "All fields are required");
// return;
// }

// try {
//   setLoading(true);

//   const token = await AsyncStorage.getItem('authToken');
//   const childId = await AsyncStorage.getItem('selectedChildId');

//   await axios.post(
//     `${API_BASE}/create/`,
//     {
//       title,
//       target_value: parseInt(target),
//       unit,
//       priority,
//       category,
//       icon_name: icon,
//       child_id: parseInt(childId),
//     },
//     {
//       headers: {
//         Authorization: `Token ${token}`,
//       },
//     }
//   );

//   Alert.alert("Success 🎉", "Goal created successfully");
//   navigation.goBack();

// } catch (error) {
//   console.log(error);
//   Alert.alert("Error", "Failed to create goal");
// } finally {
//   setLoading(false);
// }

// };

// return (

// <ScrollView contentContainerStyle={styles.container}>


//   <Text style={styles.title}>Create Smart Goal 🎯</Text>

//   {/* Title */}
//   <TextInput
//     placeholder="Goal Title"
//     value={title}
//     onChangeText={setTitle}
//     style={styles.input}
//   />

//   {/* Target */}
//   <TextInput
//     placeholder="Target Value"
//     value={target}
//     onChangeText={setTarget}
//     keyboardType="numeric"
//     style={styles.input}
//   />

//   {/* Unit */}
//   <TextInput
//     placeholder="Unit (minutes, pages)"
//     value={unit}
//     onChangeText={setUnit}
//     style={styles.input}
//   />

//   {/* Priority Dropdown */}
//   <Text style={styles.label}>Priority</Text>
//   <Dropdown
//     style={styles.dropdown}
//     data={PRIORITY_OPTIONS}
//     labelField="label"
//     valueField="value"
//     value={priority}
//     onChange={item => setPriority(item.value)}
//   />

//   {/* Category Dropdown */}
//   <Text style={styles.label}>Category</Text>
//   <Dropdown
//     style={styles.dropdown}
//     data={CATEGORY_OPTIONS}
//     labelField="label"
//     valueField="value"
//     value={category}
//     onChange={item => setCategory(item.value)}
//   />

//   {/* Icon Picker */}
//   <Text style={styles.label}>Choose Icon</Text>
//   <View style={styles.iconRow}>
//     {ICON_OPTIONS.map((ic) => (
//       <TouchableOpacity
//         key={ic}
//         style={[
//           styles.iconBox,
//           icon === ic && styles.iconSelected
//         ]}
//         onPress={() => setIcon(ic)}
//       >
//         <Ionicons name={ic} size={24} color="#6366f1" />
//       </TouchableOpacity>
//     ))}
//   </View>

//   {/* Submit */}
//   <TouchableOpacity
//     style={styles.button}
//     onPress={createGoal}
//     disabled={loading}
//   >
//     <Text style={styles.buttonText}>
//       {loading ? "Creating..." : "Create Goal"}
//     </Text>
//   </TouchableOpacity>

// </ScrollView>

// );
// }

// const styles = StyleSheet.create({
// container: {
// padding: 20,
// flexGrow: 1,
// },
// title: {
// fontSize: 24,
// fontWeight: '700',
// marginBottom: 20,
// textAlign: 'center',
// },
// input: {
// borderWidth: 1,
// borderColor: '#ddd',
// padding: 12,
// borderRadius: 10,
// marginBottom: 15,
// },
// label: {
// fontWeight: '600',
// marginBottom: 5,
// },
// dropdown: {
// borderWidth: 1,
// borderColor: '#ddd',
// borderRadius: 10,
// padding: 12,
// marginBottom: 15,
// },
// iconRow: {
// flexDirection: 'row',
// flexWrap: 'wrap',
// gap: 10,
// marginBottom: 20,
// },
// iconBox: {
// padding: 10,
// borderRadius: 10,
// borderWidth: 1,
// borderColor: '#ddd',
// },
// iconSelected: {
// backgroundColor: '#e0e7ff',
// borderColor: '#6366f1',
// },
// button: {
// backgroundColor: '#6366f1',
// padding: 15,
// borderRadius: 10,
// alignItems: 'center',
// },
// buttonText: {
// color: '#fff',
// fontWeight: '600',
// },
// });

