import axios from "axios";

export const checkInternetConnection = async () => {
  try {
    await axios.get("https://www.google.com", { timeout: 500 });
    return true;
  } catch (error) {
    return false;
  }
};

export const checkInternetConnectionWithFallback = async () => {
  const urls = [
    "https://www.google.com",
    "https://www.cloudflare.com",
    "https://www.microsoft.com",
  ];

  for (const url of urls) {
    try {
      await axios.get(url, { timeout: 1000 });
      return true;
    } catch (error) {
      continue;
    }
  }

  return false;
};
