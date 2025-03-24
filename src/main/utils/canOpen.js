const canOpen = (time) => {
  try {
    if (!time) return true;

    const currentTime = new Date().getTime();
    const lastTime = new Date(time).getTime();
    const diffInSeconds = (currentTime - lastTime) / 1000;

    return diffInSeconds >= 30;
  } catch (error) {
    console.error("Ошибка при проверке времени:", error);
    return true;
  }
};

export default canOpen;
