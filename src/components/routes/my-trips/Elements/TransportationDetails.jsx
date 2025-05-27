import { useState } from "react";
import { getAccessToken, searchFlights } from "./amadeusAPI"; // Adjust path accordingly

function TransportationDetails() {
  const [fromIata, setFromIata] = useState("");
  const [toIata, setToIata] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [flights, setFlights] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setError("");

    if (!fromIata.trim() || !toIata.trim() || !date.trim()) {
      setError("Please enter From, To IATA codes and Departure Date.");
      return;
    }

    setFlights(null);
    setLoading(true);

    try {
      const token = await getAccessToken();
      const flightResults = await searchFlights(fromIata, toIata, date, token);
      setFlights(flightResults);
      if (!flightResults.length) setError("No flights found for the given route and date.");
    } catch (e) {
      setError("Failed to fetch flights. Please try again later.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Format date for Google Flights URL (YYYY-MM-DD)
  const formatDateForGoogle = (d) => d;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "black",
        padding: 20,
        maxWidth: 700,
        margin: "auto",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Search Flights</h2>

      {/* PDF Display */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <a href="/iata_reference.pdf" target="_blank" rel="noopener noreferrer">
          <button style={{ padding: "10px 20px", fontSize: "16px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}>
            View IATA Reference PDF
          </button>
        </a>
      </div>

      <label
        style={{ display: "block", marginBottom: 10, fontWeight: "600", fontSize: 16 }}
      >
        From IATA Code:
        <input
          type="text"
          placeholder="Enter From IATA Code"
          value={fromIata}
          onChange={(e) => setFromIata(e.target.value.toUpperCase())}
          maxLength={3}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            fontSize: 18,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </label>

      <label
        style={{ display: "block", marginBottom: 10, fontWeight: "600", fontSize: 16 }}
      >
        To IATA Code:
        <input
          type="text"
          placeholder="Enter To IATA Code"
          value={toIata}
          onChange={(e) => setToIata(e.target.value.toUpperCase())}
          maxLength={3}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            fontSize: 18,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </label>

      <label
        style={{ display: "block", marginBottom: 20, fontWeight: "600", fontSize: 16 }}
      >
        Departure Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 5,
            fontSize: 18,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </label>

      <button
        onClick={handleSearch}
        style={{
          padding: "14px 25px",
          fontSize: 18,
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 20,
          width: "100%",
          fontWeight: "600",
        }}
        disabled={loading}
      >
        {loading ? "Searching..." : "Search Flights"}
      </button>

      {error && <p style={{ color: "red", fontWeight: "600" }}>{error}</p>}

      {/* Flights display */}
      {flights && flights.length > 0 && (
        <>
          <h3 style={{ marginBottom: 15, fontWeight: "700" }}>Flight Results:</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
              marginBottom: 20,
            }}
          >
            {flights.map((flight, index) => {
              const googleFlightsUrl = `https://www.google.com/flights?hl=en#flt=${fromIata}.${toIata}.${formatDateForGoogle(
                date
              )};c:USD;e:1;sd:1;t:f`;

              return (
                <div
                  key={index}
                  onClick={() => window.open(googleFlightsUrl, "_blank")}
                  style={{
                    border: "2px solid #007bff",
                    borderRadius: 10,
                    padding: 20,
                    cursor: "pointer",
                    backgroundColor: "#e6f0ff",
                    boxShadow: "0 4px 8px rgba(0, 123, 255, 0.2)",
                    transition: "transform 0.2s",
                    fontSize: 17,
                    fontWeight: "600",
                    color: "#003366",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  title="Click to book on Google Flights"
                >
                  <div>
                    <strong>Price:</strong> {flight.price?.total} {flight.price?.currency}
                  </div>
                  <div>
                    <strong>Airlines:</strong>{" "}
                    {flight.itineraries?.[0]?.segments?.map((s) => s.carrierCode).join(", ")}
                  </div>
                  <div>
                    <strong>Departure:</strong>{" "}
                    {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} at{" "}
                    {new Date(flight.itineraries[0].segments[0].departure.at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Arrival:</strong>{" "}
                    {flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode} at{" "}
                    {new Date(
                      flight.itineraries[0].segments.slice(-1)[0].arrival.at
                    ).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default TransportationDetails;
