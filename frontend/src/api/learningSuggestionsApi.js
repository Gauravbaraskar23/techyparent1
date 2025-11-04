import axios from "axios";

const API_URL = "http://10.239.126.220:8000/api/learningsuggestions/progress/";

// 1️⃣ Fetch videos based on child's age
export const fetchLearningSuggestions = async (childId) => {
  try {
    const res = await axios.get(`${API_URL}suggestions/${childId}/`);
    return res.data;
  } catch (err) {
    console.error("Error fetching learning suggestions:", err);
    throw err;
  }
};

// 2️⃣ Mark progress (watched or liked)
export const markLearningProgress = async (childId, videoId, watched, liked) => {
  try {
    const res = await axios.post(`${API_URL}progress/`, {
      child: childId,
      video: videoId,
      watched,
      liked,
    });
    return res.data;
  } catch (err) {
    console.error("Error updating progress:", err);
    throw err;
  }
};
