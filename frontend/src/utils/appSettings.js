import { api } from "./apiClient";

export async function loadAppSettings() {
  try {
    const res = await api.get("/settings/public");
    const settings = res?.data?.data;

    if (!settings) return;

    // change tab title
    if (settings.app_name) {
      document.title = settings.app_name;
    }

    // change favicon
    if (settings.letter_logo) {
      let link = document.querySelector("link[rel='icon']");

      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }

      link.href = settings.letter_logo;
    }

  } catch (e) {
    console.error("Failed loading public settings", e);
  }
}