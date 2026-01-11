import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TestGyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGyms = async () => {
      try {
        // Use HTTP or HTTPS depending on Herd setup
        const response = await axios.get("https://exersearch.test/api/v1/gyms", {
          withCredentials: true, // needed if Laravel Sanctum or cookies are involved
        });

        // Handle Laravel response: either array directly or { data: [...] }
        const gymsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || []; // fallback to empty array

        setGyms(gymsData);
      } catch (err) {
        console.error("Error fetching gyms:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGyms();
  }, []);

  if (loading) return <p>Loading gyms...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Gyms List</h1>
      {gyms.length === 0 && <p>No gyms found.</p>}
      <ul>
        {Array.isArray(gyms)
          ? gyms.map((gym) => (
              <li key={gym.id}>
                {gym.name} — {gym.location || "No location"}
              </li>
            ))
          : <li>Unexpected response format</li>
        }
      </ul>
    </div>
  );
}
