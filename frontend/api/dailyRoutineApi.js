// dailyRoutineApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.176.131.220:8000/api/dailyroutine'; // Update with your backend URL

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



// Get routine summary for dashboard
export const getRoutineSummary = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/summary/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting routine summary:', error.response?.data || error.message);
    throw error;
  }
};

// Get today's activities
export const getTodayActivities = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/today/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting today activities:', error.response?.data || error.message);
    throw error;
  }
};




// Get all routines for a child
export const getRoutines = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get('/routines/', {
      params: { child_id: childId }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting routines:', error.response?.data || error.message);
    throw error;
  }
};

// Get specific routine details
export const getRoutineDetails = async (routineId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/routines/${routineId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting routine details:', error.response?.data || error.message);
    throw error;
  }
};

// Create new routine
export const createRoutine = async (data) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/routines/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating routine:', error.response?.data || error.message);
    throw error;
  }
};

// Update routine
export const updateRoutine = async (routineId, data) => {
  try {
    const api = await createAuthAxios();
    const response = await api.patch(`/routines/${routineId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating routine:', error.response?.data || error.message);
    throw error;
  }
};

// Delete routine
export const deleteRoutine = async (routineId) => {
  try {
    const api = await createAuthAxios();
    await api.delete(`/routines/${routineId}/`);
    return true;
  } catch (error) {
    console.error('Error deleting routine:', error.response?.data || error.message);
    throw error;
  }
};

// Create activity
export const createActivity = async (activityData) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/activities/create/', activityData);
    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error.response?.data || error.message);
    throw error;
  }
};

// Update activity
export const updateActivity = async (activityId, data) => {
  try {
    const api = await createAuthAxios();
    const response = await api.patch(`/activities/${activityId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating activity:', error.response?.data || error.message);
    throw error;
  }
};

// Delete activity
export const deleteActivity = async (activityId) => {
  try {
    const api = await createAuthAxios();
    await api.delete(`/activities/${activityId}/`);
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error.response?.data || error.message);
    throw error;
  }
};

// Toggle activity completion
export const toggleActivityCompletion = async (activityId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/activities/${activityId}/toggle/`);
    return response.data;
  } catch (error) {
    console.error('Error toggling completion:', error.response?.data || error.message);
    throw error;
  }
};

// Bulk update completions
export const bulkUpdateCompletions = async (activityIds, isCompleted, date = null) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/activities/bulk-update/', {
      activity_ids: activityIds,
      is_completed: isCompleted,
      date: date
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk updating:', error.response?.data || error.message);
    throw error;
  }
};

// Get routine statistics
export const getRoutineStats = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/stats/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting stats:', error.response?.data || error.message);
    throw error;
  }
};

// Get categories
export const getCategories = async () => {
  try {
    const api = await createAuthAxios();
    const response = await api.get('/categories/');
    return response.data;
  } catch (error) {
    console.error('Error getting categories:', error.response?.data || error.message);
    throw error;
  }
};

// Get templates
export const getTemplates = async (ageGroup = null) => {
  try {
    const api = await createAuthAxios();
    const params = ageGroup ? { age_group: ageGroup } : {};
    const response = await api.get('/templates/', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting templates:', error.response?.data || error.message);
    throw error;
  }
};

// Create routine from template
export const createFromTemplate = async (childId, templateId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/templates/create-from/', {
      child_id: childId,
      template_id: templateId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating from template:', error.response?.data || error.message);
    throw error;
  }
};

// Reorder activities
export const reorderActivities = async (routineId, activities) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/routines/${routineId}/reorder/`, {
      activities: activities
    });
    return response.data;
  } catch (error) {
    console.error('Error reordering activities:', error.response?.data || error.message);
    throw error;
  }
};


// Process voice command
export const processVoiceCommand = async (childId, spokenText, confidence = 0.9) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/voice/command/', {
      child_id: childId,
      spoken_text: spokenText,
      confidence: confidence
    });
    return response.data;
  } catch (error) {
    console.error('Error processing voice command:', error);
    throw error;
  }
};

// Get activity reminders
export const getActivityReminders = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/voice/reminders/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting reminders:', error);
    throw error;
  }
};

// Get start notifications
export const getStartNotifications = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/voice/start-notifications/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting start notifications:', error);
    throw error;
  }
};

// Get voice settings
export const getVoiceSettings = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/voice/settings/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting voice settings:', error);
    throw error;
  }
};

// Update voice settings
export const updateVoiceSettings = async (childId, settings) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/voice/settings/${childId}/`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating voice settings:', error);
    throw error;
  }
};