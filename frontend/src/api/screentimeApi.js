import axios from "axios";

const API_URL = "http://10.239.126.220:8000/api/screentime/";

export const fetchScreenTimeSummary = async (childId) => {
  try {
    const res = await axios.get(`${API_URL}summary/`, {
      params: { child_id: childId },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching screen time summary:", err);
    throw err;
  }
};

export const fetchScreenTimeLogs = async (childId) => {
  try {
    const res = await axios.get(API_URL, { params: { child_id: childId } });
    return res.data;
  } catch (err) {
    console.error("Error fetching screen time logs:", err);
    throw err;
  }
};
