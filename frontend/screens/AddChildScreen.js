import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "http://10.176.131.220:8000/api";

export default function AddChildScreen({ navigation }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
  if (!name || !age) {
    Alert.alert("Error", "Please enter both name and age");
    return;
  }

  // ✅ Validate age properly
  const ageNumber = parseInt(age);
  if (isNaN(ageNumber) || ageNumber <= 0) {
    Alert.alert("Error", "Please enter a valid age");
    return;
  }

  try {
    setLoading(true);

    // ✅ FIXED TOKEN KEY
    const token = await AsyncStorage.getItem("access_token");

    if (!token) {
      Alert.alert("Session Expired", "Please login again");
      return navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }

    const response = await axios.post(
      `${API_BASE}/children/add/`,
      {
        name,
        age: ageNumber,
        gender: gender || "",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 8000,
      }
    );

    console.log("✅ Child Added:", response.data);

    // ✅ BETTER SUCCESS UX
    Alert.alert("🎉 Success", "Child added successfully!", [
      {
        text: "OK",
        onPress: () => navigation.navigate("MainTabs", {screen: "Dashboard"}),
      },
    ]);
  } catch (err) {
    console.log("❌ Add Child Error:", err.response?.data || err);

    let message = "Failed to add child";

    if (err.code === "ECONNABORTED") {
      message = "Server timeout. Try again.";
    } else if (err.message.includes("Network Error")) {
      message = "Check your internet or backend server.";
    } else if (err.response?.status === 401) {
      message = "Session expired. Please login again.";

      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });

      return;
    } else if (err.response?.data) {
      const data = err.response.data;

      if (data.error) {
        message = data.error;
      } else {
        const key = Object.keys(data)[0];
        message = data[key][0];
      }
    }

    Alert.alert("Error", message);
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Child</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Name Field */}
            <Text style={styles.label}>Child Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter child name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Age Field */}
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                placeholderTextColor="#9ca3af"
                value={age}
                keyboardType="numeric"
                onChangeText={setAge}
              />
            </View>

            {/* Gender Field (Optional) */}
            <Text style={styles.label}>Gender (Optional)</Text>
            <View style={styles.genderRow}>
              {["male", "female", "other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? "Adding..." : "Add Child"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 15,
    color: "#111827",
  },

  /* Card */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 10,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 5,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111827",
  },

  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
  },

  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  genderButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },

  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },

  genderTextActive: {
    color: "#fff",
  },

  addButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import axios from "axios";
// import { Ionicons } from "@expo/vector-icons";

// export default function AddChildScreen({ navigation }) {
//   const [name, setName] = useState("");
//   const [age, setAge] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleAdd = async () => {
//     if (!name || !age) {
//       Alert.alert("Error", "Please enter both name and age");
//       return;
//     }
//     try {
//       setLoading(true);
//       await axios.post("http://10.208.5.220:8000/api/add-child/", {
//         name,
//         age: parseInt(age),
//         parent_id: 1,
//       });
//       Alert.alert("Success", "Child added successfully!");
//       navigation.goBack();
//     } catch (err) {
//       console.log(err);
//       Alert.alert("Error", "Failed to add child.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : null}
//         style={{ flex: 1 }}
//       >
//         <View style={styles.container}>
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <Ionicons name="arrow-back" size={22} color="#111827" />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Add New Child</Text>
//           </View>

//           {/* Form Card */}
//           <View style={styles.card}>
//             {/* Name Field */}
//             <Text style={styles.label}>Child Name</Text>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="person-outline" size={18} color="#6b7280" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter child name"
//                 placeholderTextColor="#9ca3af"
//                 value={name}
//                 onChangeText={setName}
//               />
//             </View>

//             {/* Age Field */}
//             <Text style={styles.label}>Age</Text>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="calendar-outline" size={18} color="#6b7280" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter age"
//                 placeholderTextColor="#9ca3af"
//                 value={age}
//                 keyboardType="numeric"
//                 onChangeText={setAge}
//               />
//             </View>

//             {/* Button */}
//             <TouchableOpacity
//               style={styles.addButton}
//               onPress={handleAdd}
//               disabled={loading}
//             >
//               <Text style={styles.addButtonText}>
//                 {loading ? "Adding..." : "Add Child"}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#f3f4f6",
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },

//   /* Header */
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 25,
//   },
//   backButton: {
//     height: 40,
//     width: 40,
//     borderRadius: 12,
//     backgroundColor: "#e5e7eb",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     marginLeft: 15,
//     color: "#111827",
//   },

//   /* Card */
//   card: {
//     backgroundColor: "#ffffff",
//     borderRadius: 18,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 3,
//   },

//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 8,
//     marginTop: 10,
//   },

//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f9fafb",
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 48,
//     marginBottom: 5,
//   },

//   input: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 15,
//     color: "#111827",
//   },

//   addButton: {
//     backgroundColor: "#3b82f6",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 25,
//     shadowColor: "#3b82f6",
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 4,
//   },

//   addButtonText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 16,
//   },
// });


// // import React, { useState } from "react";
// // import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
// // import axios from "axios";
// // import { Ionicons } from "@expo/vector-icons";

// // export default function AddChildScreen({ navigation }) {
// //   const [name, setName] = useState("");
// //   const [age, setAge] = useState("");
// //   const [loading, setLoading] = useState(false);

// //   const handleAdd = async () => {
// //     if (!name || !age) {
// //       Alert.alert("Error", "Please enter both name and age");
// //       return;
// //     }
// //     try {
// //       setLoading(true);
// //       await axios.post("http://10.208.5.220:8000/api/add-child/", {
// //         name,
// //         age: parseInt(age),
// //         parent_id: 1, // Replace with actual logged-in parent ID
// //       });
// //       Alert.alert("Success", "Child added successfully!");
// //       navigation.goBack();
// //     } catch (err) {
// //       console.log(err);
// //       Alert.alert("Error", "Failed to add child.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <View style={styles.container}>
// //       {/* Header */}
// //       <View style={styles.header}>
// //         <TouchableOpacity onPress={() => navigation.goBack()}>
// //           <Ionicons name="arrow-back" size={28} color="#333" />
// //         </TouchableOpacity>
// //         <Text style={styles.headerTitle}>Add New Child</Text>
// //       </View>

// //       {/* Input Fields */}
// //       <Text style={styles.label}>Child Name</Text>
// //       <TextInput
// //         style={styles.input}
// //         placeholder="Enter child name"
// //         value={name}
// //         onChangeText={setName}
// //       />

// //       <Text style={styles.label}>Age</Text>
// //       <TextInput
// //         style={styles.input}
// //         placeholder="Enter age"
// //         value={age}
// //         keyboardType="numeric"
// //         onChangeText={setAge}
// //       />

// //       {/* Add Button */}
// //       <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading}>
// //         <Text style={styles.addButtonText}>{loading ? "Adding..." : "Add Child"}</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: "#f9fafb",
// //     padding: 20,
// //   },
// //   header: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     marginTop: 40,
// //     marginBottom: 30,
// //   },
// //   headerTitle: {
// //     fontSize: 20,
// //     fontWeight: "700",
// //     marginLeft: 10,
// //   },
// //   label: {
// //     fontSize: 16,
// //     color: "#374151",
// //     marginBottom: 6,
// //   },
// //   input: {
// //     backgroundColor: "#fff",
// //     borderWidth: 1,
// //     borderColor: "#d1d5db",
// //     borderRadius: 8,
// //     padding: 12,
// //     fontSize: 15,
// //     marginBottom: 15,
// //   },
// //   addButton: {
// //     backgroundColor: "#3b82f6",
// //     paddingVertical: 14,
// //     borderRadius: 10,
// //     alignItems: "center",
// //     marginTop: 20,
// //   },
// //   addButtonText: {
// //     color: "#fff",
// //     fontWeight: "600",
// //     fontSize: 16,
// //   },
// // });
