const calculateParkingCost = (entryTime, hourlyCost) => {
  try {
    const entryDate = new Date(entryTime).getTime();
    const currentDate = new Date().getTime();
    const diffInMinutes = (currentDate - entryDate) / (1000 * 60);

    if (diffInMinutes <= 60) {
      return hourlyCost;
    } else {
      const extraHours = Math.ceil(diffInMinutes / 60);
      return extraHours * hourlyCost;
    }
  } catch (error) {
    console.error("Ошибка при расчете стоимости парковки:", error);
    return 0;
  }
};

export { calculateParkingCost };
