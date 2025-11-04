import axios from "axios";

// 🔗 Change this IP to match your Django backend
const BASE_URL = "http://10.239.126.220:8000/api/familybonding/";

// Fetch all categories (like “Games”, “Outdoor”, etc.)
export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${BASE_URL}categories/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Fetch all activities or filter by category/age_group
export const fetchActivities = async (filters = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}activities/`, { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
};
