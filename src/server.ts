import { app } from "./app.js";
import { handleExpiredReservations } from "./services/services/handleExpiredReservations.js";

const PORT = process.env.PORT || 3000;

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // TODO: implement this is a production ready way
  setInterval(async () => {
    try {
      await handleExpiredReservations();
    } catch (err) {
      console.error("Expired reservation job failed:", err);
    }
  }, 60 * 1000);
}
