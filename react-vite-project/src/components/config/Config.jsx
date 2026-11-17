const BASE_URL = "http://localhost:8080/api/";  // Must terminate with '/'

// Dev Mode is on only when react-vite-project/.env.development.local contains VITE_DEV_MODE=true (never committed)
export const DEV_MODE_ENABLED = import.meta.env.VITE_DEV_MODE === "true";

export default BASE_URL;
