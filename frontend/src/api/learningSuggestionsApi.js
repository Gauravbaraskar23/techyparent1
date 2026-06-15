import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.176.131.220:8000/api/learningsuggestions'; // change if needed

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;

// import axios from "axios";
// const API_URL = "http://10.176.131.220:8000/api/learningsuggestions/";
// // 1️⃣ Fetch videos based on child's age
// export const fetchLearningSuggestions = async (childId) => {
//   try {
//     const res = await axios.get(`${API_URL}suggestions/${childId}/`);
//     return res.data;
//   } catch (err) {
//     console.error("Error fetching learning suggestions:", err);
//     throw err;
//   }
// };

// // 2️⃣ Mark progress (watched or liked)
// export const markLearningProgress = async (childId, videoId, watched, liked) => {
//   try {
//     const res = await axios.post(`${API_URL}progress/`, {
//       child: childId,
//       video: videoId,
//       watched,
//       liked,
//     });
//     return res.data;
//   } catch (err) {
//     console.error("Error updating progress:", err);
//     throw err;
//   }
// };
