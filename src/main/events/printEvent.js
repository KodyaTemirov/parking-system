import { ipcMain } from "electron";
import PDFDocument from "pdfkit";
import fs from "fs";
import ptp from "pdf-to-printer";
import path from "path";
import os from "os";
import { getSelectedOperator } from "../menu"; // Укажите правильный путь

export function registerPrintEvent() {
  ipcMain.on("print-receipt", async (event, info) => {
    const selectedOperator = getSelectedOperator();

    console.log("selectedOperator", selectedOperator);
    console.log("info.operatorId", info.operatorId);

    if (!selectedOperator || selectedOperator !== info.operatorId) {
      console.error("Ошибка: оператор не совпадает, печать отменена.");
      return;
    }

    const pdfPath = path.join(os.tmpdir(), "receipt.pdf");

    if (!info || !info.plateNumber || !info.inputCost || !info.id) {
      console.error("Ошибка: некорректные данные для печати", info);
      return;
    }

    const width = 58 * 2.83;
    const height = 75 * 2.83;

    const doc = new PDFDocument({
      size: [width, height],
      margins: { top: 5, left: 5, right: 5, bottom: 5 },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const fontBold = "C:\\Windows\\Fonts\\arialbd.ttf";
    const fontRegular = "C:\\Windows\\Fonts\\arial.ttf";

    doc.font(fontBold).fillColor("black");

    // Номер чека
    doc.fontSize(20).text(`Чек № ${info.id}`, { align: "center" }).moveDown(1);

    doc.fontSize(10).text("Автомобильный номер:", { align: "left" });
    doc.font(fontRegular).text(info.plateNumber, { align: "left" });

    doc.moveDown(0.3);
    doc.font(fontBold).text("Тариф:", { align: "left" });
    doc.font(fontRegular).text(info.tariffType, { align: "left" });

    doc.moveDown(0.3);
    doc.font(fontBold).text("Цена:", { align: "left" });
    doc.font(fontRegular).text(`${info.inputCost} сум`, { align: "left" });

    doc.moveDown(0.3);
    doc.font(fontBold).text("Тип оплаты:", { align: "left" });
    doc
      .font(fontRegular)
      .text(info.inputPaymentMethod === 1 ? "Наличные" : "Карта", { align: "left" });

    doc.moveDown(0.3);
    doc.font(fontBold).text("Время въезда:", { align: "left" });
    doc.font(fontRegular).text(new Date(info.startTime).toLocaleString(), { align: "left" });

    doc.moveDown(1);
    doc.font(fontBold).text("----------------------------", { align: "center" });

    doc.end();

    stream.on("finish", async () => {
      try {
        await ptp.print(pdfPath, {
          options: {
            scale: "shrink",
          },
        });
        console.log("Печать завершена");
      } catch (err) {
        console.error("Ошибка печати:", err);
      }
    });
  });
}
