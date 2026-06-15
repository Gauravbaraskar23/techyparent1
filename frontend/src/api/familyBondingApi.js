import axios from "axios";

//  Change this IP to match your Django backend
const BASE_URL = "http://10.176.131.220:8000/api/familybonding/";

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
export const fetchActivities = async (parentId, filters = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}templates/`, { params: { ...filters, parent_id: parentId } });
    return response.data;
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
};
