import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { LogInContext } from "@/Context/LogInContext/Login";
import { useContext } from "react";
import emailjs from "@emailjs/browser";
import { jsPDF } from "jspdf";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/Service/Firebase";

// Initial checklist with value and weight for knapsack optimization
const initialChecklist = {
  Documents: [
    { name: "Passport, visa", value: 10, weight: 1 },
    { name: "Tickets for airline, boat, train, bus", value: 8, weight: 1 },
    { name: "Copies of passport, tickets etc", value: 6, weight: 0.5 },
    { name: "Boarding pass", value: 7, weight: 0.2 },
    { name: "Drivers licence", value: 5, weight: 0.5 },
    { name: "Health insurance card", value: 9, weight: 0.3 },
    { name: "List of medications, letter prescriber", value: 8, weight: 0.5 },
    { name: "Travel insurance", value: 7, weight: 0.3 },
    { name: "Student card", value: 3, weight: 0.2 },
  ],
  "Travel aids": [
    { name: "Suitcases, backpack", value: 8, weight: 5 },
    { name: "Itinerary", value: 10, weight: 0.5 },
    { name: "Maps and directions", value: 6, weight: 0.5 },
    { name: "Language guide", value: 5, weight: 0.5 },
    { name: "Travel guide", value: 6, weight: 1 },
    { name: "Travel pillow, sleeping mask, earplugs", value: 4, weight: 1 },
    { name: "Travel locks", value: 7, weight: 0.2 },
    { name: "Luggage tags", value: 5, weight: 0.1 },
    { name: "Pens and paper", value: 3, weight: 0.2 },
    { name: "Snacks, drinks", value: 6, weight: 2 },
    { name: "Small pocket knife (not in carry-on!)", value: 4, weight: 0.5 },
    { name: "Rope, expandable clothesline", value: 3, weight: 0.5 },
  ],
  Financial: [
    { name: "Foreign currency", value: 10, weight: 1 },
    { name: "Emergency money", value: 9, weight: 1 },
    { name: "Credit card, debit card", value: 10, weight: 0.1 },
    { name: "Extra wallet", value: 5, weight: 0.2 },
    { name: "Money belt", value: 7, weight: 0.3 },
  ],
  Appliances: [
    { name: "Cellphone, charger", value: 10, weight: 0.5 },
    { name: "Photo camera, memory card, charger", value: 8, weight: 1 },
    { name: "Laptop, iPad or Tablet, E-reader, chargers", value: 7, weight: 2 },
    { name: "Travel adapter and converter", value: 9, weight: 0.3 },
    { name: "Travel iron", value: 4, weight: 1 },
    { name: "Flashlight", value: 5, weight: 0.5 },
    { name: "Headphones", value: 6, weight: 0.2 },
  ],
  Clothes: [
    { name: "Underwear", value: 8, weight: 1 },
    { name: "Socks", value: 7, weight: 0.5 },
    { name: "Sleepwear", value: 6, weight: 0.5 },
    { name: "Shirts, polos", value: 7, weight: 1 },
    { name: "Jeans, trousers, shorts", value: 8, weight: 2 },
    { name: "Dresses, skirts", value: 7, weight: 1 },
    { name: "Shoes, sneakers", value: 9, weight: 2 },
    { name: "Flipflops, slippers", value: 5, weight: 0.5 },
    { name: "Jackets, coats, raincoats", value: 8, weight: 2 },
    { name: "Belts, ties", value: 4, weight: 0.3 },
    { name: "Scarves, hats, gloves", value: 5, weight: 0.5 },
  ],
  Toiletries: [
    { name: "Toothbrush, paste, dental floss", value: 9, weight: 0.5 },
    { name: "Deodorant", value: 8, weight: 0.3 },
    { name: "Tweezers (not in carry-on!)", value: 5, weight: 0.2 },
    { name: "Soap, shampoo, conditioner", value: 8, weight: 1 },
    { name: "Towels", value: 7, weight: 2 },
    { name: "Nailcare", value: 4, weight: 0.3 },
    { name: "Tissues, toilet roll", value: 6, weight: 0.5 },
    { name: "Feminine hygiene", value: 7, weight: 0.5 },
    { name: "Makeup, makeup remover", value: 6, weight: 0.5 },
    { name: "Shaving supplies", value: 6, weight: 0.3 },
    { name: "Skin products", value: 7, weight: 0.5 },
    { name: "Brush, comb, hair products", value: 6, weight: 0.3 },
    { name: "Glasses, contact lenses, supplies", value: 8, weight: 0.3 },
  ],
  Health: [
    { name: "Medications, pain reliever", value: 10, weight: 0.5 },
    { name: "First aid kit", value: 9, weight: 1 },
    { name: "Insect repellent", value: 8, weight: 0.3 },
    { name: "Oral Rehydration Solution (ORS)", value: 7, weight: 0.5 },
    { name: "Mosquito net", value: 6, weight: 2 },
    { name: "Birth control, condoms", value: 7, weight: 0.2 },
    { name: "Vaccines, health/dental checkup", value: 9, weight: 0.1 },
    { name: "Vitamins", value: 6, weight: 0.3 },
    { name: "Hand sanitizer/disinfectant", value: 8, weight: 0.3 },
  ],
  "General activities": [
    { name: "Swimsuit and big towel", value: 8, weight: 1 },
    { name: "Walking shoes", value: 9, weight: 1.5 },
    { name: "Sunglasses", value: 7, weight: 0.2 },
    { name: "Sunscreen", value: 8, weight: 0.3 },
    { name: "Umbrella", value: 6, weight: 0.5 },
    { name: "Daypack", value: 7, weight: 1 },
    { name: "Books, e-books, magazines", value: 5, weight: 1 },
  ],
};

function Checklist() {
  const { user, isAuthenticated } = useContext(LogInContext);
  const location = useLocation();
  const tripId = location.state?.tripId;
  const [formData, setFormData] = useState({ noOfDays: 3, Budget: "Moderate" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trip data from Firestore using tripId
  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) {
        setError("No trip ID provided. Please navigate from a trip.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching trip with ID:", tripId);
        const docRef = doc(db, "Trips", tripId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const tripData = docSnap.data();
          const rawFormData = tripData.userSelection || {};
          console.log("Fetched userSelection:", rawFormData);

          const mapBudget = (budget) => {
            if (typeof budget === "string" && ["Low", "Moderate", "Luxury"].includes(budget)) {
              return budget;
            }
            const budgetValue = parseFloat(budget);
            if (isNaN(budgetValue)) return "Moderate";
            if (budgetValue < 3000) return "Low";
            if (budgetValue < 10000) return "Moderate";
            return "Luxury";
          };

          const updatedFormData = {
            noOfDays: rawFormData.noOfDays || 3,
            Budget: mapBudget(rawFormData.Budget),
          };
          setFormData(updatedFormData);
          console.log("Set formData:", updatedFormData);
        } else {
          setError("Trip not found.");
        }
      } catch (err) {
        setError("Failed to load trip data.");
        console.error("Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  const [checklist, setChecklist] = useState(initialChecklist);
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Documents");
  const [checkedItems, setCheckedItems] = useState({});
  const [optimizedItems, setOptimizedItems] = useState({});
  const [isSending, setIsSending] = useState(false);

  // Knapsack Optimization (Greedy Approach)
  const optimizeChecklist = () => {
    const capacity = formData.noOfDays * 10 + (formData.Budget === "Luxury" ? 20 : formData.Budget === "Moderate" ? 10 : 5);
    console.log("Optimizing with capacity:", capacity);
    const optimized = {};

    Object.keys(checklist).forEach((category) => {
      const items = checklist[category];
      const selected = [];
      let remainingCapacity = capacity;

      items
        .sort((a, b) => (b.value / b.weight) - (a.value / a.weight))
        .forEach((item) => {
          if (item.weight <= remainingCapacity) {
            selected.push(item);
            remainingCapacity -= item.weight;
          }
        });

      optimized[category] = selected;
    });

    setOptimizedItems(optimized);

    const initialChecked = {};
    Object.keys(optimized).forEach((category) => {
      initialChecked[category] = optimized[category].map((item) => item.name);
    });
    setCheckedItems(initialChecked);
    console.log("Initialized checkedItems:", initialChecked);
  };

  useEffect(() => {
    if (!loading && !error) {
      optimizeChecklist();
    }
  }, [formData, checklist, loading, error]);

  // Add custom item with default value and weight
  const addCustomItem = () => {
    if (newItem.trim() === "") return;

    const isDuplicate = checklist[selectedCategory]?.some((item) => item.name.toLowerCase() === newItem.trim().toLowerCase());
    if (isDuplicate) {
      alert("This item already exists in the selected category.");
      return;
    }

    setChecklist((prev) => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], { name: newItem.trim(), value: 5, weight: 1 }],
    }));
    setNewItem("");
  };

  // Remove item and update checked items
  const removeItem = (category, itemName) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this item?");
    if (!confirmDelete) return;

    setChecklist((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item.name !== itemName),
    }));

    setCheckedItems((prev) => {
      const updated = { ...prev };
      updated[category] = (updated[category] || []).filter((name) => name !== itemName);
      return updated;
    });
  };

  // Handle checkbox changes for user selections
  const handleCheckboxChange = (category, itemName, checked) => {
    console.log(`Checkbox toggled - Category: ${category}, Item: ${itemName}, Checked: ${checked}`);
    setCheckedItems((prev) => {
      const currentItems = prev[category] || [];
      const updatedItems = checked
        ? [...currentItems, itemName]
        : currentItems.filter((i) => i !== itemName);
      const updatedState = {
        ...prev,
        [category]: updatedItems,
      };
      console.log("Updated checkedItems:", updatedState);
      return updatedState;
    });
  };

  // Generate PDF of checked items
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Your Travel Checklist", 20, 20);
    doc.setFontSize(12);
    let y = 30;

    Object.entries(checkedItems).forEach(([category, items]) => {
      if (items.length > 0) {
        doc.text(category, 20, y);
        y += 10;
        items.forEach((item) => {
          doc.text(`- ${item}`, 30, y);
          y += 10;
        });
        y += 5;
      }
    });

    if (y === 30) {
      doc.text("No items selected.", 20, y);
    }

    doc.save("checklist.pdf");
    return doc.output("datauristring").split(",")[1];
  };

  // Save checklist as PDF
  const saveAsPDF = () => {
    const hasCheckedItems = Object.values(checkedItems).some((items) => items.length > 0);
    if (!hasCheckedItems) {
      alert("Please select at least one item to save as PDF.");
      return;
    }
    generatePDF();
  };

  // Send checklist via email using EmailJS
  const mailChecklist = async () => {
    if (!isAuthenticated || !user?.email) {
      alert("User is not authenticated or email is missing.");
      return;
    }

    const hasCheckedItems = Object.values(checkedItems).some((items) => items.length > 0);
    if (!hasCheckedItems) {
      alert("Please select at least one item to send the checklist.");
      return;
    }

    setIsSending(true);

    const formattedItems = Object.entries(checkedItems)
      .filter(([, items]) => items.length > 0)
      .map(([category, items]) => `${category}:\n${items.map((item) => `- ${item}`).join("\n")}`)
      .join("\n\n");

    const templateParams = {
      user_name: user.name || "User",
      saved_items: formattedItems,
      email: user.email,
    };

    try {
      const response = await emailjs.send(
        "service_oepq08e", // Replace with your EmailJS service ID
        "template_9b21bnq", // Replace with your EmailJS template ID
        templateParams,
        "ej7jjYM4deFARaWnU" // Replace with your EmailJS public key
      );
      if (response.status === 200) {
        alert("Checklist sent successfully!");
        setCheckedItems({});
      } else {
        throw new Error(`Failed to send email: ${response.text}`);
      }
    } catch (error) {
      console.error("Error sending checklist email:", error);
      alert(`Failed to send checklist: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-500">
          Error: {error}
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
        Your Travel Checklist
      </h1>

      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a custom item..."
            className="w-full sm:w-2/3"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-1/3 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            {Object.keys(checklist).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Button onClick={addCustomItem} className="w-full sm:w-auto flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(checklist).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h2 className="text-xl font-semibold mb-3 bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent">
                {category}
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={`${category}-${item.name}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${category}-${item.name}`}
                        checked={checkedItems[category]?.includes(item.name) || false}
                        onCheckedChange={(checked) => handleCheckboxChange(category, item.name, checked)}
                      />
                      <label
                        htmlFor={`${category}-${item.name}`}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {item.name}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(category, item.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={mailChecklist} disabled={isSending}>
            {isSending ? "Sending..." : "Send Checklist"}
          </Button>
          <Button onClick={saveAsPDF}>Save as PDF</Button>
        </div>
      </div>
    </div>
  );
}

export default Checklist;