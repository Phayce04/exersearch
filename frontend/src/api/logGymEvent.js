import axios from "axios";

export async function logGymEvent(token, payload) {
  try {
    await axios.post(
      "https://exersearch.test/api/v1/gym-interactions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.warn("logGymEvent failed:", e?.response?.data || e.message);
  }
}
