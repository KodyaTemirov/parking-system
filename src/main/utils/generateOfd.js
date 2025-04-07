import axios from "axios";

const generateOfd = async (id, sum) => {
  try {
    const data = await axios.post(`https://raqamli-bozor.uz/services/platon-core/api/v1/pms/ofd`, {
      id,
      sum,
    });

    return data.data.url;
  } catch (error) {
    console.error("Error generating OFD:", error);
    throw new Error("Failed to generate OFD");
  }
};

export default generateOfd;
