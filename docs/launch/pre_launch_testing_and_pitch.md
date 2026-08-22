# 🚀 EventOS Pre-Launch Manual Testing Checklist & Sales Pitch Strategy

---

## PART 1: MANUAL TESTING CHECKLIST — "Is It REAL or FAKE?"

> [!IMPORTANT]
> Test every flow end-to-end with **real data**. No mock APIs, no hardcoded responses. If something fails, fix it BEFORE launch.

---

### 🔐 A. Authentication Service (Real User Flow)

| # | Test Case | How to Verify | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | **Register new user** | Go to `/register`, fill real name, email, password | Account created, verification email sent to inbox |
| 2 | **Email verification** | Check real email inbox, click verification link | Email marked verified in DB, redirect to login |
| 3 | **Login** | Use registered email + password | JWT token issued, session created, redirect to dashboard |
| 4 | **Wrong password (3x)** | Enter wrong password 3 times | Account locked temporarily, shows lockout message |
| 5 | **Forgot password** | Click "Forgot Password", enter email | Reset link sent to real email inbox |
| 6 | **Password reset** | Click reset link from email, set new password | Password updated, can login with new password |
| 7 | **Logout** | Click logout from dashboard | Session destroyed, JWT invalidated, redirect to landing |
| 8 | **Session persistence** | Login, close browser, reopen | Still logged in (refresh token works) |
| 9 | **Multi-device login** | Login from phone + laptop simultaneously | Both sessions active, both show in session list |

**Backend Verification:**
```bash
# Check auth-service logs
cd backend && mvn spring-boot:run -pl auth-service

# Verify in H2/Postgres console:
SELECT * FROM users WHERE email = 'your@email.com';
SELECT * FROM sessions WHERE user_id = '<user_id>';
SELECT * FROM refresh_tokens WHERE user_id = '<user_id>';
```

---

### 📋 B. CRM Service (Real Lead → Quote Pipeline)

| # | Test Case | How to Verify | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | **Create new contact** | Dashboard → CRM → Add Contact with real name/phone/email | Contact saved in DB with auto-generated sequence number |
| 2 | **Create lead** | Attach lead to contact, set stage "New Inquiry" | Lead appears in Kanban pipeline |
| 3 | **Move lead through stages** | Drag lead: New → Qualified → Proposal → Won | Stage updates in real-time, audit log created |
| 4 | **Create quote for lead** | Open lead → Create Quote → Add line items | Quote with auto-calculated GST (18%) generated |
| 5 | **Export quote as PDF** | Click "Export PDF" on quote | Real PDF downloads with all line items, totals, GST |
| 6 | **Share quote on WhatsApp** | Click WhatsApp share button | WhatsApp opens with pre-filled quote summary message |
| 7 | **Edit quote** | Change line item quantity/price | Total recalculates instantly, audit log records change |
| 8 | **Delete contact** | Delete a contact | Soft-delete (is_deleted=true), doesn't appear in list |

**Backend Verification:**
```bash
cd backend && mvn spring-boot:run -pl crm-service

# Check DB:
SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5;
SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;
SELECT * FROM quotes WHERE lead_id = '<lead_id>';
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

### 📅 C. Event Service (Real Booking → Timeline)

| # | Test Case | How to Verify | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | **Create new event/booking** | Dashboard → Events → New Booking | Event created with booking ID, date, venue |
| 2 | **Add timeline items** | Add run-of-show entries (sound check, decor, ceremony) | Timeline items saved with time slots |
| 3 | **Conflict detection** | Add two overlapping timeline items | System flags overlap conflict with warning |
| 4 | **Assign vendors** | Attach vendor contacts to timeline items | Vendor linked to event timeline entry |
| 5 | **Billing profile** | Create invoice/milestone for event | Payment milestones created with amounts |

**Backend Verification:**
```bash
cd backend && mvn spring-boot:run -pl event-service

SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
SELECT * FROM timeline_items WHERE booking_id = '<booking_id>';
```

---

### 🖼️ D. Gallery Service (Real Photo Upload → CDN Delivery)

| # | Test Case | How to Verify | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | **Create album** | Dashboard → Gallery → New Album | Album created with title, date |
| 2 | **Upload photos** | Upload 5-10 real high-res JPGs (5MB+ each) | Photos uploaded to Cloudinary/S3, thumbnails generated |
| 3 | **View gallery** | Open album, scroll through photos | Full-res images load from CDN (check Network tab for cloudinary URLs) |
| 4 | **Share gallery link** | Click "Share" → Copy link | Public gallery link works without login |
| 5 | **Passcode protection** | Set passcode on album, share link | Guest must enter passcode before viewing |
| 6 | **Download originals** | Click download on individual photo | Original full-res file downloads (not thumbnail) |

**Backend Verification:**
```bash
cd backend && mvn spring-boot:run -pl gallery-service

SELECT * FROM albums ORDER BY created_at DESC LIMIT 5;
SELECT * FROM gallery_items WHERE album_id = '<album_id>';
# Check that 'url' column has real Cloudinary/S3 signed URLs
```

---

### 🌐 E. Frontend Landing Page (Visual + Functional)

| # | Test Case | How to Verify | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | **Landing page loads** | Open `localhost:3000` | Full page loads < 3 seconds, no console errors |
| 2 | **Navbar smooth scroll** | Click Features, Pricing, Contact | Page scrolls smoothly to correct section |
| 3 | **Dark navbar visibility** | Scroll down 300px+ | Dark glass navbar capsule visible with white text |
| 4 | **Floating dock appears** | Scroll past hero section | FloatingDock appears, Navbar hides (mutual exclusion) |
| 5 | **Mobile hamburger menu** | Resize to 375px width, click hamburger | Full-screen drawer opens with all nav items |
| 6 | **Testimonials scroll** | Scroll to testimonials section | 3 columns moving vertically (2 up, 1 down) |
| 7 | **Quote calculator** | Scroll to calculator, toggle line items | Totals update live with GST calculation |
| 8 | **ROI calculator** | Move sliders, click presets | Numbers recalculate in real-time |
| 9 | **Contact form submit** | Fill all fields, click Submit | Toast shows success, data saved to backend |
| 10 | **Pricing cards** | Check all 3 tiers | MOST POPULAR badge visible, no overflow clipping |
| 11 | **Auth modal** | Click "Get Started" or "Login" | Modal opens with frosted glass overlay |
| 12 | **Mobile responsive** | Test at 320px, 375px, 414px, 768px, 1024px, 1440px | No horizontal scroll, no text overflow at any size |

---

### 🔧 F. Infrastructure & CI/CD

| # | Test Case | How to Verify | Expected Result |
|---|-----------|---------------|-----------------|
| 1 | **Backend builds** | `cd backend && mvn clean install -DskipTests` | BUILD SUCCESS for all 5 modules |
| 2 | **Backend tests pass** | `cd backend && mvn test` | All unit + integration tests green |
| 3 | **JaCoCo report** | `cd backend && mvn jacoco:report` | Coverage HTML report generated (no plugin error) |
| 4 | **Frontend builds** | `cd web && npm run build` | Build completes with no TypeScript errors |
| 5 | **GitHub Actions CI** | Push to main, check Actions tab | All 3 jobs green (Backend Tests, Frontend E2E, Deploy) |
| 6 | **API Gateway routing** | Start all services, hit `/api/auth/login` through gateway | Gateway routes to auth-service correctly |

---

### ✅ G. End-to-End "Golden Path" Test

> [!CAUTION]
> This is the MOST IMPORTANT test. Do this EXACTLY as a real event planner would.

**Complete Flow (15-20 minutes):**

1. Open landing page → Click "Start 14-Day Free Trial"
2. Register with real email → Verify email from inbox
3. Login → Land on dashboard
4. Create a new Contact: "Priya Sharma, 9876543210, priya@wedding.com"
5. Create a Lead: "Sharma-Patel Wedding, ₹12,00,000 budget, December 2026"
6. Move lead to "Proposal Sent" stage
7. Create a Quote with 5 line items → Export PDF → Share on WhatsApp
8. Create an Event Booking for the wedding
9. Add 4 timeline items → Trigger conflict detection
10. Create a Gallery Album → Upload 5 wedding photos
11. Share gallery with passcode → Open in incognito → Enter passcode → View photos
12. Logout → Login again → Verify all data persists

**If ANY step fails → FIX IT before launch. No exceptions.**

---
---

## PART 2: SALES PITCH & DEMO STRATEGY (Hindi-English / Hinglish)

> [!TIP]
> Yeh script tum live demo ke time use kar sakte ho — chahe WhatsApp call pe, Zoom pe, ya in-person meeting mein. Hindi-English mix mein likha hai taaki naturally bol sako.

---

### 🎯 Opening Hook (30 seconds)

**English:**
> "Hi [Name], let me ask you one question — how many different apps and subscriptions are you using right now to manage your events? Most planners we talk to are paying for 4-6 separate tools — a CRM here, an invoice tool there, a gallery platform somewhere else, WhatsApp groups for coordination. EventOS replaces ALL of them with one single platform."

**Hinglish:**
> "Hi [Name], ek question puchta hoon — aap abhi apne events manage karne ke liye kitne alag-alag apps aur subscriptions use kar rahe ho? Jo bhi planner humse baat karta hai, woh 4-6 alag tools pe paisa kharch kar raha hai — CRM alag, invoice alag, gallery platform alag, WhatsApp groups mein coordination. EventOS yeh SAB REPLACE karta hai — ek hi platform mein."

---

### 💡 Problem Statement (1 minute)

**English:**
> "Right now, your workflow probably looks like this:
> - You get a wedding inquiry on WhatsApp
> - You manually type the quote in Excel or Word
> - You send it as a PDF on email
> - You track payments in a different spreadsheet
> - Your photographer shares photos on Google Drive
> - Your timeline is in your head or a WhatsApp group
>
> This is how you're losing 15-20 hours every week. And worse — you're losing leads because follow-ups fall through the cracks."

**Hinglish:**
> "Abhi aapka workflow kuch aisa hota hoga:
> - Wedding inquiry WhatsApp pe aati hai
> - Quote manually Excel ya Word mein type karte ho
> - PDF banake email pe bhejte ho
> - Payments track karne ke liye alag spreadsheet hai
> - Photographer photos Google Drive pe share karta hai
> - Timeline ya toh dimag mein hai ya WhatsApp group mein
>
> Isse aap har hafte 15-20 ghante waste kar rahe ho. Aur usse bhi bura — leads miss ho rahi hain kyunki follow-ups time pe nahi hote."

---

### 🖥️ Live Demo Script (5-7 minutes)

#### Screen 1: Dashboard Overview

**Hinglish:**
> "Yeh hai aapka EventOS dashboard. Jaise hi aap login karte ho, aapko dikhta hai:
> - Kitne active events chal rahe hain
> - Kitne pending quotes hain
> - Kitna revenue collect hua hai is mahine
> - Aaj ke timeline items kya hain
>
> Sab kuch EK jagah. Koi alag app kholne ki zarurat nahi."

#### Screen 2: CRM & Lead Pipeline

**Hinglish:**
> "Ab dekho yeh CRM. Jab bhi koi inquiry aati hai — chahe Instagram se, WhatsApp se, ya website se — aap yahan ek lead bana dete ho.
>
> Yeh Kanban board hai — 'New Inquiry' → 'Site Visit Done' → 'Quote Sent' → 'Negotiation' → 'Won' → 'Lost'.
>
> Lead ko drag-and-drop karke stage change karo. Har movement ka audit log banta hai — matlab aapko pata hai ki kab kya hua.
>
> Sabse important: LEAD SCORE automatically calculate hota hai 0 se 100 tak — based on budget, response time, event date. Hot leads pehle dikhti hain."

#### Screen 3: Smart Quote Generator

**Hinglish:**
> "Ab yeh hai sabse powerful feature. Quote banane mein normally 30-45 minute lagte hain, hai na? Yahan 2 minute mein ho jayega.
>
> Dekho — line items select karo: Stage ₹85,000, Sound ₹45,000, LED Wall ₹60,000, Catering ₹1,200 per guest for 500 guests...
>
> GST 18% AUTOMATICALLY calculate ho gaya. Grand total dikh raha hai.
>
> Ab — EK CLICK mein PDF export karo. Client ko WhatsApp pe share karo. Done.
>
> Promo code bhi lagao — EVENTOS10 type karo — 10% discount automatically apply ho jayega.
>
> Aur suno — jab client WhatsApp pe PDF open karega, aapko notification aayega ki 'Quote viewed by client at 3:45 PM'."

#### Screen 4: Event Timeline & Run-of-Show

**Hinglish:**
> "Ab event ke din ka plan. Yeh run-of-show timeline hai.
>
> 8 AM: Decor setup start
> 11 AM: Sound check
> 2:30 PM: Baraat welcome
> 7:30 PM: Pheras start
>
> Agar sound check aur catering setup ka time overlap ho gaya — toh system AUTOMATICALLY detect karega aur AI suggestion dega: 'Sound check 10:15 AM pe shift karo, zero conflict guaranteed.'
>
> Aur ek button se — sabhi vendors ko WhatsApp pe updated timeline chali jayegi. No more 50 messages in group."

#### Screen 5: Gallery Delivery

**Hinglish:**
> "Wedding ke baad photos deliver karna — yeh sabse tedious kaam hai. Google Drive pe 500 photos upload karo, link share karo, client bole 'loading nahi ho raha'...
>
> EventOS mein — ek album banao, photos upload karo. CDN se serve hota hai — matlab India mein bhi 2-3 seconds mein full-res photo load ho jaati hai.
>
> Client ko ek beautiful gallery link milta hai — passcode protected. Woh apne family ko forward kar sakta hai. Download bhi kar sakta hai.
>
> Aur sabse achi baat — aapka BRAND name dikhta hai gallery pe, Google Drive ka nahi."

#### Screen 6: Pricing — Why EventOS Saves Money

**Hinglish:**
> "Ab sabse important baat — paisa.
>
> Abhi aap kya pay kar rahe ho:
> - HoneyBook: ₹3,200/month
> - HubSpot CRM: ₹7,500/month
> - Pixieset Gallery: ₹2,500/month
> - QuickBooks: ₹2,200/month
> - ClickUp/Notion: ₹1,500/month
>
> **Total: ₹16,900+ per month**
>
> EventOS Professional Plan: **₹5,999/month** — sab kuch included.
>
> Matlab aap ₹10,000+ SAVE kar rahe ho har mahine. Aur ek hi login, ek hi dashboard, ek hi team training.
>
> 14 din FREE trial hai — koi credit card nahi chahiye. Use karo, pasand aaye toh continue karo."

---

### 🛡️ Trust & Objection Handling

#### "Hamara data safe rahega?"

**Hinglish:**
> "Bilkul. Humara system multi-tenant isolated hai — matlab aapka data sirf aapka hai. Koi doosra user access nahi kar sakta. SSL encrypted hai, 99.9% uptime SLA hai. Aapke photos AWS S3 ya Cloudinary pe store hoti hain — same infrastructure jo Netflix aur Spotify use karta hai."

#### "Humari team ko seekhne mein time lagega?"

**Hinglish:**
> "Nahi, bilkul nahi. Interface itna simple hai ki agar aap WhatsApp chala sakte ho, toh EventOS bhi chala sakte ho. Aur hum 15 minute ka FREE onboarding call dete hain — personally setup karwa denge. Agar team mein koi issue aaye, toh WhatsApp support hai 24/7."

#### "Abhi hum Excel se kaam chala lete hain"

**Hinglish:**
> "Main samajh sakta hoon. Lekin socho — agar aapke paas 8 events mahine mein hain, aur har event ke liye 2 ghante quote banane mein lagte hain, 1 ghanta follow-up mein, 30 min timeline coordination mein — toh sirf yahi 28 ghante mahine ke waste ho rahe hain.
>
> EventOS se yeh 28 ghante 4 ghante mein ho jayenge. Baaki 24 ghante mein aap 2-3 NAYE clients le sakte ho. Revenue growth automatic ho jayega."

#### "Competitors se kya alag hai?"

**Hinglish:**
> "HoneyBook sirf Western market ke liye hai — INR billing nahi hai, GST support nahi hai, UPI payment nahi hai. HubSpot bahut expensive hai aur events ke liye designed nahi hai. Pixieset sirf gallery hai — CRM nahi, invoicing nahi. 
>
> EventOS SPECIFICALLY Indian event planners, wedding coordinators, aur production houses ke liye bana hai. GST auto-calculate, INR billing, WhatsApp integration, UPI QR payments — sab kuch built-in."

---

### 🎤 Closing Script

**Hinglish:**
> "Toh [Name], main aapke liye ek 14-day FREE trial setup kar deta hoon. Koi credit card nahi chahiye, koi commitment nahi. 
>
> Aap apna ek real event — jo abhi chal raha hai — usko EventOS mein manage karke dekho. Quote banao, timeline banao, gallery upload karo. 
>
> Agar 14 din mein aapko lagta hai ki yeh kaam ka hai — toh continue karo. Nahi lagta — koi baat nahi, koi charge nahi. 
>
> Lekin main guarantee deta hoon — pehle hafte mein hi aapko difference dikh jayega. Shall I set it up for you right now?"

---

### 📊 Quick Stats to Drop in Conversation

| Stat | Value | Use When |
|------|-------|----------|
| Time saved per event | 14.5 hours | Talking about efficiency |
| Average cost savings | ₹10,000+/month | Price comparison discussion |
| Quote generation time | 2 minutes vs 30-45 min | Demo of quote calculator |
| Photo gallery load time | 2-3 seconds (CDN) | Gallery demo |
| Uptime SLA | 99.9% | Trust/reliability question |
| Data isolation | Schema-based multi-tenant | Security question |
| Free trial | 14 days, no credit card | Closing the conversation |
| GST auto-calculation | 18% built-in | Indian market advantage |
| WhatsApp integration | Quotes, timelines, vendor alerts | Workflow automation |

---

### 📱 Demo Preparation Checklist

Before every demo meeting:

- [ ] Pre-load dashboard with 3-4 sample events with real-looking data
- [ ] Have a pre-built quote ready with 6-8 line items (wedding setup)
- [ ] Upload 5-10 beautiful wedding photos to a gallery album
- [ ] Have the timeline simulator loaded with a Royal Wedding scenario
- [ ] Test the landing page on your phone to show mobile responsiveness
- [ ] Keep WhatsApp Web open to show real-time quote sharing
- [ ] Have the competitor comparison table section bookmarked
- [ ] Prepare screen recording backup in case internet is slow

