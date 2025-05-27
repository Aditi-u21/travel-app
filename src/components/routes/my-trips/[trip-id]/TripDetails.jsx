import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/Service/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { FaStar } from "react-icons/fa";

function TripDetails() {
  const { tripId } = useParams(); // Use tripId to match :tripId in route
  const [tripData, setTripData] = useState(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const tripDoc = await getDoc(doc(db, "Trips", tripId));
        if (tripDoc.exists()) {
          setTripData(tripDoc.data());
          setIsFeedbackDialogOpen(true);
        } else {
          toast.error("Trip not found");
          console.error("Trip not found for ID:", tripId);
        }
      } catch (error) {
        toast.error("Failed to load trip");
        console.error("FetchTrip error:", error);
      }
    };
    fetchTrip();
  }, [tripId]);

  const applyRL = (itinerary, feedback, rating) => {
    try {
      let adjustedItinerary = itinerary;
      if (feedback.includes("too busy")) {
        const reduction = rating <= 2 ? 2 : 1;
        adjustedItinerary = itinerary.map((day) => ({
          ...day,
          plan: day.plan.slice(0, Math.max(1, day.plan.length - reduction)),
        }));
      } else if (feedback.includes("too slow")) {
        const additions = rating <= 2 ? 2 : 1;
        adjustedItinerary = itinerary.map((day) => ({
          ...day,
          plan: [
            ...day.plan,
            ...Array(additions)
              .fill()
              .map(() => ({ time: "TBD", activity: "Add extra activity" })),
          ],
        }));
      }
      if (
        rating <= 2 &&
        !feedback.includes("too busy") &&
        !feedback.includes("too slow")
      ) {
        adjustedItinerary = itinerary.map((day) => ({
          ...day,
          plan: day.plan.slice(0, Math.max(1, day.plan.length - 1)),
        }));
      }
      return adjustedItinerary;
    } catch (error) {
      console.error("ApplyRL error:", error);
      return itinerary;
    }
  };

  const topologicalSort = (activities) => {
    try {
      const graph = {};
      const inDegree = {};
      const sorted = [];

      activities.forEach((act, idx) => {
        graph[idx] = act.dependencies || (idx > 0 ? [idx - 1] : []);
        inDegree[idx] = 0;
      });
      Object.values(graph).forEach((deps) =>
        deps.forEach((dep) => (inDegree[dep] = (inDegree[dep] || 0) + 1))
      );

      const queue = Object.keys(inDegree).filter((id) => inDegree[id] === 0);
      while (queue.length) {
        const curr = queue.shift();
        sorted.push(curr);
        graph[curr].forEach((next) => {
          inDegree[next]--;
          if (inDegree[next] === 0) queue.push(next);
        });
      }
      return sorted.map((idx) => activities[idx]);
    } catch (error) {
      console.error("Topological sort error:", error);
      return activities;
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!tripData) return;

    try {
      const optimizedItinerary = applyRL(
        tripData.tripData.itinerary,
        feedback,
        rating
      );
      const sortedItinerary = topologicalSort(
        optimizedItinerary.map((day, idx) => ({
          id: idx,
          dependencies: day.plan.length > 1 ? [idx - 1] : [],
          ...day,
        }))
      );

      await setDoc(
        doc(db, "Trips", tripId),
        {
          ...tripData,
          tripData: { ...tripData.tripData, itinerary: sortedItinerary },
          feedback: {
            text: feedback,
            rating: rating,
            timestamp: new Date().toISOString(),
          },
        },
        { merge: true }
      );

      setTripData((prev) => ({
        ...prev,
        tripData: { ...prev.tripData, itinerary: sortedItinerary },
        feedback: {
          text: feedback,
          rating: rating,
          timestamp: new Date().toISOString(),
        },
      }));
      toast.success("Itinerary updated based on feedback");
      setIsFeedbackDialogOpen(false);
      setFeedback("");
      setRating(0);
    } catch (error) {
      toast.error("Failed to update itinerary");
      console.error("Feedback submit error:", error);
    }
  };

  if (!tripData) return <div>Loading...</div>;

  return (
    <div className="container mt-10">
      <h1 className="text-3xl font-bold mb-5">
        Trip to {tripData.userSelection.location}
      </h1>
      <div className="trip-details">
        <h2 className="text-xl font-semibold">Itinerary</h2>
        {tripData.tripData.itinerary.map((day, index) => (
          <div key={index} className="day mb-4">
            <h3 className="font-bold">Day {index + 1}</h3>
            <ul>
              {day.plan.map((activity, idx) => (
                <li key={idx}>
                  {activity.time}: {activity.activity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {tripData.feedback && (
        <div className="feedback mt-4">
          <h3 className="text-lg font-semibold">Previous Feedback</h3>
          <p>
            Rating: {"★".repeat(tripData.feedback.rating) +
              "☆".repeat(5 - tripData.feedback.rating)}
          </p>
          <p>Comment: {tripData.feedback.text || "None"}</p>
          <p>Submitted: {new Date(tripData.feedback.timestamp).toLocaleString()}</p>
        </div>
      )}
      <Button className="mt-4" onClick={() => setIsFeedbackDialogOpen(true)}>
        Provide Feedback
      </Button>

      <Dialog
        className="m-4"
        open={isFeedbackDialogOpen}
        onOpenChange={setIsFeedbackDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Provide Feedback on Your Trip
            </DialogTitle>
            <DialogDescription>
              <span className="text-center w-full opacity-90 mx-auto tracking-tight text-primary/80">
                Please rate your trip and provide optional feedback to refine your
                itinerary (e.g., "too busy" or "too slow").
              </span>
              <div className="star-rating flex justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className="cursor-pointer text-2xl"
                    color={(hoverRating || rating) >= star ? "#ffc107" : "#e4e5e9"}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              <Input
                className="mt-4 h-10 text-center w-full"
                placeholder="e.g., 'too busy' or 'too slow'"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFeedback("");
                  setRating(0);
                  setIsFeedbackDialogOpen(false);
                }}
              >
                Skip
              </Button>
              <Button
                className="w-full"
                onClick={handleFeedbackSubmit}
                disabled={rating === 0}
              >
                Submit Feedback
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TripDetails;