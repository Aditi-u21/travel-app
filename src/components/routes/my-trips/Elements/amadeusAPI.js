// Function to get access token from Amadeus API
export const getAccessToken = async () => {
  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: import.meta.env.VITE_AMADEUS_API_KEY, // Ensure this is set in your environment
      client_secret: import.meta.env.VITE_AMADEUS_API_SECRET, // Ensure this is set in your environment
    }),
  });

  // Check if the response is OK
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Error response body:", errorBody);
    throw new Error("Failed to get access token");
  }

  const data = await response.json();
  return data.access_token; // Return the access token
};

// Function to get IATA code from city name
export const getAirportCodeFromCity = async (cityName, token) => {
  const cleanCity = cityName.split(",")[0].trim(); // Clean the city name

  const url = `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(cleanCity)}&page[limit]=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }, // Use the provided token for authorization
  });

  // Check if the response is OK
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Error response body:", errorBody);
    throw new Error("Failed to fetch airport code from city");
  }

  const data = await res.json();

  // Return the IATA code if available
  if (!data?.data?.length) return null;

  return data.data[0].iataCode || null;
};

// Function to search for flights
export const searchFlights = async (origin, destination, date, token) => {
  const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }, // Use the provided token for authorization
  });

  // Check if the response is OK
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Error response body:", errorBody);
    throw new Error("Failed to fetch flights");
  }

  const data = await res.json();
  return data.data || []; // Return flight data or an empty array if none found
};
