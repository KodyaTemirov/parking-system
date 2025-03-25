import { tarifs } from "./prices.js";
import db from "../db/database.js";

const calculateParkingCost = (entryTime, dailyCost) => {
  try {
    const entryDate = new Date(entryTime).getTime();
    const currentDate = new Date().getTime();
    const diffInMinutes = (currentDate - entryDate) / (1000 * 60);

    if (diffInMinutes <= 24 * 60) {
      return 0;
    } else {
      const extraDays = Math.ceil((diffInMinutes - 24 * 60) / (24 * 60));
      return extraDays * dailyCost;
    }
  } catch (error) {
    console.error("Ошибка при расчете стоимости парковки:", error);
    return 0;
  }
};

const isPeriodPaid = (entryTime, paidDays) => {
  try {
    const entryDate = new Date(entryTime).getTime();
    const currentDate = new Date().getTime();
    const diffInMinutes = (currentDate - entryDate) / (1000 * 60);

    // Если прошло меньше 24 часов - всегда true
    if (diffInMinutes <= 24 * 60) {
      return true;
    }

    // Для времени больше 24 часов проверяем оплаченные дни
    const extraDays = Math.ceil((diffInMinutes - 24 * 60) / (24 * 60));
    const paidUntilDate = entryDate + (paidDays + extraDays) * 24 * 60 * 60 * 1000;
    return currentDate <= paidUntilDate;
  } catch (error) {
    console.error("Ошибка при проверке оплаченного периода:", error);
    return false;
  }
};

const isPayedToday = (item, type = "number") => {
  const session = db
    .prepare(
      `SELECT * FROM sessions
       WHERE ${type == "number" ? "plateNumber" : "id"} = ?
       AND endTime IS NOT NULL
       ORDER BY startTime DESC
       LIMIT 1`
    )
    .get(item);

  if (!session) return false;

  const currentTarif = tarifs.find((tarif) => tarif.id === session.tarifId).pricePerDay;

  const payedDays = session.outputCost / currentTarif;

  return isPeriodPaid(session.startTime, payedDays);
};

console.log(calculateParkingCost("2025-03-24T10:00:00Z", 10000));

console.log(isPeriodPaid("2025-03-24T10:00:00Z", 0));

// isPayedToday("01L087WB");
// isPayedToday();

console.log(0 / 1000);
