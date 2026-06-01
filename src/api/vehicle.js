import { apiGet, VEHICLE_URL } from "./client";

export const getVehicleHealth = () => apiGet("/health", VEHICLE_URL);

export const getVehicleCameras = () => apiGet("/cameras", VEHICLE_URL);

export const getVehicleActivity = (limit = 20) =>
  apiGet(`/dashboard?type=activity&limit=${limit}`, VEHICLE_URL);
