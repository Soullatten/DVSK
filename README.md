<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:080808,40:7c3aed,70:ffebab,100:080808&height=240&section=header&text=DVSK&fontSize=110&fontColor=ffebab&animation=fadeIn&fontAlignY=38&desc=Modern%20Indian%20Streetwear%20%C2%B7%20Built%20for%20the%20Syndicate&descSize=15&descAlignY=68&descAlign=50" />

<a href="https://dvsk-alpha.vercel.app">
  <img src="https://readme-typing-svg.demolab.com?font=Cormorant+Garamond&italic=true&size=24&pause=1000&color=FFEBAB&center=true&vCenter=true&width=720&lines=A+cinematic+e-commerce+platform.;Built+from+scratch+for+a+streetwear+brand.;Storefront+%C2%B7+Admin+Desktop+App+%C2%B7+Backend+API." alt="typing-banner" />
</a>

<br /><br />

<a href="https://dvsk-alpha.vercel.app">
  <img src="https://img.shields.io/badge/_LIVE_-DVSK-ffebab?style=for-the-badge&labelColor=080808&logoColor=ffebab" alt="live"/>
</a>
<img src="https://img.shields.io/badge/Status-Production-34d399?style=for-the-badge&labelColor=080808" alt="status"/>
<img src="https://img.shields.io/badge/Made_in-India-fbbf24?style=for-the-badge&labelColor=080808" alt="india"/>

<br /><br />

<img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,nodejs,express,prisma,postgres,firebase,electron,vercel,github&theme=dark" alt="stack-icons" />

</div>

<br />

---

<br />

<div align="center">

### ✦ &nbsp; THE&nbsp;DROP &nbsp; ✦

</div>

DVSK is a luxe Indian streetwear label. **This repo is the entire stack behind it** — open, end-to-end:

> Cinematic page transitions, live order tracking pushed via WebSockets, AI-written marketing emails, and a checkout that drops a pin on the exact entrance of your apartment.

<table>
<tr>
<td width="50%" valign="top">

### ⌗ Storefront
The customer-facing React app. Cream-on-black aesthetic, framer-motion choreography on every route.

**Stack:** React 19 · Vite 8 · TypeScript 5 · Framer Motion · Tailwind 4 · Lenis smooth-scroll

[**Live →**](https://dvsk-alpha.vercel.app)

</td>
<td width="50%" valign="top">

### ⌗ Admin
Electron desktop app. PIN-gated splash + auto-updates from GitHub Releases via `electron-updater`.

**Manages:** orders, shipments, products, customers, broadcast emails, Navya AI assistant.

[**Releases →**](https://github.com/Soullatten/DVSK-Admin-Panel/releases)

</td>
</tr>
</table>

<br />

---

<br />

<div align="center">

### ⌗ &nbsp; INSIDE&nbsp;THE&nbsp;SYNDICATE &nbsp; ⌗

</div>

<details>
<summary><b>&nbsp;✦ &nbsp;Cinematic page transitions</b> &nbsp; — liquid bell-curve wipes between every route</summary>

<br />

Every navigation feels like a movie cut. Two SVG paths morph into a wave that crashes down on exit, then a darker wave rises up to reveal the new page. Content underneath fades in with blur, scale, and 50px lift. Total ~1.2s — feels deliberate, not slow.

```ts
// src/components/PageWrapper.tsx — exit choreography
animate={{
  d: [
    "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z",
    "M 0 60 Q 50 -10 100 60 L 100 100 L 0 100 Z",
    "M 0 0 Q 50 0 100 0 L 100 100 L 0 100 Z",
  ],
  transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
}}
```

</details>

<details>
<summary><b>&nbsp;✦ &nbsp;Live order tracking</b> &nbsp; — customer watches their status change in real-time</summary>

<br />

Admin sets carrier + tracking number on an order. Backend service emits a Socket.IO `order:status:updated` event. Every customer with that order's `/orders/:id` page open gets it via the `/track` namespace and the timeline re-renders to the new step — without a page refresh.

```ts
// backend/src/realtime/events.ts
LiveEvents.orderStatusUpdated({
  orderId, orderNumber, userId,
  status, adminNotes,
});
```

</details>

<details>
<summary><b>&nbsp;✦ &nbsp;Address picker with society autocomplete</b> &nbsp; — Mappls + OpenStreetMap</summary>

<br />

Customer types **"Goyal Intercity C Block"** — the autocomplete actually finds it. (Indian apartment societies aren't in OSM but Mappls has the proprietary data.) Drag the pin to the exact entrance. City / state / pincode auto-fill via reverse geocode. The map ships with branded carrier theme and dark UI.

</details>

<details>
<summary><b>&nbsp;✦ &nbsp;Newsletter subscribers + broadcast composer</b> &nbsp; — admin can email every signup</summary>

<br />

Footer form captures emails into Postgres with the source channel (`"footer"`, `"checkout"`, …). Admin's Subscribers drawer shows them grouped by source with one-click delete. **"Send Broadcast"** button opens a full-screen composer with template picker, live iframe HTML preview, drop-variable inputs (collection name / promo code / promo copy), and a **Navya AI** button that uses Groq's `llama-3.1-8b-instant` to write magnetic subject lines in DVSK's brand voice.

</details>

<details>
<summary><b>&nbsp;✦ &nbsp;Transactional emails that actually render</b> &nbsp; — CID-attached inline images</summary>

<br />

Gmail strips `data:image/jpeg;base64,...` URIs from `<img src>` for security. So we regex-replace every inline data URI in rendered HTML with a unique CID reference (`cid:dvskimg1@dvsk`), extract the base64 to a `Buffer`, and pass them to nodemailer's `attachments` array with `contentDisposition: 'inline'`. Result: `multipart/related` MIME, images render inline in Gmail / Outlook / Apple Mail with no broken-image fallback.

```ts
html = html.replace(/src="data:(image\/[a-z+]+);base64,([^"]+)"/gi,
  (_m, mime, b64) => {
    const cid = `dvskimg${++cidCounter}@dvsk`;
    cidAttachments.push({
      content: Buffer.from(b64, "base64"),
      cid, contentType: mime,
      contentDisposition: "inline",
    });
    return `src="cid:${cid}"`;
  });
```

</details>

<details>
<summary><b>&nbsp;✦ &nbsp;Cinematic order confirmation</b> &nbsp; — animated reveal after checkout</summary>

<br />

Cream radial supernova explodes from center · 14 particles burst outward in a perfect circle · halo ring pulses 1× → 3× and fades · SVG checkmark draws inside a stroked ring · italic *"Order Confirmed"* reveals on stagger · cream pill with order # · two CTAs slide up. Personalised by first name + payment method. Total ~2s, sized to feel like a victory beat without ever feeling slow.

</details>

<details>
<summary><b>&nbsp;✦ &nbsp;Real admin desktop app</b> &nbsp; — not a web dashboard</summary>

<br />

Electron 41 + electron-builder. PIN-gated splash screen with a `<video>` background and intro audio. Auto-update via `electron-updater` polling GitHub Releases — every new admin version ships as a delta-updated NSIS installer. Inside: real-time customer DB, KPI cards with sparklines, a global "Live Activity Feed" that streams visitor pulses from the storefront, Shipments page with carrier deep-linking, and Navya AI for writing emails in your brand voice.

</details>

<br />

---

<br />

<div align="center">

### ⌗ &nbsp; STACK &nbsp; ⌗

</div>

<table>
<tr><th align="left" width="20%">Layer</th><th align="left">Tech</th></tr>
<tr><td><b>Frontend</b></td><td>React 19 · Vite 8 · TypeScript 5 · Framer Motion · Tailwind 4 · Lenis · React Router 7</td></tr>
<tr><td><b>Backend</b></td><td>Express 5 · Prisma 6 · PostgreSQL (Neon) · Socket.IO · Zod · Handlebars</td></tr>
<tr><td><b>Auth</b></td><td>Firebase (Google + Phone OTP + Email/Password) · Firebase Admin SDK for token verify</td></tr>
<tr><td><b>Storage</b></td><td>Cloudinary (product images, optimised + CDN-served)</td></tr>
<tr><td><b>Payments</b></td><td>Razorpay (Cards / UPI / Net Banking / Wallet) + Cash on Delivery</td></tr>
<tr><td><b>Maps</b></td><td>Mappls (MapmyIndia) for India coverage · OpenStreetMap fallback</td></tr>
<tr><td><b>AI</b></td><td>Groq <code>llama-3.1-8b-instant</code> — Navya, the brand's in-house assistant</td></tr>
<tr><td><b>Email</b></td><td>Nodemailer + Gmail SMTP · Handlebars templates · CID-inline images</td></tr>
<tr><td><b>Hosting</b></td><td>Vercel (storefront) · Render (backend + WebSocket) · Neon (Postgres) · GitHub Releases (admin auto-update)</td></tr>
<tr><td><b>Admin shell</b></td><td>Electron 41 · electron-builder · NSIS installer · electron-updater</td></tr>
</table>

<br />

---

<br />

<div align="center">

### ⌗ &nbsp; ARCHITECTURE &nbsp; ⌗

</div>

```
                          ┌─────────────────────────┐
                          │  STOREFRONT  (Vercel)   │
                          │  React + Vite + Lenis   │
                          │  dvsk-alpha.vercel.app  │
                          └──────────┬──────────────┘
                                     │ HTTPS + WSS
                                     ▼
   ┌──────────────────┐     ┌────────────────────────┐
   │  ADMIN  (local)  │────▶│  BACKEND  (Render)     │
   │  Electron app    │     │  Express + Prisma      │
   │  PIN + autoupdate│     │  Socket.IO realtime    │
   └──────────────────┘     │  dvsk-backend.render   │
                            └────────┬───────────────┘
                                     │
              ┌────────┬──────────┬──┴────────┬────────────┬──────────┐
              ▼        ▼          ▼           ▼            ▼          ▼
        ┌────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
        │  Neon  │ │ Cloud-  │ │Razorpay│ │Firebase │ │ Mappls │ │  Groq  │
        │Postgres│ │ inary   │ │        │ │  Auth   │ │  Maps  │ │  LLM   │
        └────────┘ └─────────┘ └────────┘ └─────────┘ └────────┘ └────────┘
```

<br />

---

<br />

<div align="center">

### ⌗ &nbsp; ROUTES &nbsp; ⌗

</div>

```
  /                  — Home with cinematic scroll story
  /men               — Menswear grid + filters
  /women             — Womenswear grid + filters
  /accessories       — Accessories
  /campaigns         — Editorial campaigns
  /product/:slug     — Detail page with gallery + size picker
  /checkout          — Razorpay + COD with map address picker
  /orders            — Customer order history
  /orders/:id        — Live tracking timeline (real-time updates)
  /my-account        — Profile · stats · addresses · recent orders
  /account           — Login (Google + Phone OTP + Email)
```

<br />

---

<br />

<div align="center">

### ⌗ &nbsp; RUN&nbsp;LOCALLY &nbsp; ⌗

</div>

```bash
# 1. Backend
cd backend
cp .env.example .env          # fill DATABASE_URL, FIREBASE_*, RAZORPAY_*, CLOUDINARY_*, etc.
npm install
npx prisma migrate dev
npm run dev                    # → http://localhost:5000

# 2. Storefront (separate terminal)
cd ..
npm install
npm run dev                    # → http://localhost:5173

# 3. Admin (separate terminal — optional, only if managing the store)
cd ../dvsk-admin
npm install
npm run electron:dev           # → Electron window connects to localhost:5000
```

<br />

---

<br />

<div align="center">

### ⌗ &nbsp; CREDITS &nbsp; ⌗

<br />

Designed and built by [**@Soullatten**](https://github.com/Soullatten)

*"The Syndicate moves quietly."*

<br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ffebab,50:7c3aed,100:080808&height=120&section=footer" />

</div>
