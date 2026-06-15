// screentimeApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.176.131.220:8000/api/screentime'; //  your actual URL

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

const refreshToken = async () => {
  try {
    const refresh = await AsyncStorage.getItem('refresh_token');

    const res = await axios.post(
      'http://10.176.131.220:8000/api/token/refresh/',
      { refresh }
    );

    await AsyncStorage.setItem('access_token', res.data.access);
    return res.data.access;
  } catch (error) {
    console.log("Refresh token failed", error);
    throw error;
  }
};



// Create axios instance with auth
// const createAuthAxios = async () => {
//   const token = await getAuthToken();
//   return axios.create({
//     baseURL: API_BASE_URL,
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': token ? `Bearer ${token}` : '',
//     },
//   });

  
//   api.interceptors.response.use(
//     response => response,
//     async error => {
//       if (error.response?.status === 401) {
//         try {
//           const newToken = await refreshToken();

//           error.config.headers.Authorization = `Bearer ${newToken}`;
//           return api(error.config); // retry same request
//         } catch (err) {
//           console.log("Auto logout required");

//           // optional: logout user
//           await AsyncStorage.removeItem('access_token');
//           await AsyncStorage.removeItem('refresh_token');

//           return Promise.reject(err);
//         }
//       }
//       return Promise.reject(error);
//     }
//   );

//   return api;
// };

// Create axios instance with auth and interceptor
const createAuthAxios = async () => {
  const token = await getAuthToken();

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  // ✅ ADD INTERCEPTOR HERE
  api.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        try {
          const newToken = await refreshToken();

          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config); // retry same request
          
          console.log(await AsyncStorage.getItem('refresh_token'));

        } catch (err) {
          console.log("Auto logout required");

          // optional: logout user
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('refresh_token');

          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Update screen time (bulk update from background service)
export const updateScreenTime = async (childId, appData) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/update/', {
      child_id: childId,
      app_data: appData,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating screen time:', error.response?.data || error.message);
    throw error;
  }
};

// Get today's screen time
export const getTodayScreenTime = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get('/today/', {
      params: { child_id: childId },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting today screen time:', error.response?.data || error.message);
    throw error;
  }
};

// Get screen time summary (weekly/monthly)
export const getScreenTimeSummary = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get('/summary/', {
      params: { child_id: childId },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting screen time summary:', error.response?.data || error.message);
    throw error;
  }
};

// Get screen time logs (history)
export const getScreenTimeLogs = async (childId, date = null) => {
  try {
    const api = await createAuthAxios();
    const params = { child_id: childId };
    if (date) params.date = date;
    
    const response = await api.get('/list/', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting screen time logs:', error.response?.data || error.message);
    throw error;
  }
};

// Get app limits
export const getAppLimits = async (childId) => {
  try {
    const api = await createAuthAxios();
    const response = await api.get('/app-limits/', {
      params: { child_id: childId },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting app limits:', error.response?.data || error.message);
    throw error;
  }
};

// Create app limit
export const createAppLimit = async (childId, appName, appPackage, dailyLimitMinutes, isBlocked = false) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/app-limits/', {
      child: childId,
      app_name: appName,
      app_package: appPackage,
      daily_limit_minutes: dailyLimitMinutes,
      is_blocked: isBlocked,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating app limit:', error.response?.data || error.message);
    throw error;
  }
};

// Update app limit
export const updateAppLimit = async (limitId, dailyLimitMinutes, isBlocked) => {
  try {
    const api = await createAuthAxios();
    const response = await api.patch(`/app-limits/${limitId}/`, {
      daily_limit_minutes: dailyLimitMinutes,
      is_blocked: isBlocked,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating app limit:', error.response?.data || error.message);
    throw error;
  }
};

// Delete app limit
export const deleteAppLimit = async (limitId) => {
  try {
    const api = await createAuthAxios();
    await api.delete(`/app-limits/${limitId}/`);
    return true;
  } catch (error) {
    console.error('Error deleting app limit:', error.response?.data || error.message);
    throw error;
  }
};

// Check if app access should be allowed
export const checkAppAccess = async (childId, appPackage) => {
  try {
    const api = await createAuthAxios();
    const response = await api.post('/check-access/', {
      child_id: childId,
      app_package: appPackage,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking app access:', error.response?.data || error.message);
    throw error;
  }
};
