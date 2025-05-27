import { LogInContext } from "@/Context/LogInContext/Login";
import { db } from "@/Service/Firebase";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import AlltripsCard from "./AlltripsCard";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react"; // Import delete icon from lucide-react
import toast from "react-hot-toast";

function Alltrips() {
  const { user } = useContext(LogInContext);
  const [allTrips, setAllTrips] = useState([]);

  const getAllTrips = async () => {
    const Query = query(
      collection(db, "Trips"),
      where("userEmail", "==", user?.email)
    );
    const querySnapshot = await getDocs(Query);
    const trips = [];
    querySnapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() }); // Include doc.id for deletion
    });

    const reversedTrips = trips.reverse();
    setAllTrips(reversedTrips);
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;

    try {
      const tripDoc = doc(db, "Trips", tripId);
      await deleteDoc(tripDoc);
      toast.success("Trip deleted successfully");
      await getAllTrips(); // Refresh the trip list
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.error("Failed to delete trip");
    }
  };

  useEffect(() => {
    if (user) {
      getAllTrips();
    }
  }, [user]);

  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-5xl font-bold text-center my-5 md:my-10 bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
        All Trips
      </h1>
      <div className="flex gap-3 flex-wrap justify-evenly items-center">
        {allTrips?.length > 0
          ? allTrips?.map((trip, idx) => (
              <div key={idx} className="w-full md:w-[48%] relative group">
                <Link to={"/my-trips/" + trip.tripId} className="block">
                  <AlltripsCard trip={trip} />
                </Link>
                <button
                  onClick={() => handleDeleteTrip(trip.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  aria-label="Delete trip"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          : [1, 2, 3, 4].map((item, index) => (
              <div
                key={index}
                className="w-[48%] h-52 rounded-md border bg-card-foreground/50 animate-pulse"
              ></div>
            ))}
      </div>
    </div>
  );
}

export default Alltrips;