import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:8000"
    : "http://10.176.131.220:8000";
