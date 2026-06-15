// notificationsApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.176.131.220:8000/api/notifications'; // Update with your backend URL

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

// Get all notifications for a child
export const getNotifications = async (childId, filters = {}) => {
  try {
    const api = await createAuthAxios();
    const params = {};
    
    // Add filters
    if (filters.isRead !== undefined) params.is_read = filters.isRead;
    if (filters.type) params.type = filters.type;
    if (filters.priority) params.priority = filters.priority;
    if (filters.actionRequired !== undefined) params.action_required = filters.actionRequired;
    if (filters.excludeExpired) params.exclude_expired = filters.excludeExpired;
    
    const response = await api.get(`/${childId}/`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting notifications:', error.response?.data || error.message);
    throw error;
  }
};

// Get notification summary
export const getNotificationSummary = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/summary/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting notification summary:', error.response?.data || error.message);
    throw error;
  }
};

// Get recent notifications (last 24 hours)
export const getRecentNotifications = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/recent/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting recent notifications:', error.response?.data || error.message);
    throw error;
  }
};

// Mark single notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.patch(`/read/${notificationId}/`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error.response?.data || error.message);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/read-all/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error marking all as read:', error.response?.data || error.message);
    throw error;
  }
};

// Delete single notification
export const deleteNotification = async (notificationId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.delete(`/delete/${notificationId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error.response?.data || error.message);
    throw error;
  }
};

// Clear all read notifications
export const clearAllNotifications = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post(`/clear/${childId}/`);
    return response.data;
  } catch (error) {
    console.error('Error clearing notifications:', error.response?.data || error.message);
    throw error;
  }
};

// Create a new notification (for testing or manual creation)
export const createNotification = async (notificationData) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/create/', notificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error.response?.data || error.message);
    throw error;
  }
};

// Poll for new notifications (call this periodically)
export const pollForNewNotifications = async (childId, lastCheckTime) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get(`/${childId}/`, {
      params: {
        is_read: false,
        created_at__gt: lastCheckTime // If your backend supports this filter
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error polling notifications:', error.response?.data || error.message);
    return [];
  }
};