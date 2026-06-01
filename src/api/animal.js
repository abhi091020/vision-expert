import { apiGet, ANIMAL_URL } from "./client";

export const getAnimalHealth = () => apiGet("/health", ANIMAL_URL);

export const getAnimalAlerts = (limit = 100) =>
  apiGet(`/api/animal/alerts?limit=${limit}`, ANIMAL_URL);

// Derives a status object from the latest alert.
// Returns a safe "no detection" shape when the list is empty.
export async function getAnimalStatus() {
  const alerts = await getAnimalAlerts(1);
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return {
      detected: false,
      animal: null,
      confidence: 0,
      image: null,
      dangerous: false,
    };
  }
  const a = alerts[0];
  return {
    detected: a.detected ?? true,
    animal: a.animal ?? null,
    confidence: a.confidence ?? 0,
    image: a.annotated ?? a.image ?? null,
    dangerous: a.dangerous ?? false,
  };
}
