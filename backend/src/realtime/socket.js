// realtime/socket.js
import { Server } from "socket.io";

let io;

/** Initialize once from your http server */
export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }, // tighten in prod
  });

  io.on("connection", (socket) => {
    // Optional rooms by shipment ref, if you want targeted emits later:
    // socket.on("join:shipment", (ref) => socket.join(`shipment:${ref}`));
    // socket.on("leave:shipment", (ref) => socket.leave(`shipment:${ref}`));
  });

  return io;
}

/** Safe getter */
export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

/** Helper: broadcast scan created */
export function emitShipmentScanCreated({ ref, status }) {
  if (!io) return;
  // Global broadcast:
  io.emit("shipment.scan.created", { ref, status });

  // If you later use rooms:
  // io.to(`shipment:${ref}`).emit("shipment.scan.created", { ref, status });
}
