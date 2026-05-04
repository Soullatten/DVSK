import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase";

const TOKEN_KEY = "dvsk_auth_token";

let initialized = false;

export function initAuthTokenSync() {
  if (initialized) return;
  initialized = true;

  onIdTokenChanged(auth, async (user) => {
    if (!user) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    try {
      const token = await user.getIdToken();
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    try {
      const token = await user.getIdToken();
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    }
  });
}
