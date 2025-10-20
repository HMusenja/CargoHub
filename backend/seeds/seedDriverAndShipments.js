// server/scripts/seedDriverAndShipments.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../src/config/db.js"

import User from "../src/models/User.js";
import Shipment, { SHIPMENT_STATUS } from "../src/models/Shipment.js";

// ---------- helpers ----------
const tz = "Europe/Berlin";
// get YYYY-MM-DD today in Berlin
function todayYMD() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date()); // yyyy-mm-dd
}
function atT(ymd, h, m = 0) {
  // new Date in local Berlin for display; stored as UTC ISO
  const [Y, M, D] = ymd.split("-").map(Number);
  return new Date(Date.UTC(Y, M - 1, D, h - 1, m)); // rough offset; ok for seed
}
function randomRef(prefix = "CH") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function mkAddress({ line1, city, postalCode, country = "DE", state = "" }) {
  return { line1, city, postalCode, country, state };
}

function mkParty({ name, email, phone, address, company }) {
  return { name, email, phone, address, company };
}

function euro(amount) {
  return { currency: "EUR", amount };
}

// Some canned parties
const parties = {
  senderA: mkParty({
    name: "ACME GmbH",
    company: "ACME GmbH",
    email: "warehouse@acme.de",
    phone: "+49 40 123456",
    address: mkAddress({ line1: "Spaldingstraße 12", city: "Hamburg", postalCode: "20097" }),
  }),
  senderB: mkParty({
    name: "Müller & Sohn",
    company: "Müller & Sohn",
    email: "info@mueller-sohn.de",
    phone: "+49 40 987654",
    address: mkAddress({ line1: "Wandsbeker Marktstraße 7", city: "Hamburg", postalCode: "22041" }),
  }),
  recvX: mkParty({
    name: "Fatou Ndiaye",
    email: "fatou.ndiaye@example.com",
    phone: "+221 77 000 0000",
    address: mkAddress({ line1: "Rue 12, Plateau", city: "Dakar", postalCode: "BP-10000", country: "SN" }),
  }),
  recvY: mkParty({
    name: "Kofi Mensah",
    email: "kofi.mensah@example.com",
    phone: "+233 24 123 4567",
    address: mkAddress({ line1: "Osu Oxford Street 25", city: "Accra", postalCode: "GA-184" , country: "GH"}),
  }),
};

async function upsertDriver() {
  const email = "driver@mail.com";
  let driver = await User.findOne({ email });

  if (!driver) {
    const password = "1234"; // bcrypt pre-save hook usually applies
    driver = new User({
      fullName: "Test Driver",
      email,
      role: "driver",
      phone: "+49 176 000000",
      password, // if your User requires hash manually, uncomment next line:
      // password: await bcrypt.hash(password, 10),
    });
    await driver.save();
    console.log("✓ Created driver user:", driver.email);
  } else {
    // ensure role=driver
    if (driver.role !== "driver") {
      driver.role = "driver";
      await driver.save();
    }
    console.log("✓ Using existing driver user:", driver.email);
  }
  return driver;
}

function mkContents(count = 1) {
  return [
    {
      description: "Household goods",
      quantity: count,
      weightKg: 8 * count,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 20,
      valueCurrency: "EUR",
      valueAmount: 100 * count,
    },
  ];
}

async function seedShipmentsForDriver(driver) {
  const ymd = todayYMD();

  // --- 2 scheduled pickups today (status=BOOKED + pickup.date today)
  const pickupScheduled = [
    {
      ref: randomRef("CH-BOOK"),
      status: SHIPMENT_STATUS.BOOKED,
      sender: parties.senderA,
      receiver: parties.recvX,
      contents: mkContents(2),
      pickup: { date: atT(ymd, 10), notes: "Tor 3, bitte klingeln." },
      dropoff: { date: atT(ymd, 17), notes: "" },
      serviceLevel: "standard",
      createdBy: driver._id,
      price: euro(120),
      scans: [
        { status: SHIPMENT_STATUS.BOOKED, note: "Created", createdAt: atT(ymd, 8) },
      ],
    },
    {
      ref: randomRef("CH-BOOK"),
      status: SHIPMENT_STATUS.BOOKED,
      sender: parties.senderB,
      receiver: parties.recvY,
      contents: mkContents(1),
      pickup: { date: atT(ymd, 13), notes: "Zerbrechlich" },
      dropoff: { date: atT(ymd, 18), notes: "" },
      serviceLevel: "express",
      createdBy: driver._id,
      price: euro(160),
      scans: [
        { status: SHIPMENT_STATUS.BOOKED, note: "Created", createdAt: atT(ymd, 9) },
      ],
    },
  ];

  // --- 2 out for delivery today (status=OUT_FOR_DELIVERY + scan timeline)
  const outForDelivery = [
    {
      ref: randomRef("CH-DEL"),
      status: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
      sender: parties.senderA,
      receiver: parties.recvX,
      contents: mkContents(1),
      pickup: { date: atT(ymd, 9) },
      dropoff: { date: atT(ymd, 16) },
      serviceLevel: "standard",
      createdBy: driver._id,
      price: euro(95),
      scans: [
        { status: SHIPMENT_STATUS.BOOKED, createdAt: atT(ymd, 8) },
        { status: SHIPMENT_STATUS.PICKED_UP, createdAt: atT(ymd, 10), note: "Collected" },
        { status: SHIPMENT_STATUS.OUT_FOR_DELIVERY, createdAt: atT(ymd, 14), note: "On route" },
      ],
    },
    {
      ref: randomRef("CH-DEL"),
      status: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
      sender: parties.senderB,
      receiver: parties.recvY,
      contents: mkContents(3),
      pickup: { date: atT(ymd, 11) },
      dropoff: { date: atT(ymd, 18) },
      serviceLevel: "standard",
      createdBy: driver._id,
      price: euro(140),
      scans: [
        { status: SHIPMENT_STATUS.BOOKED, createdAt: atT(ymd, 9) },
        { status: SHIPMENT_STATUS.PICKED_UP, createdAt: atT(ymd, 12), note: "Picked up" },
        { status: SHIPMENT_STATUS.OUT_FOR_DELIVERY, createdAt: atT(ymd, 15), note: "Out for delivery" },
      ],
    },
  ];

  // --- 2 delivered earlier this week (status=DELIVERED + deliveredAt + scan)
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(now.getTime() - 2 * msInDay);
  const d2 = new Date(now.getTime() - 4 * msInDay);

  function packDelivered(baseDate, refPrefix) {
    const ymdDelivered = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(baseDate);
    return {
      ref: randomRef(refPrefix),
      status: SHIPMENT_STATUS.DELIVERED,
      sender: parties.senderA,
      receiver: parties.recvX,
      contents: mkContents(1),
      pickup: { date: atT(ymdDelivered, 9) },
      dropoff: { date: atT(ymdDelivered, 16) },
      serviceLevel: "standard",
      createdBy: driver._id,
      price: euro(130), // ensure revenue
      deliveredAt: baseDate, // explicit for revenue by day
      scans: [
        { status: SHIPMENT_STATUS.BOOKED, createdAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000) },
        { status: SHIPMENT_STATUS.PICKED_UP, createdAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000) },
        { status: SHIPMENT_STATUS.OUT_FOR_DELIVERY, createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000) },
        { status: SHIPMENT_STATUS.DELIVERED, createdAt: baseDate, note: "POD: Demo Recipient" },
      ],
    };
  }

  const delivered = [packDelivered(d1, "CH-DONE"), packDelivered(d2, "CH-DONE")];

  const docs = [...pickupScheduled, ...outForDelivery, ...delivered];
  const created = await Shipment.insertMany(docs);
  console.log(`✓ Inserted ${created.length} shipments for driver (${driver.email})`);

  return created;
}

async function main() {
  await connectDB();

  // Optional: log current DB info safely
  const conn = mongoose.connection;
  console.log(`Connected: ${conn.host}/${conn.name}`);

  const driver = await upsertDriver();
  await seedShipmentsForDriver(driver);

  await mongoose.disconnect();
  console.log("Done.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
