// generateReceiptHtml.js
export function generateReceiptHtml(info) {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
        }
					
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          display: flex;
          justify-content: center;
          width: 100%;
          }
        .receipt {
          width: 80mm;
          text-align: center;
          padding: 5px;
        }
        h2 { font-size: 14px; margin-bottom: 5px; }
        p { margin: 2px 0; font-size: 12px; }
        hr { border: 1px dashed black; margin: 5px 0; }
        .receipt-id { font-size: 16px; font-weight: bold; }
        .qr-code { margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <h2>ЧЕК</h2>
        <p><strong class="receipt-id">ID: ${info.id}</strong></p>
        <p><strong>Госномер:</strong> ${info.plateNumber}</p>
        <p><strong>Тариф:</strong> ${info.tariffType}</p>
        <p><strong>Время начала:</strong> ${new Date(info.startTime).toLocaleString()}</p>
        <hr>
        <canvas id="qr-code" class="qr-code"></canvas>
        <p>Спасибо за посещение!</p>
      </div>
      <div class="page-break"></div>
      <script>
        document.addEventListener("DOMContentLoaded", () => {
          new QRious({
            element: document.getElementById('qr-code'),
            value: '${info.id}',
            size: 90
          });
        });
      </script>
    </body>
    </html>`;
}
