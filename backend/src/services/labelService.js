import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const LABEL_DIR = path.resolve("storage/labels");

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

/**
 * Generates a simple A6/A5 label PDF with:
 * - Big REF
 * - Sender/Receiver names + cities
 * - Item count
 * - Today’s date
 * - QR code encoding REF (or tracking URL)
 *
 * Returns { filePath } and persists file on disk.
 */
export async function generateLabelPDF(shipment) {
  await ensureDir(LABEL_DIR);

  const fileName = `${shipment.ref}.pdf`;
  const filePath = path.join(LABEL_DIR, fileName);

  // Build QR payload (simple for now)
  const qrPayload = `REF:${shipment.ref}`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, scale: 6 });
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  // PDF
  const doc = new PDFDocument({
    size: "A6", // Small label size; change to "A5" if you prefer bigger
    margins: { top: 18, left: 18, right: 18, bottom: 18 },
    info: { Title: `Label ${shipment.ref}`, Author: "CargoHub" },
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc
    .fontSize(18)
    .text("Shipment Label", { align: "left" })
    .moveDown(0.3);

  // REF big & bold
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(`REF: ${shipment.ref}`, { align: "left" })
    .moveDown(0.8);

  // QR + meta in two columns
  const startY = doc.y;
  const qrSize = 110;

  // Left column: QR
  doc.image(qrBuffer, doc.x, startY, { fit: [qrSize, qrSize] });

  // Right column: details
  const rightX = doc.x + qrSize + 12;
  doc
    .font("Helvetica")
    .fontSize(11)
    .text(`Service: ${shipment.serviceLevel ?? "standard"}`, rightX, startY)
    .moveDown(0.3)
    .text(`Items: ${shipment.contents?.reduce((n, i) => n + (i.quantity || 0), 0) || 0}`)
    .moveDown(0.3)
    .text(`Price: ${shipment.price?.currency || "EUR"} ${shipment.price?.amount ?? "-"}`)
    .moveDown(0.3)
    .text(`Date: ${new Date().toISOString().slice(0, 10)}`)
    .moveDown(0.8);

  // Parties (names + cities)
  const senderCity = shipment.sender?.address?.city || "-";
  const receiverCity = shipment.receiver?.address?.city || "-";
  doc
    .moveDown(0.5)
    .font("Helvetica-Bold")
    .text("From:", { underline: true })
    .font("Helvetica")
    .text(`${shipment.sender?.name || "-"}`)
    .text(`${senderCity}`)
    .moveDown(0.5)
    .font("Helvetica-Bold")
    .text("To:", { underline: true })
    .font("Helvetica")
    .text(`${shipment.receiver?.name || "-"}`)
    .text(`${receiverCity}`)
    .moveDown(1);

  // Footer
  doc
    .fontSize(8)
    .fillColor("#666")
    .text("Scan QR to retrieve booking by REF.", { align: "left" });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { filePath };
}
