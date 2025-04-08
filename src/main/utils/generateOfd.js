import axios from "axios";

const generateOfd = async (id, sum) => {
  try {
    const data = await axios.post(
      `https://raqamli-bozor.uz/services/platon-core/api/v1/pms/ofd`,
      {
        id,
        sum,
      },
      {
        headers: {
          Authorization: "Basic " + btoa(`pms_306576853:a3f1c8d92b7e4f65`),
        },
      }
    );
    console.log(data, 'ofd info');
    console.log(data.data, 'ofd info');

    return data.data.url;
  } catch (error) {
    console.error("Error generating OFD:", error);
    throw new Error("Failed to generate OFD");
  }
};

export default generateOfd;
