import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogInContext } from "@/Context/LogInContext/Login";
import { getPlaceDetails, PHOTO_URL } from "@/Service/GlobalApi";

function HotelCards({ hotel }) {
  const isMobile = useMediaQuery({ query: "(max-width: 445px)" });
  const isSmall = useMediaQuery({ query: "(max-width: 640px)" });

  const { trip } = useContext(LogInContext);
  const city = trip?.tripData?.location;

  const [placeDets, setPlaceDets] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("/logo.png");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");

  const getPlaceInfo = async () => {
    try {
      const data = {
        textQuery: `${hotel.name}, ${city}`,
      };
      const res = await getPlaceDetails(data);
      const placeData = res.data.places[0];

      if (placeData) {
        setPlaceDets(placeData);
        setAddress(placeData.formattedAddress || hotel.address || "Address not available");
        setLocation(placeData.googleMapsUri || `https://www.google.com/maps/search/${hotel.name},${city}`);

        if (placeData.photos && placeData.photos.length > 0) {
          const photoName = placeData.photos[0].name;
          const url = PHOTO_URL.replace("{replace}", photoName);
          setPhotoUrl(url);
        }
      }
    } catch (err) {
      console.error("Error fetching hotel details:", err);
      setAddress(hotel.address || "Address not available");
      setLocation(`https://www.google.com/maps/search/${hotel.name},${city}`);
      setPhotoUrl("/logo.png");
    }
  };

  useEffect(() => {
    if (trip && hotel?.name && city) {
      getPlaceInfo();
    }
  }, [trip, hotel, city]);

  return (
    <Link
      className="w-full"
      target="_blank"
      to={location}
    >
      <Card className="border-foreground/20 p-1 h-full flex flex-col gap-3 hover:scale-105 duration-300">
        <div className="img h-full rounded-lg">
          <img
            src={photoUrl}
            className="h-80 w-full object-cover"
            alt={hotel.name}
            onError={(e) => (e.target.src = "/logo.png")}
          />
        </div>
        <div className="text-content w-full flex items-center gap-3 justify-between flex-col h-full">
          <CardHeader className="w-full">
            <CardTitle className="opacity-90 w-full text-center text-xl font-black text-primary/80 md:text-3xl">
              {hotel.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 tracking-wide opacity-90 w-full text-center text-sm text-primary/80 md:text-md">
              {hotel.description || "No description available"}
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <div className="hotel-details">
              <span className="font-medium text-primary/80 opacity-90 text-sm md:text-base tracking-wide">
                ⭐ Rating: {hotel.rating || "Not specified"}
              </span>
              <br />
              <span className="font-medium text-primary/80 opacity-90 text-sm md:text-base tracking-wide">
                💵 Price: {hotel.price || "Not specified"}
              </span>
              <br />
              <span className="font-medium text-primary/80 opacity-90 text-sm md:text-base tracking-wide line-clamp-1">
                📍 Location: {address}
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

export default HotelCards;