import Swal from "sweetalert2";
import { isLoggedIn, isGuest } from "./auth";

export function requireLoginAction(actionText = "continue") {
  if (isLoggedIn()) return true;

  Swal.fire({
    icon: "info",
    title: isGuest() ? "Guest Mode" : "Login Required",
    text: `Please log in or create an account to ${actionText}.`,
    confirmButtonText: "OK",
  });

  return false;
}