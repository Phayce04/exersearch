import React, { useEffect, useState } from "react";
import axios from "axios";
import { logGymEvent } from "../api/logGymEvent";

const API_BASE = "https://exersearch.test/api/v1"; // change if needed

export default function Recommendations() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  // get token however you store it
  const token = localStorage.getItem("token");

  // session id for this browsing session
  const sessionId =
    localStorage.getItem("gym_session_id") || crypto.randomUUID();

  useEffect(() => {
    localStorage.setItem("gym_session_id", sessionId);
  }, [sessionId]);

  useEffect(() => {
    async function fetchRecs() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/gyms/recommend?mode=driving`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const list = res.data.gyms || [];
        setGyms(list);

        // ✅ log "view" impression for each gym shown
        list.forEach((g) => {
          logGymEvent(token, {
            gym_id: g.gym_id,
            event: "view",
            source: "recommendations",
            session_id: sessionId,
            meta: {
            equipment_match: g.equipment_match,
            amenity_match: g.amenity_match,
            travel_time_min: g.travel_time_min,
            price: g.price,
            budget_penalty: g.budget_penalty
          },
          });
        });
      } catch (e) {
        console.error(e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchRecs();
  }, [token, sessionId]);

  if (!token) return <div>Please login first.</div>;
  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Recommended Gyms</h2>

      {gyms.length === 0 && <div>No gyms found.</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {gyms.map((gym) => (
          <div
            key={gym.gym_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              cursor: "pointer",
            }}
            onClick={() => {
              // ✅ log click
              logGymEvent(token, {
                gym_id: gym.gym_id,
                event: "click",
                source: "recommendations",
                session_id: sessionId,
                meta: { topsis_score: gym.topsis_score },
              });

              alert(`Clicked ${gym.name}`);
              // later: navigate to details page
            }}
          >
            <div style={{ fontWeight: 700 }}>{gym.name}</div>
            <div>Price: ₱{gym.price}</div>
            <div>Travel: {gym.travel_time_min ?? "?"} min</div>
            <div>Score: {gym.topsis_score}</div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logGymEvent(token, {
                    gym_id: gym.gym_id,
                    event: "save",
                    source: "recommendations",
                    session_id: sessionId,
                  });
                  alert("Saved!");
                }}
              >
                Save
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logGymEvent(token, {
                    gym_id: gym.gym_id,
                    event: "contact",
                    source: "recommendations",
                    session_id: sessionId,
                  });
                  alert("Contacted!");
                }}
              >
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
