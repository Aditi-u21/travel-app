/*
import { Input } from "@/components/ui/input";
import React, { useContext, useEffect, useState } from "react";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import {
  PROMPT,
  SelectBudgetOptions,
  SelectNoOfPersons,
} from "../../constants/Options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { chatSession } from "@/Service/AiModel";
import { LogInContext } from "@/Context/LogInContext/Login";
import { db } from "@/Service/Firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function CreateTrip({ createTripPageRef }) {
  const [place, setPlace] = useState("");
  const [formData, setFormData] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { user, loginWithPopup, isAuthenticated } = useContext(LogInContext);

  const handleInputChange = (name, value) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Calculate number of days from start and end dates
  const handleDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end - start;
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      handleInputChange("noOfDays", days > 0 ? days : 0);
    } else {
      handleInputChange("noOfDays", 0);
    }
  };

  const SignIn = async () => {
    loginWithPopup();
  };

  const SaveUser = async () => {
    const User = JSON.parse(localStorage.getItem("User"));
    const id = User?.email;
    await setDoc(doc(db, "Users", id), {
      userName: User?.name,
      userEmail: User?.email,
      userPicture: User?.picture,
      userNickname: User?.nickname,
    });
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem("User", JSON.stringify(user));
      SaveUser();
    }
  }, [user]);

  const SaveTrip = async (TripData) => {
    const User = JSON.parse(localStorage.getItem("User"));
    const id = Date.now().toString();
    setIsLoading(true);
    await setDoc(doc(db, "Trips", id), {
      tripId: id,
      userSelection: formData,
      tripData: TripData,
      userName: User?.name,
      userEmail: User?.email,
    });
    setIsLoading(false);
    localStorage.setItem("Trip", JSON.stringify(TripData));
    navigate("/my-trips/" + id);
  };

  const generateTrip = async () => {
    if (!isAuthenticated) {
      toast("Sign In to continue", { icon: "⚠️" });
      return setIsDialogOpen(true);
    }
    if (
      !formData?.noOfDays ||
      !formData?.location ||
      !formData?.People ||
      !formData?.Budget ||
      !formData?.startDate ||
      !formData?.endDate
    ) {
      return toast.error("Please fill out every field or select every option.");
    }
    if (formData?.noOfDays < 1) {
      return toast.error("Invalid number of Days");
    }
    // Validate custom budget
    if (!isNaN(formData?.Budget)) {
      const budget = parseFloat(formData?.Budget);
      if (budget <= 0) {
        return toast.error("Budget must be greater than 0");
      }
    }
    // Validate custom people count
    if (!isNaN(formData?.People)) {
      const people = parseInt(formData?.People);
      if (people <= 0) {
        return toast.error("Number of people must be greater than 0");
      }
    }

    const FINAL_PROMPT = PROMPT.replace(/{location}/g, formData?.location)
      .replace(/{noOfDays}/g, formData?.noOfDays)
      .replace(/{People}/g, formData?.People)
      .replace(/{Budget}/g, formData?.Budget);

    try {
      const toastId = toast.loading("Generating Trip", { icon: "✈️" });
      setIsLoading(true);
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const trip = JSON.parse(result.response.text());
      setIsLoading(false);
      SaveTrip(trip);
      toast.dismiss(toastId);
      toast.success("Trip Generated Successfully");
    } catch (error) {
      setIsLoading(false);
      toast.dismiss();
      toast.error("Failed to generate trip. Please try again.");
      console.error(error);
    }
  };

  const isCustomBudget = formData?.Budget && !SelectBudgetOptions.some(opt => opt.title === formData?.Budget);
  const isCustomPeople = formData?.People && !SelectNoOfPersons.some(opt => opt.no === formData?.People);

  return (
    <div ref={createTripPageRef} className="mt-10 text-center container">
      <div className="text section">
        <h2 className="text-3xl md:text-5xl font-bold mb-5 flex items-center justify-center">
          <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
            Share Your Travel Preferences
          </span>
        </h2>
        <p className="opacity-90 mx-auto text-center text-md md:text-xl font-medium tracking-tight text-primary/80">
          Embark on your dream adventure with just a few simple details. <br />
          <span className="bg-gradient-to-b text-2xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
            Aurora Go
          </span>{" "}
          <br /> will curate a personalized itinerary, crafted to match your
          unique preferences!
        </p>
      </div>

      <div className="form mt-14 flex flex-col gap-16 md:gap-20">
        <div className="place section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Where do you want to Explore?
            </span>{" "}
            🏖️
          </h2>
          <ReactGoogleAutocomplete
            className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
            apiKey={import.meta.env.VITE_GOOGLE_MAP_API_KEY}
            autoFocus
            onPlaceSelected={(place) => {
              setPlace(place);
              handleInputChange("location", place.formatted_address);
            }}
            placeholder="Enter a City"
          />
        </div>

        <div className="date-range section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Travel Dates
            </span>{" "}
            📅
          </h2>
          <div className="flex gap-4 justify-center">
            <Input
              className="text-center h-12 max-w-xs"
              type="date"
              value={formData.startDate || ""}
              onChange={(e) => {
                handleInputChange("startDate", e.target.value);
                handleDateChange(e.target.value, formData.endDate);
              }}
              required
            />
            <Input
              className="text-center h-12 max-w-xs"
              type="date"
              value={formData.endDate || ""}
              onChange={(e) => {
                handleInputChange("endDate", e.target.value);
                handleDateChange(formData.startDate, e.target.value);
              }}
              required
            />
          </div>
        </div>

        <div className="day section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              How long is your Trip?
            </span>{" "}
            🕜
          </h2>
          <Input
            className="text-center h-12 max-w-xs mx-auto"
            placeholder="Calculated from dates"
            type="number"
            min="1"
            name="noOfDays"
            value={formData.noOfDays || ""}
            readOnly
          />
        </div>

        <div className="budget section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              What is your Budget? (Total for Group)
            </span>{" "}
            💳
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              ...SelectBudgetOptions,
              {
                id: 4,
                icon: "✍️",
                title: "Custom",
                desc: "Set Your Own Budget",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.Budget === item.title || (item.title === "Custom" && isCustomBudget)
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
                onClick={() => {
                  if (item.title !== "Custom") {
                    handleInputChange("Budget", item.title);
                  } else {
                    handleInputChange("Budget", "");
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.title !== "Custom") {
                      handleInputChange("Budget", item.title);
                    } else {
                      handleInputChange("Budget", "");
                    }
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={
                      formData?.Budget === item.title || (item.title === "Custom" && isCustomBudget)
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {item.desc}
                </p>
                {item.title === "Custom" && (
                  <Input
                    className="mt-4 h-10 text-center w-full"
                    placeholder="Enter Amount"
                    type="number"
                    min="0"
                    value={isCustomBudget ? formData?.Budget : ""}
                    onChange={(e) => handleInputChange("Budget", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus={formData?.Budget === "" || isCustomBudget}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="people section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Who are you traveling with?
            </span>{" "}
            🚗
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              ...SelectNoOfPersons,
              {
                id: 5,
                icon: "✍️",
                title: "Custom",
                desc: "Choose Your Group Size",
                no: "Custom",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.People === item.no || (item.title === "Custom" && isCustomPeople)
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
                onClick={() => {
                  if (item.title !== "Custom") {
                    handleInputChange("People", item.no);
                  } else {
                    handleInputChange("People", "");
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.title !== "Custom") {
                      handleInputChange("People", item.no);
                    } else {
                      handleInputChange("People", "");
                    }
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={
                      formData?.People === item.no || (item.title === "Custom" && isCustomPeople)
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {item.desc}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{item.no}</p>
                {item.title === "Custom" && (
                  <Input
                    className="mt-4 h-10 text-center w-full"
                    placeholder="Enter Number"
                    type="number"
                    min="1"
                    value={isCustomPeople ? formData?.People : ""}
                    onChange={(e) => handleInputChange("People", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus={formData?.People === "" || isCustomPeople}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="create-trip-btn w-full flex items-center justify-center h-32">
        <Button
          disabled={isLoading}
          onClick={generateTrip}
          className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin" />
          ) : (
            "Let's Go 🌏"
          )}
        </Button>
      </div>

      <Dialog
        className="m-4"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              {user ? "Thank you for LogIn" : "Sign In to Continue"}
            </DialogTitle>
            <DialogDescription>
              <span className="flex gap-2">
                <span className="text-center w-full opacity-90 mx-auto tracking-tight text-primary/80">
                  {user
                    ? "Logged In Securely to Aurora Go with Google Authentication"
                    : "Sign In to Aurora Go with Google Authentication Securely"}
                </span>
              </span>
              {user ? (
                ""
              ) : (
                <Button
                  onClick={SignIn}
                  className="w-full mt-5 flex gap-2 items-center justify-center"
                >
                  Sign In with <FcGoogle className="h-5 w-5" />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="w-full">
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateTrip;
*/


/*
import { Input } from "@/components/ui/input";
import React, { useContext, useEffect, useState } from "react";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import {
  PROMPT,
  SelectBudgetOptions,
  SelectNoOfPersons,
} from "../../constants/Options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { chatSession } from "@/Service/AiModel";
import { LogInContext } from "@/Context/LogInContext/Login";
import { db } from "@/Service/Firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function CreateTrip({ createTripPageRef }) {
  const [place, setPlace] = useState("");
  const [formData, setFormData] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { user, loginWithPopup, isAuthenticated } = useContext(LogInContext);

  const PreferenceOptions = [
    "Adventure",
    "Relaxation",
    "Historic",
    "Culture",
    "Nature",
    "Food",
    "Shopping",
    "Nightlife",
  ];

  const handleInputChange = (name, value) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Calculate number of days from start and end dates
  const handleDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end - start;
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      handleInputChange("noOfDays", days > 0 ? days : 0);
    } else {
      handleInputChange("noOfDays", 0);
    }
  };

  // Toggle preference on click
  const togglePreference = (option) => {
    const currentPrefs = formData.preferences || [];
    if (currentPrefs.includes(option)) {
      handleInputChange("preferences", currentPrefs.filter((p) => p !== option));
    } else {
      handleInputChange("preferences", [...currentPrefs, option]);
    }
  };

  // Check if preference selected
  const isPreferenceSelected = (option) => {
    return formData.preferences && formData.preferences.includes(option);
  };

  const SignIn = async () => {
    loginWithPopup();
  };

  const SaveUser = async () => {
    const User = JSON.parse(localStorage.getItem("User"));
    const id = User?.email;
    await setDoc(doc(db, "Users", id), {
      userName: User?.name,
      userEmail: User?.email,
      userPicture: User?.picture,
      userNickname: User?.nickname,
    });
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem("User", JSON.stringify(user));
      SaveUser();
    }
  }, [user]);

  const SaveTrip = async (TripData) => {
    const User = JSON.parse(localStorage.getItem("User"));
    const id = Date.now().toString();
    setIsLoading(true);
    await setDoc(doc(db, "Trips", id), {
      tripId: id,
      userSelection: formData,
      tripData: TripData,
      userName: User?.name,
      userEmail: User?.email,
    });
    setIsLoading(false);
    localStorage.setItem("Trip", JSON.stringify(TripData));
    navigate("/my-trips/" + id);
  };

  const generateTrip = async () => {
    if (!isAuthenticated) {
      toast("Sign In to continue", { icon: "⚠️" });
      return setIsDialogOpen(true);
    }
    if (
      !formData?.noOfDays ||
      !formData?.location ||
      !formData?.People ||
      !formData?.Budget ||
      !formData?.startDate ||
      !formData?.endDate
    ) {
      return toast.error("Please fill out every field or select every option.");
    }
    if (formData?.noOfDays < 1) {
      return toast.error("Invalid number of Days");
    }
    // Validate custom budget
    if (!isNaN(formData?.Budget)) {
      const budget = parseFloat(formData?.Budget);
      if (budget <= 0) {
        return toast.error("Budget must be greater than 0");
      }
    }
    // Validate custom people count
    if (!isNaN(formData?.People)) {
      const people = parseInt(formData?.People);
      if (people <= 0) {
        return toast.error("Number of people must be greater than 0");
      }
    }

    // Prepare preferences string for prompt: comma separated, or default to "General" if none selected
    const preferencesStr = formData.preferences && formData.preferences.length > 0 ? formData.preferences.join(", ") : "General";

    const FINAL_PROMPT = PROMPT.replace(/{location}/g, formData?.location)
      .replace(/{noOfDays}/g, formData?.noOfDays)
      .replace(/{People}/g, formData?.People)
      .replace(/{Budget}/g, formData?.Budget)
      .replace(/{preferences}/g, preferencesStr);

    try {
      const toastId = toast.loading("Generating Trip", { icon: "✈️" });
      setIsLoading(true);
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const trip = JSON.parse(result.response.text());
      setIsLoading(false);
      SaveTrip(trip);
      toast.dismiss(toastId);
      toast.success("Trip Generated Successfully");
    } catch (error) {
      setIsLoading(false);
      toast.dismiss();
      toast.error("Failed to generate trip. Please try again.");
      console.error(error);
    }
  };

  const isCustomBudget = formData?.Budget && !SelectBudgetOptions.some(opt => opt.title === formData?.Budget);
  const isCustomPeople = formData?.People && !SelectNoOfPersons.some(opt => opt.no === formData?.People);

  return (
    <div ref={createTripPageRef} className="mt-10 text-center container">
      <div className="text section">
        <h2 className="text-3xl md:text-5xl font-bold mb-5 flex items-center justify-center">
          <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
            Share Your Travel Preferences
          </span>
        </h2>
        <p className="opacity-90 mx-auto text-center text-md md:text-xl font-medium tracking-tight text-primary/80">
          Embark on your dream adventure with just a few simple details. <br />
          <span className="bg-gradient-to-b text-2xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
            Aurora Go
          </span>{" "}
          <br /> will curate a personalized itinerary, crafted to match your
          unique preferences!
        </p>
      </div>

      <div className="form mt-14 flex flex-col gap-16 md:gap-20">
        <div className="place section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Where do you want to Explore?
            </span>{" "}
            🏖️
          </h2>
          <ReactGoogleAutocomplete
            className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
            apiKey={import.meta.env.VITE_GOOGLE_MAP_API_KEY}
            autoFocus
            onPlaceSelected={(place) => {
              setPlace(place);
              handleInputChange("location", place.formatted_address);
            }}
            placeholder="Enter a City"
          />
        </div>

        <div className="date-range section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Travel Dates
            </span>{" "}
            📅
          </h2>
          <div className="flex gap-4 justify-center">
            <Input
              className="text-center h-12 max-w-xs"
              type="date"
              value={formData.startDate || ""}
              onChange={(e) => {
                handleInputChange("startDate", e.target.value);
                handleDateChange(e.target.value, formData.endDate);
              }}
              required
            />
            <Input
              className="text-center h-12 max-w-xs"
              type="date"
              value={formData.endDate || ""}
              onChange={(e) => {
                handleInputChange("endDate", e.target.value);
                handleDateChange(formData.startDate, e.target.value);
              }}
              required
            />
          </div>
        </div>

        <div className="day section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              How long is your Trip?
            </span>{" "}
            🕜
          </h2>
          <Input
            className="text-center h-12 max-w-xs mx-auto"
            placeholder="Calculated from dates"
            type="number"
            min="1"
            name="noOfDays"
            value={formData.noOfDays || ""}
            readOnly
          />
        </div>

        <div className="budget section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              What is your Budget? (Total for Group)
            </span>{" "}
            💳
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              ...SelectBudgetOptions,
              {
                id: 4,
                icon: "✍️",
                title: "Custom",
                desc: "Set Your Own Budget",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.Budget === item.title || (item.title === "Custom" && isCustomBudget)
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
                onClick={() => {
                  if (item.title !== "Custom") {
                    handleInputChange("Budget", item.title);
                  } else {
                    handleInputChange("Budget", "");
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.title !== "Custom") {
                      handleInputChange("Budget", item.title);
                    } else {
                      handleInputChange("Budget", "");
                    }
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={
                      formData?.Budget === item.title || (item.title === "Custom" && isCustomBudget)
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {item.desc}
                </p>
                {item.title === "Custom" && (
                  <Input
                    className="mt-4 h-10 text-center w-full"
                    placeholder="Enter Amount"
                    type="number"
                    min="0"
                    value={isCustomBudget ? formData?.Budget : ""}
                    onChange={(e) => handleInputChange("Budget", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus={formData?.Budget === "" || isCustomBudget}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="people section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Who are you traveling with?
            </span>{" "}
            🚗
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              ...SelectNoOfPersons,
              {
                id: 5,
                icon: "✍️",
                title: "Custom",
                desc: "Choose Your Group Size",
                no: "Custom",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.People === item.no || (item.title === "Custom" && isCustomPeople)
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
                onClick={() => {
                  if (item.title !== "Custom") {
                    handleInputChange("People", item.no);
                  } else {
                    handleInputChange("People", "");
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.title !== "Custom") {
                      handleInputChange("People", item.no);
                    } else {
                      handleInputChange("People", "");
                    }
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={
                      formData?.People === item.no || (item.title === "Custom" && isCustomPeople)
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {item.desc}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{item.no}</p>
                {item.title === "Custom" && (
                  <Input
                    className="mt-4 h-10 text-center w-full"
                    placeholder="Enter Number"
                    type="number"
                    min="1"
                    value={isCustomPeople ? formData?.People : ""}
                    onChange={(e) => handleInputChange("People", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus={formData?.People === "" || isCustomPeople}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="preferences section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              What do you Prefer? (Optional)
            </span>{" "}
            🌟
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {PreferenceOptions.map((option) => {
              const selected = isPreferenceSelected(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => togglePreference(option)}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 font-medium
                    ${
                      selected
                        ? "bg-pink-200 text-pink-800 border-pink-300 shadow-md"
                        : "bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-400 hover:text-purple-800"
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="create-trip-btn w-full flex items-center justify-center h-32">
        <Button
          disabled={isLoading}
          onClick={generateTrip}
          className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin" />
          ) : (
            "Let's Go 🌏"
          )}
        </Button>
      </div>

      <Dialog
        className="m-4"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              {user ? "Thank you for LogIn" : "Sign In to Continue"}
            </DialogTitle>
            <DialogDescription>
              <span className="flex gap-2">
                <span className="text-center w-full opacity-90 mx-auto tracking-tight text-primary/80">
                  {user
                    ? "Logged In Securely to Aurora Go with Google Authentication"
                    : "Sign In to Aurora Go with Google Authentication Securely"}
                </span>
              </span>
              {user ? (
                ""
              ) : (
                <Button
                  onClick={SignIn}
                  className="w-full mt-5 flex gap-2 items-center justify-center"
                >
                  Sign In with <FcGoogle className="h-5 w-5" />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="w-full">
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateTrip;

*/

import { Input } from "@/components/ui/input";
import React, { useContext, useEffect, useState } from "react";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import {
  PROMPT,
  SelectBudgetOptions,
  SelectNoOfPersons,
} from "../../constants/Options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { chatSession } from "@/Service/AiModel";
import { LogInContext } from "@/Context/LogInContext/Login";
import { db } from "@/Service/Firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function CreateTrip({ createTripPageRef }) {
  const [place, setPlace] = useState("");
  const [formData, setFormData] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { user, loginWithPopup, isAuthenticated } = useContext(LogInContext);

  const PreferenceOptions = [
    "Adventure",
    "Relaxation",
    "Historic",
    "Culture",
    "Nature",
    "Food",
    "Shopping",
    "Nightlife",
  ];

  const PaceOptions = [
    { id: 1, title: "Relaxed", desc: "Fewer activities, more downtime", maxActivitiesPerDay: 2 },
    { id: 2, title: "Moderate", desc: "Balanced exploration and rest", maxActivitiesPerDay: 4 },
    { id: 3, title: "Packed", desc: "Maximize activities each day", maxActivitiesPerDay: 6 },
  ];

  const handleInputChange = (name, value) => {
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Calculate number of days from start and end dates
  const handleDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end - start;
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      handleInputChange("noOfDays", days > 0 ? days : 0);
    } else {
      handleInputChange("noOfDays", 0);
    }
  };

  // Toggle preference on click
  const togglePreference = (option) => {
    const currentPrefs = formData.preferences || [];
    if (currentPrefs.includes(option)) {
      handleInputChange("preferences", currentPrefs.filter((p) => p !== option));
    } else {
      handleInputChange("preferences", [...currentPrefs, option]);
    }
  };

  // Check if preference selected
  const isPreferenceSelected = (option) => {
    return formData.preferences && formData.preferences.includes(option);
  };

  const SignIn = async () => {
    loginWithPopup();
  };

  const SaveUser = async () => {
    const User = JSON.parse(localStorage.getItem("User"));
    const id = User?.email;
    await setDoc(doc(db, "Users", id), {
      userName: User?.name,
      userEmail: User?.email,
      userPicture: User?.picture,
      userNickname: User?.nickname,
    });
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem("User", JSON.stringify(user));
      SaveUser();
    }
  }, [user]);

  // Load user pace preference weights from Firebase
  const loadPacePreferences = async () => {
    if (!user) return { Relaxed: 1, Moderate: 1, Packed: 1 };
    const userDoc = doc(db, "UserPreferences", user.email);
    const docSnap = await getDoc(userDoc);
    return docSnap.exists() ? docSnap.data() : { Relaxed: 1, Moderate: 1, Packed: 1 };
  };

  // Update pace preference weights in Firebase (Q-learning simulation)
  const updatePacePreferences = async (pace, reward) => {
    if (!user) return;
    const userDoc = doc(db, "UserPreferences", user.email);
    const currentPrefs = await loadPacePreferences();
    const learningRate = 0.1;
    const discountFactor = 0.9;
    const newQValue = currentPrefs[pace] + learningRate * (reward - currentPrefs[pace]);
    await setDoc(userDoc, {
      ...currentPrefs,
      [pace]: newQValue,
    });
  };

  // Optimize itinerary using nearest-neighbor (graph-based scheduling)
  const optimizeItinerary = (itinerary, maxActivitiesPerDay) => {
    const optimized = [];
    itinerary.forEach((day) => {
      const activities = day.activities || [];
      if (activities.length === 0) {
        optimized.push(day);
        return;
      }

      const sortedActivities = [activities[0]];
      const remaining = activities.slice(1);
      while (remaining.length > 0 && sortedActivities.length < maxActivitiesPerDay) {
        const lastActivity = sortedActivities[sortedActivities.length - 1];
        const lastCoords = lastActivity.coordinates || { lat: 0, lng: 0 };
        let nearestIdx = 0;
        let minDistance = Infinity;

        remaining.forEach((activity, idx) => {
          const coords = activity.coordinates || { lat: 0, lng: 0 };
          const distance = Math.sqrt(
            Math.pow(coords.lat - lastCoords.lat, 2) + Math.pow(coords.lng - lastCoords.lng, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestIdx = idx;
          }
        });

        sortedActivities.push(remaining.splice(nearestIdx, 1)[0]);
      }

      optimized.push({ ...day, activities: sortedActivities });
    });
    return optimized;
  };

  const SaveTrip = async (TripData) => {
    const User = JSON.parse(localStorage.getItem("User"));
    const id = Date.now().toString();
    setIsLoading(true);

    // Optimize itinerary based on pace
    const selectedPace = PaceOptions.find((opt) => opt.title === formData.pace) || PaceOptions[1]; // Default to Moderate
    const optimizedItinerary = optimizeItinerary(TripData.itinerary || [], selectedPace.maxActivitiesPerDay);

    await setDoc(doc(db, "Trips", id), {
      tripId: id,
      userSelection: formData,
      tripData: { ...TripData, itinerary: optimizedItinerary },
      userName: User?.name,
      userEmail: User?.email,
    });
    setIsLoading(false);
    localStorage.setItem("Trip", JSON.stringify({ ...TripData, itinerary: optimizedItinerary }));
    navigate("/my-trips/" + id);

    // Simulate Q-learning: Assign reward based on pace (e.g., user completes trip)
    await updatePacePreferences(formData.pace || "Moderate", 1); // Reward of 1 for trip generation
  };

  const generateTrip = async () => {
    if (!isAuthenticated) {
      toast("Sign In to continue", { icon: "⚠️" });
      return setIsDialogOpen(true);
    }
    if (
      !formData?.noOfDays ||
      !formData?.location ||
      !formData?.People ||
      !formData?.Budget ||
      !formData?.startDate ||
      !formData?.endDate ||
      !formData?.pace
    ) {
      return toast.error("Please fill out every field or select every option.");
    }
    if (formData?.noOfDays < 1) {
      return toast.error("Invalid number of Days");
    }
    // Validate custom budget
    if (!isNaN(formData?.Budget)) {
      const budget = parseFloat(formData?.Budget);
      if (budget <= 0) {
        return toast.error("Budget must be greater than 0");
      }
    }
    // Validate custom people count
    if (!isNaN(formData?.People)) {
      const people = parseInt(formData?.People);
      if (people <= 0) {
        return toast.error("Number of people must be greater than 0");
      }
    }

    // Load pace preferences for Q-learning
    const pacePrefs = await loadPacePreferences();
    const selectedPace = formData.pace || Object.keys(pacePrefs).reduce((a, b) => (pacePrefs[a] > pacePrefs[b] ? a : b), "Moderate");

    // Prepare preferences string for prompt: comma separated, or default to "General" if none selected
    const preferencesStr = formData.preferences && formData.preferences.length > 0 ? formData.preferences.join(", ") : "General";

    const FINAL_PROMPT = PROMPT.replace(/{location}/g, formData?.location)
      .replace(/{noOfDays}/g, formData?.noOfDays)
      .replace(/{People}/g, formData?.People)
      .replace(/{Budget}/g, formData?.Budget)
      .replace(/{preferences}/g, preferencesStr)
      .replace(/{pace}/g, selectedPace);

    try {
      const toastId = toast.loading("Generating Trip", { icon: "✈️" });
      setIsLoading(true);
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const trip = JSON.parse(result.response.text());
      setIsLoading(false);
      SaveTrip(trip);
      toast.dismiss(toastId);
      toast.success("Trip Generated Successfully");
    } catch (error) {
      setIsLoading(false);
      toast.dismiss();
      toast.error("Failed to generate trip. Please try again.");
      console.error(error);
    }
  };

  const isCustomBudget = formData?.Budget && !SelectBudgetOptions.some((opt) => opt.title === formData?.Budget);
  const isCustomPeople = formData?.People && !SelectNoOfPersons.some((opt) => opt.no === formData?.People);

  return (
    <div ref={createTripPageRef} className="mt-10 text-center container">
      <div className="text section">
        <h2 className="text-3xl md:text-5xl font-bold mb-5 flex items-center justify-center">
          <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
            Share Your Travel Preferences
          </span>
        </h2>
        <p className="opacity-90 mx-auto text-center text-md md:text-xl font-medium tracking-tight text-primary/80">
          Embark on your dream adventure with just a few simple details. <br />
          <span className="bg-gradient-to-b text-2xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
            Aurora Go
          </span>{" "}
          <br /> will curate a personalized itinerary, crafted to match your unique preferences!
        </p>
      </div>

      <div className="form mt-14 flex flex-col gap-16 md:gap-20">
        <div className="place section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Where do you want to Explore?
            </span>{" "}
            🏖️
          </h2>
          <ReactGoogleAutocomplete
            className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
            apiKey={import.meta.env.VITE_GOOGLE_MAP_API_KEY}
            autoFocus
            onPlaceSelected={(place) => {
              setPlace(place);
              handleInputChange("location", place.formatted_address);
            }}
            placeholder="Enter a City"
          />
        </div>

        <div className="date-range section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Travel Dates
            </span>{" "}
            📅
          </h2>
          <div className="flex gap-4 justify-center">
            <Input
              className="text-center h-12 max-w-xs"
              type="date"
              value={formData.startDate || ""}
              onChange={(e) => {
                handleInputChange("startDate", e.target.value);
                handleDateChange(e.target.value, formData.endDate);
              }}
              required
            />
            <Input
              className="text-center h-12 max-w-xs"
              type="date"
              value={formData.endDate || ""}
              onChange={(e) => {
                handleInputChange("endDate", e.target.value);
                handleDateChange(formData.startDate, e.target.value);
              }}
              required
            />
          </div>
        </div>

        <div className="day section">
          <h2 className="font-semibold text-lg md:text-xl mb-3">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              How long is your Trip?
            </span>{" "}
            🕜
          </h2>
          <Input
            className="text-center h-12 max-w-xs mx-auto"
            placeholder="Calculated from dates"
            type="number"
            min="1"
            name="noOfDays"
            value={formData.noOfDays || ""}
            readOnly
          />
        </div>

        <div className="budget section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              What is your Budget? (Total for Group)
            </span>{" "}
            💳
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              ...SelectBudgetOptions,
              {
                id: 4,
                icon: "✍️",
                title: "Custom",
                desc: "Set Your Own Budget",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.Budget === item.title || (item.title === "Custom" && isCustomBudget)
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
                onClick={() => {
                  if (item.title !== "Custom") {
                    handleInputChange("Budget", item.title);
                  } else {
                    handleInputChange("Budget", "");
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.title !== "Custom") {
                      handleInputChange("Budget", item.title);
                    } else {
                      handleInputChange("Budget", "");
                    }
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={
                      formData?.Budget === item.title || (item.title === "Custom" && isCustomBudget)
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
                {item.title === "Custom" && (
                  <Input
                    className="mt-4 h-10 text-center w-full"
                    placeholder="Enter Amount"
                    type="number"
                    min="0"
                    value={isCustomBudget ? formData?.Budget : ""}
                    onChange={(e) => handleInputChange("Budget", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus={formData?.Budget === "" || isCustomBudget}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="people section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              Who are you traveling with?
            </span>{" "}
            🚗
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              ...SelectNoOfPersons,
              {
                id: 5,
                icon: "✍️",
                title: "Custom",
                desc: "Choose Your Group Size",
                no: "Custom",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.People === item.no || (item.title === "Custom" && isCustomPeople)
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
                onClick={() => {
                  if (item.title !== "Custom") {
                    handleInputChange("People", item.no);
                  } else {
                    handleInputChange("People", "");
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.title !== "Custom") {
                      handleInputChange("People", item.no);
                    } else {
                      handleInputChange("People", "");
                    }
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={
                      formData?.People === item.no || (item.title === "Custom" && isCustomPeople)
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.no}</p>
                {item.title === "Custom" && (
                  <Input
                    className="mt-4 h-10 text-center w-full"
                    placeholder="Enter Number"
                    type="number"
                    min="1"
                    value={isCustomPeople ? formData?.People : ""}
                    onChange={(e) => handleInputChange("People", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus={formData?.People === "" || isCustomPeople}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pace section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              How packed is your schedule?
            </span>{" "}
            ⏰
          </h2>
          <div className="options grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PaceOptions.map((item) => (
              <div
                key={item.id}
                className={`card option cursor-pointer transition-all p-6 flex flex-col items-center justify-center border rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData?.pace === item.title ? "border-primary shadow-md" : "border-border"
                }`}
                onClick={() => handleInputChange("pace", item.title)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleInputChange("pace", item.title);
                  }
                }}
              >
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span
                    className={
                      formData?.pace === item.title
                        ? "bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {item.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="preferences section">
          <h2 className="font-semibold text-lg md:text-xl mb-5">
            <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              What do you Prefer? (Optional)
            </span>{" "}
            🌟
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {PreferenceOptions.map((option) => {
              const selected = isPreferenceSelected(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => togglePreference(option)}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 font-medium
                    ${
                      selected
                        ? "bg-pink-200 text-pink-800 border-pink-300 shadow-md"
                        : "bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-400 hover:text-purple-800"
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="create-trip-btn w-full flex items-center justify-center h-32">
        <Button
          disabled={isLoading}
          onClick={generateTrip}
          className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin" />
          ) : (
            "Let's Go 🌏"
          )}
        </Button>
      </div>

      <Dialog className="m-4" open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
              {user ? "Thank you for LogIn" : "Sign In to Continue"}
            </DialogTitle>
            <DialogDescription>
              <span className="flex gap-2">
                <span className="text-center w-full opacity-90 mx-auto tracking-tight text-primary/80">
                  {user
                    ? "Logged In Securely to Aurora Go with Google Authentication"
                    : "Sign In to Aurora Go with Google Authentication Securely"}
                </span>
              </span>
              {user ? (
                ""
              ) : (
                <Button
                  onClick={SignIn}
                  className="w-full mt-5 flex gap-2 items-center justify-center"
                >
                  Sign In with <FcGoogle className="h-5 w-5" />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="w-full">
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateTrip;



