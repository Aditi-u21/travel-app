/*import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Send,
  Loader2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { joeyChatSession } from "@/Service/JoeyAiModel";
import axios from "axios";
import { jsPDF } from "jspdf";

// Constants
const ROLES = { USER: "user", JOEY: "joey" };
const WEATHER_API = {
  URL: "https://api.openweathermap.org/data/2.5/weather",
  FORECAST_URL: "https://api.openweathermap.org/data/2.5/forecast",
  KEY: import.meta.env.VITE_WEATHER_API_KEY || "bd5e378503939ddaee76f12ad7a97608",
};
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
const PATHFINDING_WEIGHTS = { distance: 0.4, cost: 0.3, scenic: 0.2, safety: 0.1 };

function Joey({ open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlanningTrip, setIsPlanningTrip] = useState(false);
  const [tripDetails, setTripDetails] = useState({});
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [routeCoords, setRouteCoords] = useState([]);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [travelTime, setTravelTime] = useState(null);
  const [userTimezone, setUserTimezone] = useState("");

  const cleanResponse = (response) => {
    const jsonMatch = response.match(/{[\s\S]*}/);
    return jsonMatch ? jsonMatch[0].trim() : response.trim();
  };

  const formatItinerary = ({ trip, itinerary }) => {
    let output = `✈️ **Trip to ${trip.destination}**\n`;
    output += `Duration: ${trip.duration} | Budget: ${trip.budget} | Group: ${trip.groupSize}\n`;
    output += `Hotel Type: ${trip.hotelType} | Interests: ${trip.interests.join(", ")}\n`;
    output += `Timezone: ${userTimezone}\n\n`;
    itinerary.forEach(({ day, plan }) => {
      output += `📅 **${day}**\n`;
      plan.forEach(({ time, activity }) => {
        output += `  ⏰ ${time} (${convertToUserTimezone(time)}): ${activity}\n`;
      });
      output += "─".repeat(40) + "\n";
    });
    return output.trim();
  };

  useEffect(() => {
    const getTimezone = async () => {
      if (mapCenter.lat && mapCenter.lng && !userTimezone) {
        const timezone = await getUserTimezone(mapCenter.lat, mapCenter.lng);
        setUserTimezone(timezone);
      }
    };
    getTimezone();
  }, [mapCenter, userTimezone]);

  const fetchWeather = async (cityOrCoords) => {
    try {
      const url = typeof cityOrCoords === "string"
        ? `${WEATHER_API.URL}?q=${cityOrCoords}&appid=${WEATHER_API.KEY}&units=metric`
        : `${WEATHER_API.URL}?lat=${cityOrCoords.lat}&lon=${cityOrCoords.lng}&appid=${WEATHER_API.KEY}&units=metric`;
      const { data } = await axios.get(url);
      return {
        role: ROLES.JOEY,
        text: `The weather in ${data.name || "your area"} is ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`,
      };
    } catch (error) {
      return {
        role: ROLES.JOEY,
        text: `I couldn’t fetch the weather. Try again?`,
      };
    }
  };

  const fetchDailyForecast = async (city) => {
    try {
      const url = `${WEATHER_API.FORECAST_URL}?q=${city}&appid=${WEATHER_API.KEY}&units=metric`;
      const { data } = await axios.get(url);
      return data.list.slice(0, 5).map((item) => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        description: item.weather[0].description,
        temp: item.main.temp,
      }));
    } catch (error) {
      console.error("Forecast error:", error);
      return [];
    }
  };

  const getRouteData = async (origin, destination) => {
    try {
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(origin),
        geocodeAddress(destination),
      ]);
      if (!originCoords || !destCoords) throw new Error("Invalid coordinates");

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      const route = data.routes[0];
      const path = route.overview_polyline.points;
      setRouteCoords(google.maps.geometry.encoding.decodePath(path));
      setMapCenter(destCoords);
      return {
        distance: route.legs[0].distance.value / 1000,
        cost: route.legs[0].distance.value * 0.1,
        scenic: 0.5,
        safety: 0.7,
      };
    } catch (error) {
      console.error("Route data error:", error);
      return null; // Return null to indicate failure without breaking itinerary
    }
  };

  const geocodeAddress = async (address) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    const { data } = await axios.get(url);
    const location = data.results[0]?.geometry.location;
    return location ? { lat: location.lat, lng: location.lng } : null;
  };

  const fetchNearbyAttractions = async (location) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=tourist_attraction|restaurant&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      return data.results.slice(0, 3).map((place) => ({
        name: place.name,
        vicinity: place.vicinity,
        photo: place.photos?.[0]?.photo_reference,
      }));
    } catch (error) {
      console.error("Attractions error:", error);
      return []; // Return empty array to prevent breaking itinerary
    }
  };

  const getTravelTime = async (origins, destinations) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      const leg = data.rows[0].elements[0];
      return leg.duration.text;
    } catch (error) {
      console.error("Travel time error:", error);
      return "Unknown"; // Fallback to prevent breaking itinerary
    }
  };

  const getUserTimezone = async (lat, lng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}×tamp=${Date.now() / 1000}&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      return data.timeZoneId;
    } catch (error) {
      console.error("Timezone error:", error);
      return "UTC"; // Fallback to UTC
    }
  };

  const convertToUserTimezone = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) return time;
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-US", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Multi-objective pathfinding to select the best route based on weighted criteria
  const optimizeRoute = (routes) => {
    // Initialize with an impossibly high score to ensure any route is better
    let bestRoute = { score: Infinity };
    
    // Iterate through each route to calculate its weighted score
    routes.forEach((current) => {
      // Calculate score using weights for distance, cost, scenic value, and safety
      // Lower scores are better; weights sum to 1 for normalized scoring
      const score = 
        (PATHFINDING_WEIGHTS.distance * current.distance) + // Prioritizes shorter routes
        (PATHFINDING_WEIGHTS.cost * current.cost) +         // Favors cheaper routes
        (PATHFINDING_WEIGHTS.scenic * current.scenic) +     // Values scenic routes
        (PATHFINDING_WEIGHTS.safety * current.safety);      // Prefers safer routes
      
      // Update bestRoute if current score is lower (better)
      if (score < bestRoute.score) {
        bestRoute = { ...current, score };
      }
    });

    return bestRoute;
  };

  // Decision tree for contextual travel recommendations
  const decisionTreeReasoning = (input, context) => {
    const lowerInput = input.toLowerCase();
    
    // Check if user is asking for activity suggestions
    if (lowerInput.includes("what should i do")) {
      // Branch 1: Recommend budget-friendly activities if budget is low
      if (context.budget === "low") {
        return "Since you're on a budget, how about visiting free local attractions?";
      }
      // Branch 2: Suggest indoor activities if weather is rainy
      else if (context.weather?.includes("rain")) {
        return "It’s raining! Consider indoor activities.";
      }
    }
    
    // Return null if no specific recommendation applies
    return null;
  };

  const generateItinerary = useCallback(async (details) => {
    // Log the details for debugging
    console.log("Generating itinerary for:", details);

    // Prompt for generating the itinerary via Joey AI
    const prompt = `You’re Joey, a friendly travel assistant. Generate a detailed travel itinerary for: ${JSON.stringify(details)}. Return it as JSON with a "trip" object (destination, duration, budget, groupSize, hotelType, interests) and an "itinerary" array (day objects with "day" and "plan" arrays of "time" and "activity"). Include potential routes with distance, cost, scenic value (0-1), and safety (0-1). Tailor activities to interests. No extra text.`;
    
    // Send prompt to Joey AI model
    const result = await joeyChatSession.sendMessage(prompt);
    const raw = result.response.text();
    console.log("Raw response:", raw);

    try {
      // Clean and parse the raw JSON response
      const cleaned = cleanResponse(raw);
      console.log("Cleaned JSON:", cleaned);
      if (!cleaned || cleaned === "{}") throw new Error("Empty or invalid JSON");
      const data = JSON.parse(cleaned);

      // Set default origin for route calculations
      const origin = "Starting Point";

      // Attempt to fetch route data, but don't fail if it errors
      let routeData = await getRouteData(origin, details.destination);
      if (routeData) {
        data.routes = data.routes || [];
        data.routes.push(routeData);
        const optimizedRoute = optimizeRoute(data.routes);
        data.optimizedRoute = optimizedRoute;
      } else {
        console.warn("Route data unavailable; proceeding with itinerary.");
      }

      // Attempt to fetch nearby attractions, but proceed if it fails
      let attractions = [];
      if (mapCenter.lat && mapCenter.lng) {
        attractions = await fetchNearbyAttractions(mapCenter);
      }
      setNearbyAttractions(attractions);

      // Attempt to fetch travel time, but use fallback if it fails
      const travelTime = await getTravelTime(origin, details.destination);
      setTravelTime(travelTime);

      // Store trip details for context
      setTripDetails(data.trip);

      // Format and return the itinerary with available data
      let responseText = formatItinerary(data);
      responseText += `\nTravel Time: ${travelTime}`;
      if (attractions.length > 0) {
        responseText += `\nNearby Attractions: ${attractions.map(a => a.name).join(", ")}.`;
      }

      return {
        role: ROLES.JOEY,
        text: responseText,
      };
    } catch (error) {
      // Log the error for debugging
      console.error("Itinerary Error:", error, "Raw:", raw);

      // Attempt to use the raw response if it contains a valid itinerary
      try {
        const cleaned = cleanResponse(raw);
        if (cleaned && cleaned !== "{}") {
          const data = JSON.parse(cleaned);
          setTripDetails(data.trip || {});
          let responseText = formatItinerary(data);
          responseText += `\nTravel Time: Unavailable due to network issues.`;
          if (data.routes && data.routes.length > 0) {
            responseText += `\nRoutes: ${data.routes.map(r => `${r.route}: ${r.distance}km`).join(", ")}.`;
          }
          return {
            role: ROLES.JOEY,
            text: responseText,
          };
        }
      } catch (fallbackError) {
        console.error("Fallback parsing error:", fallbackError);
      }

      // If all else fails, return an error message
      return {
        role: ROLES.JOEY,
        text: `I couldn’t generate the itinerary due to a network issue. Please try again! Raw response: ${raw}`,
      };
    }
  }, [mapCenter, userTimezone]);

  const handleTripPlanning = useCallback(
    async (userInput, chatHistory) => {
      const lowerInput = userInput.toLowerCase();
      const historyText = chatHistory.map((msg) => `${msg.role === ROLES.USER ? "You" : "Joey"}: ${msg.text}`).join("\n");

      // Initiate trip planning if user requests it
      if (!isPlanningTrip && (lowerInput.includes("plan a trip") || lowerInput.includes("itinerary"))) {
        setIsPlanningTrip(true);
        return { role: ROLES.JOEY, text: "Awesome! Let’s plan your trip. Where are you headed?" };
      }

      // Handle reset if user wants to change plans
      if (lowerInput.includes("forget") || lowerInput.includes("already planning")) {
        setIsPlanningTrip(true);
        return { role: ROLES.JOEY, text: "My mistake! Where are we planning to go now?" };
      }

      // Extract trip details from conversation history
      const detailsPrompt = `Extract from:\n${historyText}\nUser: "${userInput}"\nReturn JSON with "destination", "duration", "budget", "groupSize", "hotelType", "interests" (array). Do not use defaults unless explicitly mentioned. If a field is missing, return it as null.`;
      const detailsResult = await joeyChatSession.sendMessage(detailsPrompt);
      const detailsRaw = detailsResult.response.text();

      try {
        const details = JSON.parse(cleanResponse(detailsRaw));
        console.log("Extracted details:", details);

        // Validate required trip details
        if (!details.destination) {
          return { role: ROLES.JOEY, text: "Got it! Where are you planning to travel?" };
        }
        if (!details.budget) {
          return { role: ROLES.JOEY, text: `Great choice with ${details.destination}! What’s your budget for this trip?` };
        }
        if (!details.groupSize) {
          return { role: ROLES.JOEY, text: `Nice! How many people are traveling to ${details.destination}?` };
        }
        if (!details.duration) {
          return { role: ROLES.JOEY, text: `Awesome! How many days are you staying in ${details.destination}?` };
        }

        // All required details are present; proceed with itinerary generation
        if (details.destination && details.budget && details.groupSize && details.duration) {
          // Fill optional fields with defaults if not provided
          details.hotelType = details.hotelType || "mid-range";
          details.interests = details.interests && details.interests.length > 0 ? details.interests : ["culture", "food"];
          
          setIsPlanningTrip(false);
          return await generateItinerary(details);
        }

        // Prompt for additional details if still in planning mode
        return {
          role: ROLES.JOEY,
          text: `Cool, we're planning for ${details.destination || "somewhere"}! Can you share more details like your budget, how many people are going, and how long you’ll stay?`,
        };
      } catch (error) {
        console.error("Details Extraction Error:", error, "Raw:", detailsRaw);
        return { role: ROLES.JOEY, text: "I’m having trouble understanding the details. Could you clarify where you’re going, your budget, group size, and trip duration?" };
      }
    },
    [isPlanningTrip, generateItinerary, mapCenter]
  );

  const handleConversationalRequest = useCallback(
    async (chatHistory) => {
      const historyText = chatHistory.map((msg) => `${msg.role === ROLES.USER ? "You" : "Joey"}: ${msg.text}`).join("\n");
      const decisionResponse = decisionTreeReasoning(input, { ...tripDetails, weather: historyText.match(/weather.*(\w+)/i)?.[1] });
      if (decisionResponse) return { role: ROLES.JOEY, text: decisionResponse };

      const prompt = `You’re Joey. Respond to:\n${historyText}\nUser: "${input}"\nGive travel advice with context.`;
      const result = await joeyChatSession.sendMessage(prompt);
      return { role: ROLES.JOEY, text: result.response.text() };
    },
    [input, tripDetails]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMsg = { role: ROLES.USER, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      let response;

      if (messages.length === 0 && (lowerInput.includes("hi") || lowerInput.includes("hello"))) {
        response = { role: ROLES.JOEY, text: "Hi! I’m Joey, your travel buddy. Ready to plan?" };
      } else if (lowerInput.includes("weather") || lowerInput.includes("forecast")) {
        const cityMatch = input.match(/(?:weather|forecast)\s+(?:in|for)\s+(\w+)/i) || ["", "Paris"];
        response = await fetchWeather(cityMatch[1] || "Paris");
        if (lowerInput.includes("forecast")) {
          const forecast = await fetchDailyForecast(cityMatch[1] || "Paris");
          response.text += `\nDaily Forecast: ${forecast.map(f => `${f.date}: ${f.description}, ${f.temp}°C`).join(" | ")}`;
        }
      } else if (lowerInput.includes("route") && lowerInput.match(/from\s+(\w+)\s+to\s+(\w+)/i)) {
        const [_, origin, destination] = lowerInput.match(/from\s+(\w+)\s+to\s+(\w+)/i);
        const routeData = await getRouteData(origin, destination);
        const travelTime = await getTravelTime(origin, destination);
        setTravelTime(travelTime);
        response = { role: ROLES.JOEY, text: `Travel Time: ${travelTime}.` };
      } else {
        response = isPlanningTrip || lowerInput.includes("plan a trip") || lowerInput.includes("itinerary")
          ? await handleTripPlanning(input, [...messages, userMsg])
          : await handleConversationalRequest([...messages, userMsg]);
      }

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: ROLES.JOEY, text: "Oops! Try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isPlanningTrip, handleTripPlanning, handleConversationalRequest]);

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setIsPlanningTrip(false);
    setTripDetails({});
    setMapCenter({ lat: 0, lng: 0 });
    setRouteCoords([]);
    setNearbyAttractions([]);
    setTravelTime(null);
    setUserTimezone("");
  };

  const saveAsPDF = () => {
    if (!messages.length) {
      setMessages([{ role: ROLES.JOEY, text: "Nothing to save yet!" }]);
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Joey Travel Chat - ${new Date().toLocaleDateString()}`, 10, 10);

    let yOffset = 20;
    messages.forEach((msg) => {
      const prefix = `${msg.role === ROLES.USER ? "You" : "Joey"}: `;
      const lines = doc.splitTextToSize(prefix + msg.text, 180);
      doc.setFontSize(12);
      doc.text(lines, 10, yOffset);
      yOffset += lines.length * 7;
      if (yOffset > 280) {
        doc.addPage();
        yOffset = 10;
      }
    });

    doc.save(`Joey_Chat_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Joey - Your Travel Buddy
          </DialogTitle>
        </DialogHeader>

        <div className="h-80 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm italic">
              I’m Joey! Ask about trips, weather, routes, or attractions!
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 p-3 rounded-lg max-w-[85%] ${
                  msg.role === ROLES.USER
                    ? "ml-auto bg-indigo-600 text-white"
                    : "mr-auto bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                } shadow-md`}
              >
                <span className="font-medium text-sm">
                  {msg.role === ROLES.USER ? "You" : "Joey"}:
                </span>{" "}
                <span className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </span>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Thinking...
            </div>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded-lg text-gray-800 dark:text-gray-100"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={startNewChat}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              New Chat
            </Button>
            <Button
              onClick={saveAsPDF}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Save as PDF
            </Button>
          </div>
        </div>

        <DialogClose asChild>
          <Button
            variant="outline"
            className="mt-4 w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Close Chat
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export default Joey;
*/
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Send,
  Loader2,
  FileText,
  RefreshCw,
  Map,
} from "lucide-react";
import { joeyChatSession } from "@/Service/JoeyAiModel";
import axios from "axios";
import { jsPDF } from "jspdf";
import {
  GoogleMap,
  LoadScript,
  Polyline,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import toast from "react-hot-toast";

// Constants
const ROLES = { USER: "user", JOEY: "joey" };
const WEATHER_API = {
  URL: "https://api.openweathermap.org/data/2.5/weather",
  FORECAST_URL: "https://api.openweathermap.org/data/2.5/forecast",
  KEY: import.meta.env.VITE_WEATHER_API_KEY || "bd5e378503939ddaee76f12ad7a97608",
};
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const PATHFINDING_WEIGHTS = { distance: 0.4, cost: 0.3, scenic: 0.2, safety: 0.1 };
const MAP_CONTAINER_STYLE = {
  height: "500px",
  width: "100%",
};

// Fallback coordinates for common routes
const FALLBACK_ROUTES = {
  "bengaluru-malpe": {
    origin: { lat: 12.9716, lng: 77.5946 }, // Bengaluru
    destination: { lat: 13.3490, lng: 74.7019 }, // Malpe
    distance: 410,
    duration: 435, // 7 hours 15 minutes in minutes
    pitStops: [
      { name: "Fuel Stop - Channarayapatna", coords: { lat: 12.9045, lng: 76.3918 }, time: "7:30 AM", type: "fuel" },
      { name: "Scenic Stop - Sakleshpur", coords: { lat: 12.9417, lng: 75.7337 }, time: "9:20 AM", type: "scenic" },
      { name: "Lunch Stop - Mangalore", coords: { lat: 12.9141, lng: 74.8560 }, time: "11:35 AM", type: "lunch" },
    ],
  },
  "bengaluru-goa": {
    origin: { lat: 12.9716, lng: 77.5946 }, // Bengaluru
    destination: { lat: 15.2993, lng: 74.1240 }, // Goa
    distance: 560,
    duration: 613, // 10 hours 13 minutes in minutes
    pitStops: [
      { name: "Fuel Stop - Tumkur", coords: { lat: 13.3392, lng: 77.1010 }, time: "6:30 AM", type: "fuel" },
      { name: "Lunch Stop - Hubli", coords: { lat: 15.3647, lng: 75.1240 }, time: "9:45 AM", type: "lunch" },
      { name: "Scenic Stop - Belgaum", coords: { lat: 15.8497, lng: 74.4977 }, time: "12:15 PM", type: "scenic" },
    ],
  },
};

// Custom map styles for dark/light theme
const MAP_STYLES = {
  light: [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  ],
  dark: [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  ],
};

function Joey({ open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlanningTrip, setIsPlanningTrip] = useState(false);
  const [tripDetails, setTripDetails] = useState({});
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [routeCoords, setRouteCoords] = useState([]);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [travelTime, setTravelTime] = useState(null);
  const [userTimezone, setUserTimezone] = useState("");
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [pitStops, setPitStops] = useState([]);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  const cleanResponse = (response) => {
    const jsonMatch = response.match(/{[\s\S]*}/);
    return jsonMatch ? jsonMatch[0].trim() : response.trim();
  };

  const formatItinerary = ({ trip, itinerary }) => {
    let output = `✈️ **Trip to ${trip.destination}**\n`;
    output += `Duration: ${trip.duration || "Not specified"} | Budget: ${trip.budget || "Not specified"} | Group: ${trip.groupSize || "Not specified"}\n`;
    output += `Hotel Type: ${trip.hotelType || "Not specified"} | Interests: ${(trip.interests || []).join(", ") || "Not specified"}\n`;
    output += `Timezone: ${userTimezone}\n\n`;
    itinerary.forEach(({ day, plan }) => {
      output += `📅 **${day}**\n`;
      plan.forEach(({ time, activity }) => {
        output += `  ⏰ ${time} (${convertToUserTimezone(time)}): ${activity}\n`;
      });
      output += "─".repeat(40) + "\n";
    });
    return output.trim();
  };

  useEffect(() => {
    const getTimezone = async () => {
      if (mapCenter.lat && mapCenter.lng && !userTimezone) {
        const timezone = await getUserTimezone(mapCenter.lat, mapCenter.lng);
        setUserTimezone(timezone);
      }
    };
    getTimezone();
  }, [mapCenter, userTimezone]);

  const fetchWeather = async (cityOrCoords) => {
    try {
      const url = typeof cityOrCoords === "string"
        ? `${WEATHER_API.URL}?q=${cityOrCoords}&appid=${WEATHER_API.KEY}&units=metric`
        : `${WEATHER_API.URL}?lat=${cityOrCoords.lat}&lon=${cityOrCoords.lng}&appid=${WEATHER_API.KEY}&units=metric`;
      const { data } = await axios.get(url);
      return {
        role: ROLES.JOEY,
        text: `The weather in ${data.name || "your area"} is ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`,
      };
    } catch (error) {
      return {
        role: ROLES.JOEY,
        text: `I couldn’t fetch the weather. Try again?`,
      };
    }
  };

  const fetchDailyForecast = async (city) => {
    try {
      const url = `${WEATHER_API.FORECAST_URL}?q=${city}&appid=${WEATHER_API.KEY}&units=metric`;
      const { data } = await axios.get(url);
      return data.list.slice(0, 5).map((item) => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        description: item.weather[0].description,
        temp: item.main.temp,
      }));
    } catch (error) {
      console.error("Forecast error:", error);
      return [];
    }
  };

  const geocodeAddress = async (address) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    try {
      const { data } = await axios.get(url);
      if (data.status !== "OK") {
        console.error(`Geocoding failed for ${address}: ${data.status}`);
        return null;
      }
      const location = data.results[0]?.geometry.location;
      return location ? { lat: location.lat, lng: location.lng } : null;
    } catch (error) {
      console.error(`Geocoding error for ${address}:`, error);
      return null;
    }
  };

  const fetchNearbyPlaces = async (location, type) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=${type}&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      if (data.status !== "OK" || !data.results.length) return null;
      const place = data.results[0];
      return {
        name: place.name,
        coords: place.geometry.location,
        type: type === "gas_station" ? "fuel" : type === "restaurant" ? "lunch" : "scenic",
      };
    } catch (error) {
      console.error(`Error fetching nearby ${type}:`, error);
      return null;
    }
  };

  const getRouteData = async (origin, destination, waypoints = [], departureTime = null) => {
    try {
      console.log("Google API Key:", GOOGLE_API_KEY);
      console.log("Fetching coords for Origin:", origin, "Destination:", destination);
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(`${origin}, India`),
        geocodeAddress(`${destination}, India`),
      ]);
      console.log("Origin Coords:", originCoords);
      console.log("Destination Coords:", destCoords);

      // Fallback key for route lookup
      const routeKey = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
      if (!originCoords || !destCoords) {
        console.warn("Geocoding failed, using fallback coordinates");
        if (FALLBACK_ROUTES[routeKey]) {
          const fallback = FALLBACK_ROUTES[routeKey];
          setRouteCoords([fallback.origin, ...fallback.pitStops.map(p => p.coords), fallback.destination]);
          setMapCenter(fallback.destination);
          setPitStops(fallback.pitStops);
          setTotalDistance(fallback.distance);
          setTotalDuration(`${Math.floor(fallback.duration / 60)} hours ${fallback.duration % 60} minutes`);
          return {
            distance: fallback.distance,
            cost: fallback.distance * 0.1,
            scenic: 0.5,
            safety: 0.7,
            pitStops: fallback.pitStops,
            duration: fallback.duration,
          };
        }
        // Generic fallback if no specific route match
        const fallbackOrigin = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
        const fallbackDest = { lat: 15.2993, lng: 74.1240 }; // Goa
        setRouteCoords([fallbackOrigin, fallbackDest]);
        setMapCenter(fallbackDest);
        setPitStops(waypoints);
        return {
          distance: 560,
          cost: 560 * 0.1,
          scenic: 0.5,
          safety: 0.7,
          pitStops: waypoints,
          duration: "10 hours 13 mins",
        };
      }
      const validWaypoints = waypoints.filter(w => w.coords && w.coords.lat && w.coords.lng);
      console.log("Valid Waypoints:", validWaypoints);
      const waypointString = validWaypoints.length > 0
        ? `&waypoints=${validWaypoints.map(w => `${w.coords.lat},${w.coords.lng}`).join("|")}`
        : "";
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}${waypointString}&key=${GOOGLE_API_KEY}`;
      console.log("Directions API URL:", url);
      const { data } = await axios.get(url);
      console.log("Directions API Response:", data);
      if (data.status !== "OK") {
        throw new Error(`Directions API failed: ${data.status} - ${data.error_message || "No error message"}`);
      }
      const route = data.routes[0];
      if (!route || !route.overview_polyline || !route.overview_polyline.points) {
        throw new Error("Invalid route data: Missing overview_polyline");
      }
      const path = route.overview_polyline.points;
      console.log("Encoded Path:", path);
      const decodedPath = google.maps.geometry.encoding.decodePath(path);
      console.log("Decoded Path:", decodedPath);
      setRouteCoords(decodedPath);
      setMapCenter(destCoords);
      setPitStops(validWaypoints);
      const distance = route.legs.reduce((total, leg) => total + leg.distance.value / 1000, 0);
      const durationMinutes = route.legs.reduce((total, leg) => {
        const durationText = leg.duration.text;
        const hours = parseInt(durationText.match(/(\d+)\s+hour/)?.[1] || 0);
        const minutes = parseInt(durationText.match(/(\d+)\s+min/)?.[1] || 0);
        return total + (hours * 60 + minutes);
      }, 0);
      setTotalDistance(Math.round(distance));
      setTotalDuration(`${Math.floor(durationMinutes / 60)} hours ${durationMinutes % 60} minutes`);
      return {
        distance: distance,
        cost: distance * 0.1,
        scenic: validWaypoints.some(w => w.type === "scenic") ? 0.7 : 0.5,
        safety: 0.9,
        pitStops: validWaypoints,
        duration: durationMinutes,
      };
    } catch (error) {
      console.error("Route data error:", error);
      const routeKey = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
      if (FALLBACK_ROUTES[routeKey]) {
        const fallback = FALLBACK_ROUTES[routeKey];
        setRouteCoords([fallback.origin, ...fallback.pitStops.map(p => p.coords), fallback.destination]);
        setMapCenter(fallback.destination);
        setPitStops(fallback.pitStops);
        setTotalDistance(fallback.distance);
        setTotalDuration(`${Math.floor(fallback.duration / 60)} hours ${fallback.duration % 60} minutes`);
        toast.error("Failed to load route data. Showing approximate route.");
        return {
          distance: fallback.distance,
          cost: fallback.distance * 0.1,
          scenic: 0.5,
          safety: 0.7,
          pitStops: fallback.pitStops,
          duration: fallback.duration,
        };
      }
      const fallbackOrigin = { lat: 12.9716, lng: 77.5946 };
      const fallbackDest = { lat: 15.2993, lng: 74.1240 };
      const fallbackPath = [fallbackOrigin, fallbackDest];
      console.log("Setting fallback routeCoords:", fallbackPath);
      setRouteCoords(fallbackPath);
      setMapCenter(fallbackDest);
      setPitStops(waypoints);
      setTotalDistance(560);
      setTotalDuration("10 hours 13 minutes");
      toast.error("Failed to load route data. Showing approximate locations.");
      return {
        distance: 560,
        cost: 560 * 0.1,
        scenic: 0.5,
        safety: 0.7,
        pitStops: waypoints,
        duration: 613,
      };
    }
  };

  const fetchNearbyAttractions = async (location) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=tourist_attraction|restaurant&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      return data.results.slice(0, 3).map((place) => ({
        name: place.name,
        vicinity: place.vicinity,
        photo: place.photos?.[0]?.photo_reference,
        coords: place.geometry.location,
      }));
    } catch (error) {
      console.error("Attractions error:", error);
      return [];
    }
  };

  const getTravelTime = async (origins, destinations) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      const leg = data.rows[0].elements[0];
      return leg.duration.text;
    } catch (error) {
      console.error("Travel time error:", error);
      return "Unknown";
    }
  };

  const getUserTimezone = async (lat, lng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Date.now() / 1000}&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      return data.timeZoneId;
    } catch (error) {
      console.error("Timezone error:", error);
      return "UTC";
    }
  };

  const convertToUserTimezone = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) return time;
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-US", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTime = (hours, minutes) => {
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const calculateArrivalTime = (departureTime, durationMinutes) => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    let period = departureTime.match(/(AM|PM)/i)[0].toUpperCase();
    let totalMinutes = (hours % 12 + (period === "PM" ? 12 : 0)) * 60 + minutes + durationMinutes;
    let newHours = Math.floor(totalMinutes / 60) % 24;
    let newMinutes = totalMinutes % 60;
    period = newHours >= 12 ? "PM" : "AM";
    newHours = newHours % 12 || 12;
    return formatTime(newHours, newMinutes);
  };

  const optimizeRoute = (routes) => {
    let bestRoute = { score: Infinity };
    routes.forEach((current) => {
      const score =
        (PATHFINDING_WEIGHTS.distance * current.distance) +
        (PATHFINDING_WEIGHTS.cost * current.cost) +
        (PATHFINDING_WEIGHTS.scenic * current.scenic) +
        (PATHFINDING_WEIGHTS.safety * current.safety);
      if (score < bestRoute.score) {
        bestRoute = { ...current, score };
      }
    });
    return bestRoute;
  };

  const decisionTreeReasoning = (input, context) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("what should i do")) {
      if (context.budget === "low") {
        return "Since you're on a budget, how about visiting free local attractions?";
      } else if (context.weather?.includes("rain")) {
        return "It’s raining! Consider indoor activities.";
      }
    }
    return null;
  };

  const generateItinerary = useCallback(async (details) => {
    console.log("Generating itinerary for:", details);
    const prompt = `You’re Joey, a friendly travel assistant. Generate a detailed travel itinerary for: ${JSON.stringify(details)}. Return it as JSON with a "trip" object (destination, duration, budget, groupSize, hotelType, interests) and an "itinerary" array (day objects with "day" and "plan" arrays of "time" and "activity"). Include potential routes with distance, cost, scenic value (0-1), and safety (0-1). Tailor activities to interests. No extra text.`;
    const result = await joeyChatSession.sendMessage(prompt);
    const raw = result.response.text();
    console.log("Raw response:", raw);
    try {
      const cleaned = cleanResponse(raw);
      console.log("Cleaned JSON:", cleaned);
      if (!cleaned || cleaned === "{}") throw new Error("Empty or invalid JSON");
      const data = JSON.parse(cleaned);
      const originMatch = messages
        .filter(msg => msg.role === ROLES.USER)
        .map(msg => msg.text.toLowerCase())
        .join(" ")
        .match(/from\s+([a-zA-Z\s]+)\s+to/);
      const origin = originMatch ? originMatch[1].trim() : "Bengaluru";
      const departureMatch = messages
        .filter(msg => msg.role === ROLES.USER)
        .map(msg => msg.text.toLowerCase())
        .join(" ")
        .match(/leaving\s+(?:at\s+)?(\d+\s*(?:am|pm))/i);
      const departureTime = departureMatch ? departureMatch[1] : "5:00 AM";
      const returnMatch = messages
        .filter(msg => msg.role === ROLES.USER)
        .map(msg => msg.text.toLowerCase())
        .join(" ")
        .match(/back\s+on\s+(\d+\w+\s+\w+)/i);
      const returnDate = returnMatch ? returnMatch[1] : null;
      const isScenic = messages.some(msg => msg.role === ROLES.USER && msg.text.toLowerCase().includes("scenic route"));
      const isOwnCar = messages.some(msg => msg.role === ROLES.USER && msg.text.toLowerCase().includes("via car") || msg.text.toLowerCase().includes("own car"));
      const itineraryLocations = [];
      for (const day of data.itinerary) {
        for (const plan of day.plan) {
          const locationMatch = plan.activity.match(/(?:visit|explore|at)\s+([A-Za-z\s]+)(?:\s|$)/i);
          if (locationMatch) {
            const locationName = locationMatch[1].trim();
            const coords = await geocodeAddress(`${locationName}, ${details.destination}, India`);
            if (coords) {
              itineraryLocations.push({
                name: locationName,
                coords,
                type: "itinerary",
              });
            }
          }
        }
      }
      console.log("Itinerary Locations:", itineraryLocations);
      let pitStops = [...itineraryLocations];
      let routeMessage = "";
      let routeDetails = "";
      let routeData;
      if (isOwnCar) {
        routeData = await getRouteData(origin, details.destination, [], departureTime);
        const totalDistance = routeData.distance;
        const totalDurationMinutes = routeData.duration;
        const segmentDistance = totalDistance / 3;
        let currentDistance = 0;
        let currentTime = departureTime;
        let points = [{ name: `Point A: ${origin}`, coords: await geocodeAddress(`${origin}, India`), time: departureTime }];
        let manualPitStops = [];
        let pointIndex = 1;
        const departureDate = "May 16, 2025";
        const routeResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin},India&destination=${details.destination},India&key=${GOOGLE_API_KEY}`
        );
        const route = routeResponse.data.routes[0];
        const legs = route.legs[0];
        const steps = legs.steps;
        let accumulatedDistance = 0;
        for (const step of steps) {
          accumulatedDistance += step.distance.value / 1000;
          if (accumulatedDistance >= currentDistance + segmentDistance && manualPitStops.length < 3) {
            const location = step.end_location;
            currentDistance = accumulatedDistance;
            let stopType, stopActivity;
            if (manualPitStops.length === 0) {
              stopType = "gas_station";
              stopActivity = "Fuel Stop. Refuel, stretch, and grab a quick snack (20 minutes).";
            } else if (manualPitStops.length === 1) {
              stopType = "restaurant";
              stopActivity = "Lunch Stop. Have a light meal at a local eatery (45 minutes).";
            } else {
              stopType = "tourist_attraction";
              stopActivity = "Scenic Stop. Enjoy the views and take a break (30 minutes).";
            }
            const place = await fetchNearbyPlaces(location, stopType);
            if (place) {
              const durationAtStop = stopType === "restaurant" ? 45 : stopType === "tourist_attraction" ? 30 : 20;
              const travelDurationToStop = Math.round((currentDistance / totalDistance) * totalDurationMinutes);
              currentTime = calculateArrivalTime(currentTime, travelDurationToStop);
              manualPitStops.push({
                name: `${stopType === "gas_station" ? "Fuel Stop" : stopType === "restaurant" ? "Lunch Stop" : "Scenic Stop"} - ${place.name}`,
                coords: place.coords,
                time: currentTime,
                type: place.type,
              });
              points.push({
                name: `Point ${String.fromCharCode(66 + pointIndex++)}: ${place.name}`,
                coords: place.coords,
                time: currentTime,
              });
              currentTime = calculateArrivalTime(currentTime, durationAtStop);
            }
          }
        }
        const finalArrivalTime = calculateArrivalTime(departureTime, totalDurationMinutes + manualPitStops.reduce((sum, stop) => sum + (stop.type === "lunch" ? 45 : stop.type === "scenic" ? 30 : 20), 0));
        points.push({
          name: `Destination: ${details.destination}`,
          coords: await geocodeAddress(`${details.destination}, India`),
          time: finalArrivalTime,
        });
        pitStops = [...manualPitStops, ...itineraryLocations];
        routeData = await getRouteData(origin, details.destination, pitStops, departureTime);
        routeDetails = `\n\n🚗 **Route from ${origin} to ${details.destination}**\n`;
        routeDetails += `**Departure**: ${departureTime} on ${departureDate} from ${origin} (Point A)\n`;
        routeDetails += `**Route Overview**: Follow the recommended route with stops for fuel, lunch, and a scenic break.\n`;
        routeDetails += `**Total Distance**: ~${Math.round(totalDistance)} km\n`;
        routeDetails += `**Total Duration**: ~${Math.floor(totalDurationMinutes / 60)} hours ${totalDurationMinutes % 60} minutes (including stops)\n\n`;
        routeDetails += `**Point-to-Point Route**:\n`;
        for (let i = 0; i < points.length - 1; i++) {
          const fromPoint = points[i];
          const toPoint = points[i + 1];
          const segmentDistance = i === 0 ? (totalDistance / (points.length - 1)) : (totalDistance / (points.length - 1));
          const segmentDuration = Math.round((segmentDistance / totalDistance) * totalDurationMinutes);
          routeDetails += `- **${fromPoint.name} to ${toPoint.name}**: Depart at ${fromPoint.time}, drive ~${Math.round(segmentDistance)} km (~${Math.floor(segmentDuration / 60)} hours ${segmentDuration % 60} minutes). Arrive by ${toPoint.time}.\n`;
          const pitStop = manualPitStops.find(stop => stop.time === toPoint.time);
          if (pitStop) {
            const activity = pitStop.type === "fuel" ? "Fuel Stop. Refuel, stretch, and grab a quick snack (20 minutes)." :
                            pitStop.type === "lunch" ? "Lunch Stop. Have a light meal at a local eatery (45 minutes)." :
                            "Scenic Stop. Enjoy the views and take a break (30 minutes).";
            routeDetails += `  - **Pit Stop ${i + 1} (${toPoint.time})**: ${activity}\n`;
          }
        }
        const fuelCost = (totalDistance / 12) * 100;
        routeDetails += `\n**Car Travel Notes**: Since you're using your own car, ensure it's serviced. Fuel costs: ~₹${Math.round(fuelCost)} (12 km/l, ₹100/l). Carry a spare tire and toolkit. May weather can be hot (30-35°C); ensure your AC works and carry water and sunscreen.\n`;
        const arrivalTime = finalArrivalTime;
        data.itinerary = [
          {
            day: "Day 1 - May 16",
            plan: [
              { time: `Afternoon (${arrivalTime})`, activity: `Check into a mid-range hotel in ${details.destination}. Quick rest after the long drive.` },
              { time: `Evening (${calculateArrivalTime(arrivalTime, 75)})`, activity: `Dinner at a local restaurant in ${details.destination}. Try local cuisine.` },
            ],
          },
          {
            day: "Day 2 - May 17",
            plan: [
              { time: "Morning (9:00 AM)", activity: "Visit a local cultural site or landmark." },
              { time: "Afternoon (1:00 PM)", activity: "Lunch at a nearby restaurant, trying local dishes." },
              { time: "Afternoon (3:00 PM)", activity: "Explore a scenic attraction or market." },
              { time: "Evening (6:00 PM)", activity: "Sunset views at a popular spot, followed by dinner." },
            ],
          },
          {
            day: "Day 3 - May 18",
            plan: [
              { time: "Morning (5:00 AM)", activity: `Depart from ${details.destination} for ${origin}.` },
              { time: "Morning (7:30 AM)", activity: "Fuel Stop en route. Quick refuel and stretch (20 minutes)." },
              { time: "Afternoon (12:20 PM)", activity: "Lunch Stop en route. Light meal at a local eatery (45 minutes)." },
              { time: `Evening (${finalArrivalTime})`, activity: `Arrive back in ${origin} after a ~${Math.round(totalDistance)} km drive (~${Math.floor(totalDurationMinutes / 60)} hours ${totalDurationMinutes % 60} minutes including stops).` },
            ],
          },
        ];
      } else {
        routeData = await getRouteData(origin, details.destination, pitStops);
      }
      setNearbyAttractions(pitStops);
      if (routeData) {
        data.routes = data.routes || [];
        data.routes.push(routeData);
        const optimizedRoute = optimizeRoute(data.routes);
        data.optimizedRoute = optimizedRoute;
      } else {
        routeMessage = "\nCouldn’t load route data. You can still view the itinerary below or click 'Show Route' to see approximate locations.";
      }
      const travelTime = routeData.duration
        ? `${Math.floor(routeData.duration / 60)} hours ${routeData.duration % 60} minutes`
        : await getTravelTime(origin, details.destination);
      setTravelTime(travelTime);
      setTripDetails(data.trip);
      let responseText = formatItinerary(data);
      responseText += `\nTravel Time: ${travelTime}`;
      if (pitStops.length > 0) {
        responseText += `\nStops: ${pitStops.map(a => a.name).join(", ")}.`;
      }
      responseText += routeMessage;
      responseText += routeDetails;
      return {
        role: ROLES.JOEY,
        text: responseText,
      };
    } catch (error) {
      console.error("Itinerary Error:", error, "Raw:", raw);
      try {
        const cleaned = cleanResponse(raw);
        if (cleaned && cleaned !== "{}") {
          const data = JSON.parse(cleaned);
          setTripDetails(data.trip || {});
          let responseText = formatItinerary(data);
          responseText += `\nTravel Time: Unavailable due to network issues.`;
          if (data.routes && data.routes.length > 0) {
            responseText += `\nRoutes: ${data.routes.map(r => `${r.route}: ${r.distance}km`).join(", ")}.`;
          }
          return {
            role: ROLES.JOEY,
            text: responseText,
          };
        }
      } catch (fallbackError) {
        console.error("Fallback parsing error:", fallbackError);
      }
      toast.error("Failed to generate itinerary. Please try again.");
      return {
        role: ROLES.JOEY,
        text: `I couldn’t generate the itinerary due to a network issue. Please try again!`,
      };
    }
  }, [mapCenter, userTimezone, messages]);

  const handleTripPlanning = useCallback(
    async (userInput, chatHistory) => {
      const lowerInput = userInput.toLowerCase();
      const historyText = chatHistory.map((msg) => `${msg.role === ROLES.USER ? "You" : "Joey"}: ${msg.text}`).join("\n");
      if (!isPlanningTrip && (lowerInput.includes("plan a trip") || lowerInput.includes("itinerary"))) {
        setIsPlanningTrip(true);
        return { role: ROLES.JOEY, text: "Awesome! Let’s plan your trip. Where are you headed?" };
      }
      if (lowerInput.includes("forget") || lowerInput.includes("already planning")) {
        setIsPlanningTrip(true);
        return { role: ROLES.JOEY, text: "My mistake! Where are we planning to go now?" };
      }
      const detailsPrompt = `Extract from:\n${historyText}\nUser: "${userInput}"\nReturn JSON with "destination", "duration", "budget", "groupSize", "hotelType", "interests" (array). Do not use defaults unless explicitly mentioned. If a field is missing, return it as null.`;
      const detailsResult = await joeyChatSession.sendMessage(detailsPrompt);
      const detailsRaw = detailsResult.response.text();
      try {
        const details = JSON.parse(cleanResponse(detailsRaw));
        console.log("Extracted details:", details);
        if (!details.destination) {
          return { role: ROLES.JOEY, text: "Got it! Where are you planning to travel?" };
        }
        if (details.destination && details.budget && details.groupSize && details.duration) {
          details.hotelType = details.hotelType || "mid-range";
          details.interests = details.interests && details.interests.length > 0 ? details.interests : ["culture", "food"];
          setIsPlanningTrip(false);
          return await generateItinerary(details);
        }
        return {
          role: ROLES.JOEY,
          text: `Cool, we're planning for ${details.destination || "somewhere"}! Can you share more details like your budget, how many people are going, and how long you’ll stay?`,
        };
      } catch (error) {
        console.error("Details Extraction Error:", error, "Raw:", detailsRaw);
        return { role: ROLES.JOEY, text: "I’m having trouble understanding the details. Could you clarify where you’re going, your budget, group size, and trip duration?" };
      }
    },
    [isPlanningTrip, generateItinerary, mapCenter]
  );

  const handleConversationalRequest = useCallback(
    async (chatHistory) => {
      const historyText = chatHistory.map((msg) => `${msg.role === ROLES.USER ? "You" : "Joey"}: ${msg.text}`).join("\n");
      const lowerInput = input.toLowerCase();
      const originMatch = historyText.match(/from\s+([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)/i);
      const isOwnCar = historyText.toLowerCase().includes("via car") || historyText.toLowerCase().includes("own car");
      const departureMatch = historyText.match(/leaving\s+(?:at\s+)?(\d+\s*(?:am|pm))/i);
      const departureTime = departureMatch ? departureMatch[1] : "5:00 AM";
      const returnMatch = historyText.match(/back\s+on\s+(\d+\w+\s+\w+)/i);
      const returnDate = returnMatch ? returnMatch[1] : null;
      if (lowerInput.includes("route") && originMatch && isOwnCar) {
        const origin = originMatch[1].trim();
        const destination = originMatch[2].trim();
        const tripDetails = {
          destination,
          duration: returnDate ? `from May 16, 2025 to ${returnDate}` : "Not specified",
          budget: null,
          groupSize: null,
          hotelType: "mid-range",
          interests: ["culture", "food"],
        };
        return await generateItinerary(tripDetails);
      }
      const decisionResponse = decisionTreeReasoning(input, { ...tripDetails, weather: historyText.match(/weather.*(\w+)/i)?.[1] });
      if (decisionResponse) return { role: ROLES.JOEY, text: decisionResponse };
      const prompt = `You’re Joey. Respond to:\n${historyText}\nUser: "${input}"\nGive travel advice with context.`;
      const result = await joeyChatSession.sendMessage(prompt);
      return { role: ROLES.JOEY, text: result.response.text() };
    },
    [input, tripDetails, generateItinerary]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const userMsg = { role: ROLES.USER, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const lowerInput = input.toLowerCase();
      let response;
      if (messages.length === 0 && (lowerInput.includes("hi") || lowerInput.includes("hello"))) {
        response = { role: ROLES.JOEY, text: "Hi! I’m Joey, your travel buddy. Ready to plan?" };
      } else if (lowerInput.includes("weather") || lowerInput.includes("forecast")) {
        const cityMatch = input.match(/(?:weather|forecast)\s+(?:in|for)\s+(\w+)/i) || ["", "Paris"];
        response = await fetchWeather(cityMatch[1] || "Paris");
        if (lowerInput.includes("forecast")) {
          const forecast = await fetchDailyForecast(cityMatch[1] || "Paris");
          response.text += `\nDaily Forecast: ${forecast.map(f => `${f.date}: ${f.description}, ${f.temp}°C`).join(" | ")}`;
        }
      } else if (lowerInput.includes("route") && lowerInput.match(/from\s+(\w+)\s+to\s+(\w+)/i)) {
        const [_, origin, destination] = lowerInput.match(/from\s+(\w+)\s+to\s+(\w+)/i);
        const routeData = await getRouteData(origin, destination);
        const travelTime = await getTravelTime(origin, destination);
        setTravelTime(travelTime);
        response = { role: ROLES.JOEY, text: `Travel Time: ${travelTime}.` };
      } else {
        response = isPlanningTrip || lowerInput.includes("plan a trip") || lowerInput.includes("itinerary")
          ? await handleTripPlanning(input, [...messages, userMsg])
          : await handleConversationalRequest([...messages, userMsg]);
      }
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: ROLES.JOEY, text: "Oops! Try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isPlanningTrip, handleTripPlanning, handleConversationalRequest]);

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setIsPlanningTrip(false);
    setTripDetails({});
    setMapCenter({ lat: 0, lng: 0 });
    setRouteCoords([]);
    setNearbyAttractions([]);
    setTravelTime(null);
    setUserTimezone("");
    setMapDialogOpen(false);
    setPitStops([]);
    setMapLoadError(null);
    setTotalDistance(0);
    setTotalDuration("");
    setSelectedMarker(null);
  };

  const saveAsPDF = () => {
    if (!messages.length) {
      setMessages([{ role: ROLES.JOEY, text: "Nothing to save yet!" }]);
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Joey Travel Chat - ${new Date().toLocaleDateString()}`, 10, 10);
    let yOffset = 20;
    messages.forEach((msg) => {
      const prefix = `${msg.role === ROLES.USER ? "You" : "Joey"}: `;
      const lines = doc.splitTextToSize(prefix + msg.text, 180);
      doc.setFontSize(12);
      doc.text(lines, 10, yOffset);
      yOffset += lines.length * 7;
      if (yOffset > 280) {
        doc.addPage();
        yOffset = 10;
      }
    });
    doc.save(`Joey_Chat_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
    if (routeCoords.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      routeCoords.forEach(coord => bounds.extend(coord));
      pitStops.forEach(stop => {
        if (stop.coords) bounds.extend(stop.coords);
      });
      map.fitBounds(bounds);
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case "scenic":
        return { url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png", scaledSize: new window.google.maps.Size(32, 32) };
      case "itinerary":
        return { url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png", scaledSize: new window.google.maps.Size(32, 32) };
      case "fuel":
      case "lunch":
        return { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", scaledSize: new window.google.maps.Size(32, 32) };
      default:
        return { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", scaledSize: new window.google.maps.Size(32, 32) };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Joey - Your Travel Buddy
          </DialogTitle>
        </DialogHeader>
        <div className="h-80 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm italic">
              I’m Joey! Ask about trips, weather, routes, or attractions!
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 p-3 rounded-lg max-w-[85%] ${
                  msg.role === ROLES.USER
                    ? "ml-auto bg-indigo-600 text-white"
                    : "mr-auto bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                } shadow-md`}
              >
                <span className="font-medium text-sm">
                  {msg.role === ROLES.USER ? "You" : "Joey"}:
                </span>{" "}
                <span className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </span>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Thinking...
            </div>
          )}
        </div>
        {routeCoords.length > 0 && (
          <Button
            onClick={() => setMapDialogOpen(true)}
            className="mt-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors"
          >
            <Map className="h-5 w-5 mr-2" />
            Show Route
          </Button>
        )}
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Route Map
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <LoadScript
                googleMapsApiKey={GOOGLE_API_KEY}
                libraries={["geometry"]}
                onError={() => {
                  setMapLoadError("Failed to load map. Check your API key.");
                  toast.error("Failed to load map. Check your API key.");
                }}
              >
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={mapCenter}
                  zoom={7}
                  options={{
                    styles: MAP_STYLES.dark,
                  }}
                  onLoad={onMapLoad}
                  className="google-map rounded-lg shadow-md"
                >
                  {routeCoords.length > 0 && (
                    <Polyline
                      path={routeCoords}
                      options={{
                        strokeColor: "#FF0000",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                      }}
                    />
                  )}
                  {routeCoords.length > 0 && (
                    <Marker
                      position={routeCoords[0]}
                      label={{
                        text: "Start",
                        color: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                        scaledSize: new window.google.maps.Size(32, 32),
                      }}
                      onClick={() => setSelectedMarker({ position: routeCoords[0], label: "Start" })}
                    />
                  )}
                  {routeCoords.length > 0 && (
                    <Marker
                      position={routeCoords[routeCoords.length - 1]}
                      label={{
                        text: "End",
                        color: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        scaledSize: new window.google.maps.Size(32, 32),
                      }}
                      onClick={() => setSelectedMarker({ position: routeCoords[routeCoords.length - 1], label: "End" })}
                    />
                  )}
                  {pitStops.map((stop, idx) => (
                    stop.coords && (
                      <Marker
                        key={idx}
                        position={stop.coords}
                        label={{
                          text: `${stop.name.split(" - ")[0]} (${stop.time})`,
                          color: stop.type === "scenic" ? "#FF4500" : stop.type === "itinerary" ? "#FFD700" : "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        icon={getMarkerIcon(stop.type)}
                        onClick={() => setSelectedMarker({ position: stop.coords, label: `${stop.name} (${stop.time})` })}
                      />
                    )
                  ))}
                  {selectedMarker && (
                    <InfoWindow
                      position={selectedMarker.position}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="text-sm text-gray-800">
                        {selectedMarker.label}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
              <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Route Info</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Distance: {totalDistance} km
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Duration: {totalDuration}
                </p>
                <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Legend</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">Start</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">End</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">Fuel/Lunch Stop</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">Scenic Stop</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">Itinerary Stop</span>
                </div>
              </div>
              {mapLoadError && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {mapLoadError}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded-lg text-gray-800 dark:text-gray-100"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={startNewChat}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              New Chat
            </Button>
            <Button
              onClick={saveAsPDF}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Save as PDF
            </Button>
          </div>
        </div>
        <DialogClose asChild>
          <Button
            variant="outline"
            className="mt-4 w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Close Chat
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export default Joey;