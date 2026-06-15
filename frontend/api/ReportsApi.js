// reportsApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.176.131.220:8000/api/reports'; // Update with your backend URL

// Get auth token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create axios instance with auth
const createAuthAxios = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Token ${token}` : '',
    },
  });
};

// Get report summary (main data for ReportsScreen)
export const getReportSummary = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/summary/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting report summary:', error.response?.data || error.message);
    throw error;
  }
};

// Get daily reports
export const getDailyReports = async (childId, days = 30) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/daily/${childId}/`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting daily reports:', error.response?.data || error.message);
    throw error;
  }
};

// Get weekly reports
export const getWeeklyReports = async (childId, weeks = 8) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/weekly/${childId}/`, {
      params: { weeks }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting weekly reports:', error.response?.data || error.message);
    throw error;
  }
};

// Get monthly reports
export const getMonthlyReports = async (childId, months = 6) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/monthly/${childId}/`, {
      params: { months }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting monthly reports:', error.response?.data || error.message);
    throw error;
  }
};

// Get recommendations
export const getRecommendations = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/recommendations/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting recommendations:', error.response?.data || error.message);
    throw error;
  }
};

// Mark recommendation as complete
export const completeRecommendation = async (recommendationId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/recommendations/${recommendationId}/complete/`);
    return response.data;
  } catch (error) {
    console.error('Error completing recommendation:', error.response?.data || error.message);
    throw error;
  }
};

// Export report as PDF
export const exportReport = async (childId, reportType = 'weekly', startDate = null, endDate = null) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/export/${childId}/`, {
      report_type: reportType,
      start_date: startDate,
      end_date: endDate
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error.response?.data || error.message);
    throw error;
  }
};

// Get chart data
export const getChartData = async (childId, period = 'week') => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/chart-data/${childId}/`, {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting chart data:', error.response?.data || error.message);
    throw error;
  }
};

// Trigger report generation (admin/background)
export const generateReports = async () => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/generate/');
    return response.data;
  } catch (error) {
    console.error('Error generating reports:', error.response?.data || error.message);
    throw error;
  }
};