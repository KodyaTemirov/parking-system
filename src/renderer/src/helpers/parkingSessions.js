const parkingSessions = Array.from({ length: 4 }, (_, i) => {
  const plateNumbers = ["01A123AB", "10B456AA", "80C789KA", "20D012FA"];
  const tariffTypes = ["Standard", "VIP", "Economy"];
  const paymentMethods = ["Card", "Cash", "QR Code"];

  return {
    id: i + 1,
    plateNumber: plateNumbers[i % plateNumbers.length],
    startTime: new Date(2025, 2, 14, 8 + (i % 12), 15 * (i % 4)).toISOString(),
    tariffType: tariffTypes[i % tariffTypes.length],
    duration: `${1 + (i % 5)}h ${i % 60}m`,
    cost: 4000 + (i % 5) * 1000,
    paymentMethod: paymentMethods[i % paymentMethods.length],
  };
});

export default parkingSessions;
