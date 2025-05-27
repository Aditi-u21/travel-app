import React, { useContext } from "react";
import { useMediaQuery } from "react-responsive";
import { LogInContext } from "@/Context/LogInContext/Login";
import HotelCards from "../Cards/HotelCards";
import { useRefContext } from "@/Context/RefContext/RefContext";

function Hotelcard() {
  const isMobile = useMediaQuery({ query: "(max-width: 445px)" });
  const isSmall = useMediaQuery({ query: "(max-width: 640px)" });

  const { trip } = useContext(LogInContext);
  const city = trip?.tripData?.location;
  const hotels = trip?.tripData?.hotels || [];

  const { holetsRef } = useRefContext();

  return (
    <div ref={holetsRef} className="flex flex-col md:flex-row flex-wrap gap-5">
      {hotels.length > 0 ? (
        hotels.map((hotel, idx) => (
          <div key={idx} className="md:w-[48%]">
            <HotelCards className="hotel-card" hotel={hotel} />
          </div>
        ))
      ) : (
        <p className="text-center text-primary/80">No hotels available.</p>
      )}
    </div>
  );
}

export default Hotelcard;