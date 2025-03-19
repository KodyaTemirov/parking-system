export const parsePlateData = (body) => {
  const plateNumber = body.config.listinfo[0].item[1].platenumber[0]._;
  const plateImage = body.config.listinfo[0].item[1].targetimagedata[0].targetbase64data[0]._;
  const fullImage = body.config.listinfo[0].item[0].targetimagedata[0].targetbase64data[0]._;

  console.log("🔹 Номер автомобиля:", plateNumber);

  return {
    number: plateNumber,
    plateImage: `data:image/jpeg;base64,${plateImage}`,
    fullImage: `data:image/jpeg;base64,${fullImage}`,
  };
};
