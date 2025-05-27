// src/components/routes/cost-risk/CostRiskAnalytics.jsx
import React, { useState, useEffect } from "react";

function CostRiskAnalytics() {
  const [duration, setDuration] = useState(3);
  const [costPrediction, setCostPrediction] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState("");

  // Linear Regression: Cost = β0 + β1 * Duration + ...
  const predictCost = (days) => {
    const β0 = 200; // Base cost
    const β1 = 100; // Cost per day
    return β0 + β1 * days;
  };

  // Bayesian Network: Simplified risk evaluation
  const evaluateRisk = (days) => {
    const rainChance = 0.3; // Simulated probability
    const safetyIndex = 0.8; // Simulated safety
    if (rainChance > 0.5 || safetyIndex < 0.6) {
      return "High risk: Consider indoor activities or safety measures.";
    }
    return "Low risk: Enjoy your trip!";
  };

  useEffect(() => {
    setCostPrediction(predictCost(duration));
    setRiskAssessment(evaluateRisk(duration));
  }, [duration]);

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent">
        Cost & Risk Analytics
      </h1>
      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Trip Duration (Days)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            min="1"
            max="5"
          />
        </div>
        <div className="mb-6">
          <p className="text-lg">Predicted Cost: ${costPrediction}</p>
        </div>
        <div>
          <p className="text-lg">Risk Assessment: {riskAssessment}</p>
        </div>
      </div>
    </div>
  );
}

export default CostRiskAnalytics;