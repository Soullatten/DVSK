#!/usr/bin/env node
/* eslint-disable */
/**
 * DVSK Bot Simulator — sends synthetic visitors and orders at the storefront
 * so you can watch everything light up in the admin panel in real time.
 *
 * Usage (from c:\Users\krish\DVSK):
 *   node scripts/bot-test.mjs
 *   node scripts/bot-test.mjs --visitors 20 --orders 5 --duration 60
 *
 * Flags:
 *   --visitors <N>   how many fake shoppers to simulate (default 8)
 *   --orders <N>     how many of them should also place an order (default 3)
 *   --duration <s>   seconds each visitor stays "browsing" (default 45)
 *   --backend <url>  backend base URL (default http://localhost:5000)
 *   --origin <url>   origin to spoof for socket CORS (default http://localhost:5173)
 *   --cleanup        delete all bot users + orders previously created, then exit
 */

import { io as ioClient } from "socket.io-client";

// ─── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  return args[i + 1] ?? def;
};
const has = (name) => args.includes(`--${name}`);

const VISITORS = parseInt(flag("visitors", "8"), 10);
const ORDER_COUNT = parseInt(flag("orders", "3"), 10);
const DURATION_SEC = parseInt(flag("duration", "45"), 10);
const BACKEND = flag("backend", "http://localhost:5000");
const ORIGIN = flag("origin", "http://localhost:5173");
const CLEANUP = has("cleanup");

// ─── Persona pool ──────────────────────────────────────────────────────────────
const CITIES = [
  { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
  { city: "Delhi", state: "Delhi", pincode: "110001" },
  { city: "Bangalore", state: "Karnataka", pincode: "560001" },
  { city: "Hyderabad", state: "Telangana", pincode: "500001" },
  { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
  { city: "Pune", state: "Maharashtra", pincode: "411001" },
  { city: "Kolkata", state: "West Bengal", pincode: "700001" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
  { city: "Surat", state: "Gujarat", pincode: "395001" },
  { city: "Lucknow", state: "Uttar Pradesh", pincode: "226001" },
  { city: "Kochi", state: "Kerala", pincode: "682001" },
  { city: "Goa", state: "Goa", pincode: "403001" },
];

const FIRST_NAMES = [
  "Arjun", "Kavya", "Aditya", "Ishaan", "Riya", "Vihaan", "Diya", "Reyansh",
  "Saanvi", "Rohan", "Anaya", "Aarav", "Mira", "Krish", "Anvi", "Vivaan",
  "Tara", "Kabir", "Aria", "Veer",
];
const LAST_NAMES = ["Sharma", "Patel", "Gupta", "Singh", "Khan", "Rao", "Mehta", "Iyer", "Reddy", "Kapoor"];

const BROWSE_PATHS = [
  "/", "/men", "/women", "/accessories",
  "/men", "/men", "/women", "/about", "/campaigns",
  "/services", "/size-guide",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Cleanup mode ──────────────────────────────────────────────────────────────
async function cleanup() {
  console.log(`\n[cleanup] Wiping bot users + orders from ${BACKEND}...`);
  try {
    const r = await fetch(`${BACKEND}/api/dev/cleanup-bots`, { method: "DELETE" });
    const body = await r.json();
    if (body?.success) {
      const d = body.data || {};
      console.log(`[cleanup] ✓ Removed ${d.deletedUsers || 0} bot users, ${d.deletedOrders || 0} orders, ${d.deletedAddresses || 0} addresses`);
    } else {
      console.error("[cleanup] failed:", body);
    }
  } catch (err) {
    console.error("[cleanup] error:", err.message);
  }
}

// ─── Bot lifecycle ─────────────────────────────────────────────────────────────
async function fetchProductsAndVariants() {
  try {
    const r = await fetch(`${BACKEND}/api/products?limit=20`, {
      headers: { Origin: ORIGIN },
    });
    const body = await r.json();
    const products = body?.data || [];
    return products
      .map((p) => {
        const v = (p.variants || []).find((v) => v.stock > 0);
        if (!v) return null;
        return { productId: p.id, variantId: v.id, name: p.name, slug: p.slug, basePrice: p.basePrice };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn("[bots] couldn't fetch products:", err.message);
    return [];
  }
}

async function placeOrder(persona, cartItems) {
  const items = cartItems.map((c) => ({
    productId: c.productId,
    variantId: c.variantId,
    quantity: 1,
  }));
  try {
    const r = await fetch(`${BACKEND}/api/dev/seed-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({
        customerName: persona.name,
        customerEmail: persona.email,
        customerPhone: persona.phone,
        addressLine1: `${rand(1, 99)} ${pick(["MG Road", "Park Street", "Linking Road", "Brigade Road"])}`,
        city: persona.city,
        state: persona.state,
        pincode: persona.pincode,
        country: "India",
        items,
      }),
    });
    const body = await r.json();
    if (body?.success) {
      console.log(`  💳 [${persona.name}] placed order ${body.data?.orderNumber} from ${persona.city} — ₹${Math.round(Number(body.data?.total)).toLocaleString("en-IN")}`);
      return true;
    }
    console.warn(`  ✗ [${persona.name}] order failed:`, body?.error?.message || body?.message);
  } catch (err) {
    console.warn(`  ✗ [${persona.name}] order error:`, err.message);
  }
  return false;
}

async function runBot(index, willOrder, products) {
  const loc = pick(CITIES);
  const fname = pick(FIRST_NAMES);
  const lname = pick(LAST_NAMES);
  const persona = {
    name: `${fname} ${lname}`,
    email: `${fname.toLowerCase()}.${lname.toLowerCase()}+bot${index}@dvsk.test`,
    phone: `+9197${rand(10000000, 99999999)}`,
    city: loc.city,
    state: loc.state,
    pincode: loc.pincode,
  };

  console.log(`👤 [#${String(index).padStart(2, "0")}] ${persona.name} from ${persona.city} ${willOrder ? "(WILL ORDER)" : ""}`);

  const socket = ioClient(`${BACKEND}/track`, {
    transports: ["websocket"],
    extraHeaders: { Origin: ORIGIN },
    reconnection: false,
    timeout: 5000,
  });

  let connected = false;
  socket.on("connect", () => {
    connected = true;
    console.log(`  ✓ [${persona.name}] connected to /track`);
  });
  socket.on("connect_error", (err) => {
    console.warn(`  ✗ [${persona.name}] connect error:`, err.message);
  });

  // Wait briefly for connection
  await sleep(rand(200, 800));

  // Browse a sequence of pages over the duration
  const startedAt = Date.now();
  const cart = [];

  while (Date.now() - startedAt < DURATION_SEC * 1000) {
    const path = pick(BROWSE_PATHS);
    if (connected) socket.emit("page:view", { path });
    process.stdout.write(`  📄 [${persona.name}] visiting ${path}\n`);

    // Occasionally peek a product
    if (Math.random() < 0.4 && products.length > 0) {
      const p = pick(products);
      if (connected) socket.emit("page:view", { path: `/product/${p.slug}` });
      process.stdout.write(`  👀 [${persona.name}] viewing ${p.name}\n`);

      // Sometimes add to cart
      if (Math.random() < 0.5) {
        cart.push(p);
        if (connected) socket.emit("cart:add", { productId: p.productId, productName: p.name });
        process.stdout.write(`  🛒 [${persona.name}] added "${p.name}" to cart\n`);
      }
    }

    await sleep(rand(2000, 6000));
  }

  // Maybe place an order
  if (willOrder) {
    const itemsToOrder = cart.length > 0 ? cart.slice(0, rand(1, Math.min(3, cart.length))) : [];
    await placeOrder(persona, itemsToOrder);
  }

  await sleep(500);
  socket.disconnect();
  console.log(`👋 [${persona.name}] left the store`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (CLEANUP) {
    await cleanup();
    return;
  }

  console.log(`\n🤖 DVSK Bot Simulator`);
  console.log(`   Backend:  ${BACKEND}`);
  console.log(`   Origin:   ${ORIGIN}`);
  console.log(`   Visitors: ${VISITORS}`);
  console.log(`   Orders:   ${ORDER_COUNT}`);
  console.log(`   Duration: ${DURATION_SEC}s per visitor\n`);

  const products = await fetchProductsAndVariants();
  if (products.length === 0) {
    console.log("⚠️  No in-stock products in the DB — orders will be synthesized without real items.\n");
  } else {
    console.log(`📦 Found ${products.length} in-stock products to browse\n`);
  }

  const orderIndices = new Set();
  while (orderIndices.size < Math.min(ORDER_COUNT, VISITORS)) {
    orderIndices.add(rand(0, VISITORS - 1));
  }

  // Start all bots concurrently with small staggered delays
  const tasks = [];
  for (let i = 0; i < VISITORS; i++) {
    const willOrder = orderIndices.has(i);
    tasks.push(
      (async () => {
        await sleep(i * 400);
        await runBot(i + 1, willOrder, products);
      })()
    );
  }

  await Promise.all(tasks);

  console.log(`\n✅ Simulation complete.`);
  console.log(`   To wipe bot data:  node scripts/bot-test.mjs --cleanup\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
