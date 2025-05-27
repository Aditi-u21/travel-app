import axios from "axios";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";

const configPlace = {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAP_API_KEY,
    "X-Goog-FieldMask": [
      "places.id",
      "places.name",
      "places.displayName",
      "places.formattedAddress",
      "places.photos",
      "places.googleMapsUri",
      "places.location",
      "places.priceLevel",
      "places.rating",
    ],
  },
};

const configCity = {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAP_API_KEY,
    "X-Goog-FieldMask": [
      "places.name",
      "places.displayName",
      "places.photos",
      "places.googleMapsUri",
      "places.location",
    ],
  },
};

export const PHOTO_URL =
  "https://places.googleapis.com/v1/{replace}/media?maxHeightPx=1000&key=" +
  import.meta.env.VITE_GOOGLE_MAP_API_KEY;

export const getPlaceDetails = async (data) => {
  try {
    const response = await axios.post(BASE_URL, data, configPlace);
    return response;
  } catch (error) {
    console.error("Error in getPlaceDetails:", error);
    return { data: { places: [] } }; // Return empty array on error
  }
};

export const getCityDetails = async (data) => {
  try {
    const response = await axios.post(BASE_URL, data, configCity);
    return response;
  } catch (error) {
    console.error("Error in getCityDetails:", error);
    return { data: { places: [] } }; // Return empty array on error
  }
};