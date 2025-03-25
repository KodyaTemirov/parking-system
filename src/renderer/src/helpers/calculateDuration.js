export const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();

  if (end < start) return "0м 0с";

  const durationMs = end - start;
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${days > 0 ? `${days}д ` : ""}${hours > 0 ? `${hours}ч ` : ""}${minutes > 0 ? `${minutes}м` : "Только что"}`;
};
