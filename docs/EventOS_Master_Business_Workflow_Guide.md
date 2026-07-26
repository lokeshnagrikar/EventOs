# 🚀 EventOS — Real-World Business Workflow Guide (Hinglish + Technical Specs)

> **Document Type:** Business Blueprint & Owner Operational Guide  
> **Language:** Hinglish + English  
> **Target Audience:** Agency Owners, Event Planners, Photographers, Production Houses, Decorators, Clients  

---

## 1. Lead (लीड) Kya Hoti Hai?

### 💡 Simple Definition:
Lead matlab jo person ya company tumse event karwane ke liye contact karti hai, lekin abhi customer nahi bani hai. Ye sirf interested hai.

### 📌 EventOS Real Example:
Rahul Patil ki shaadi hai. Usne Google pe search kiya **"Best Wedding Planner in Udaipur"**. Tumhari EventOS website landing page open hui. Usne enquiry form fill kiya:
- **Name:** Rahul Patil
- **Phone:** `98xxxxxxx`
- **Event Type:** Destination Wedding
- **Budget:** ₹22,00,000
- **Wedding Date:** 12 December 2026
- **Venue:** The Leela Palace, Udaipur

Ab Rahul tumhari **Lead** hai. Abhi usne paise nahi diye hain, abhi booking nahi hui hai.

```
Visitor ➔ Lead ➔ Phone Call ➔ Meeting ➔ Quote/Proposal ➔ E-Sign ➔ Advance Payment ➔ Confirmed Booking
```

### 💻 EventOS Technical Route: `/crm`
EventOS ke CRM dashboard mein ye Lead automatic capture hokar card ke roop mein dikhti hai:
```json
{
  "leadId": "lead_104",
  "clientName": "Rahul Patil",
  "status": "NEW_INQUIRY",
  "source": "WEBSITE_FORM",
  "estimatedBudget": 2200000,
  "eventDate": "2026-12-12"
}
```

---

## 2. CRM (Customer Relationship Management) Kya Hai?

### 💡 Simple Definition:
CRM ek central dashboard hai jahan tumhari sabhi leads ek jagah manage hoti hain. Isme **Kanban Board** hota hai jisse tum lead ki stage drag-and-drop karke update kar sakte ho.

```
[New Inquiry] ➔ [Requirement Audit] ➔ [Meeting Scheduled] ➔ [Proposal Sent] ➔ [Negotiation] ➔ [Won & Booked]
```

### 💻 EventOS Technical Route: `/crm`
- **Visual Kanban Tiers:** Leads, Quotes, Invoices, and Active Events.
- **Automated WhatsApp Alerts:** Jaise hi lead status `Proposal Sent` hoti hai, client ke WhatsApp pe automatic green-tick message chala jata hai!

---

## 3. Quote (Quotation) Kya Hai?

### 💡 Simple Definition:
Lead jab tumse poochti hai *"Kitna charge loge?"*, tab tum Quote bhejte ho. Quote matlab **Estimated Price List**.

### 📌 EventOS Real Quote Example (Quote # `QT-2026-089`):
| Service Item | Category | Qty | Unit Price | Total |
| :--- | :--- | :---: | :---: | :---: |
| **3-Day Wedding Planning & Logistics** | Management | 1 | ₹2,00,000 | ₹2,00,000 |
| **Floral Scenography & Mandap Decor** | Decor | 1 | ₹1,80,000 | ₹1,80,000 |
| **JBL Line Array Sound & Pyrotechnics** | Sound/Stage | 1 | ₹86,101 | ₹86,101 |
| **GST Tax (18%)** | Tax | 1 | ₹83,899 | ₹83,899 |
| **TOTAL ESTIMATED QUOTE** | — | — | — | **₹5,50,000** |

### 💻 EventOS Technical Route: `/quotes`
EventOS owner dashboard se 1-click mein GST calculator ke sath itemized quote generate kar deta hai.

---

## 4. Proposal (Interactive Web & E-Sign) Kya Hai?

### 💡 Simple Definition:
Proposal sirf price nahi hota. Proposal ek professional **Interactive Presentation Document** hota hai. Isme hota hai:
1. Company Introduction & Past Work Showcase
2. 3D Moodboard Renderings & Service Details
3. Itemized Pricing & Tax Breakdown
4. Terms & Conditions
5. **Digital Canvas Signature Pad** (Client phone/laptop screen pe hi sign kar sakta hai!)

### 📌 Client Flow:
Client ko secure link milta hai: `https://eventos.app/quotes/share/tok_928173`.  
Client web page par proposal dekhta hai, **Draw Signature** par apna digital signature karta hai aur **Approve Proposal** daba deta hai!

---

## 5. Booking Kya Hai?

### 💡 Simple Definition:
Jab Client:
1. ✔ Quote & Proposal Accept kar leta hai
2. ✔ Digital Signature e-sign kar deta hai
3. ✔ Advance Deposit Payment (e.g. 30% Retainer) pay kar deta hai

Tab Event **Officially Booked** ho jata hai!

---

## 6. Event Kya Hai?

### 💡 Simple Definition:
Event matlab actual function jo tum execute karne wale ho (e.g. Destination Wedding, Corporate Summit, Music Concert, Birthday, Sangeet, Mehendi, Reception).

### 📌 Real Event Object Example:
- **Event Name:** Royal Palace Destination Wedding — Sangeet & Main Pheras
- **Event Date:** 12 December 2026
- **Venue:** The Leela Palace, Udaipur
- **Guest Count:** 700 Guests
- **Contract Value:** ₹22,00,000
- **Assigned Coordinator:** Sneha Rao

### 💻 EventOS Technical Route: `/events` & `/events/[id]`

---

## 7. Timeline (Run-of-Show & AI Conflict Resolver) Kya Hai?

### 💡 Simple Definition:
Timeline matlab **Poore Event Ka Minute-by-Minute Schedule**. EventOS mein **AI Conflict Resolver** hai jo vendor clashes ko automatic detect karke alert deta hai.

### 📌 Real Indian Wedding Timeline Schedule:
```
10:00 AM ➔ Hotel Ingress & Guest Welcome Kits
12:00 PM ➔ Poolside Haldi & Dhol Crew Setup
03:00 PM ➔ Sangeet Stage JBL Line Array Sound Check
05:30 PM ➔ Pyrotechnics & Sparkler Safety Clearance
07:30 PM ➔ Baraat Ingress & Royal Groom Procession
09:00 PM ➔ Main Pheras & Wedding Ceremony (Royal Mandap)
```

### 💻 EventOS Technical Route: `/timeline` & `/portal/timeline`
Sabhi staff members, decorators, photographers, aur client live mobile timeline update dekh sakte hain.

---

## 8. Invoice Kya Hai?

### 💡 Simple Definition:
Quote estimate tha. **Invoice actual legal bill/statement hota hai.**

### 📌 Milestone Billing Example:
1. **Invoice #1 (`INV-2026-001`):** Advance Retainer Deposit — ₹1,50,000 (Status: `PAID`)
2. **Invoice #2 (`INV-2026-002`):** Stage Scenography Clearance — ₹2,50,000 (Status: `DUE`)
3. **Invoice #3 (`INV-2026-003`):** Final Media Release Balance — ₹1,50,000 (Status: `SENT`)

### 💻 EventOS Technical Route: `/invoices` & `/portal/invoices`

---

## 9. Payment (0% Platform Fee Direct UPI Settlement) Kya Hai?

### 💡 Simple Definition:
Invoice ke baad client paise pay karta hai. EventOS ki khaas baat ye hai ki **0% Platform Commission** lagta hai. Client ka sara paisa **seedhe Agency Owner ke Bank Account** mein jata hai!

### 📌 Real UPI Payment Flow:
1. Owner Settings mein VPA daalta hai: `agencyowner@upi`
2. Client Portal par **Pay Now** par click karta hai.
3. Live NPCI UPI QR Code generate hota hai (`DynamicUpiQrModal.tsx`).
4. Client Google Pay, PhonePe, ya Paytm se QR scan karke ₹1,50,000 transfer kar deta hai.
5. Client UTR reference (`UPI/619283719283/GPay`) daalta hai aur payment instant receipt ban jata hai!

---

## 10. Vendor Management Kya Hai?

### 💡 Simple Definition:
Vendor matlab jo tumhare event ke liye specialized service provide karte hain:
- Photographers & Videographers (Drone Reels)
- Decorators & Florists
- Sound & Lighting Crew (JBL Line Array)
- Caterers & Food Vendors
- DJ & Artists (Baraat Dhol)
- Makeup Artists

### 💻 EventOS Technical Route: `/vendors`
EventOS owner ko vendor contracts, payout ledgers, aur instant WhatsApp timeline broadcast dispatch karne ki facility deta hai.

---

## 11. Client Portal Kya Hai?

### 💡 Simple Definition:
Client Portal ek **Private Client Dashboard** hai jahan bride/groom ya corporate client login karke apne event ki har ek detail dekh sakte hain:
- Active Event Days Countdown Ticker (`24 Days Left`)
- Live Booking Journey Stage Bar (`Stage 4: Planning - 65% Completed`)
- Approved Quotes & Signed Proposals
- Pending Invoices & Direct UPI Payment QR
- Run-of-Show Event Schedule
- 4K Photo/Video Gallery

### 💻 EventOS Technical Route: `/portal`

---

## 12. Media Gallery & Proofing (`/portal/gallery`) Kya Hai?

### 💡 Simple Definition:
Event khatam hone ke baad 4K photography, drone videos, aur wedding highlights deliver karne ka secure platform.

### 📌 Key Features:
- 🔒 **4-Digit PIN Passcode Unlock:** Client passcode (`1234`) daalkar album unlock karta hai.
- 🖼️ **Pinterest Masonry Grid:** EXIF camera metadata aur 4K video player.
- ❤️ **Client Favorites:** Client favorite photos pe heart karta hai photo-book print ke liye.
- 💬 **Photo Comments:** Single photo pe comment kar sakta hai (e.g. *"Edit background lighting"*).
- 📦 **1-Click ZIP Download:** Complete album ka high-resolution ZIP archive download kar sakta hai.

---

## 🔄 Complete Business Workflow (EventOS End-to-End)

```
       🌐 Website / WhatsApp / Instagram Lead Ingress
                           │
                           ▼
                 🟣 Lead Created (/crm)
                           │
                           ▼
                 📞 Call & Requirement Audit
                           │
                           ▼
          💰 Interactive Web Proposal Sent (/quotes)
                           │
                           ▼
             ✍️ Digital Canvas E-Sign Approval
                           │
                           ▼
      💳 0% Direct UPI Settlement Payment (/invoices)
                           │
                           ▼
            🎉 Booking Confirmed (Status: WON)
                           │
                           ▼
         📅 AI Run-of-Show Timeline (/timeline)
                           │
                           ▼
           👥 Vendor & Staff Assignment (/vendors)
                           │
                           ▼
              🎊 Live Event Execution
                           │
                           ▼
      📸 4K Media Upload (AdvancedUploader)
                           │
                           ▼
    🔐 Client Portal Gallery Delivery (/portal/gallery)
                           │
                           ▼
      💵 Final Milestone Payment & Tax Receipt
                           │
                           ▼
            ⭐ Client Review & Referral
```

---

### 💡 Executive Summary for Agency Owners:
EventOS is designed to cover the entire real-world lifecycle of an Event Business. From lead capture to direct UPI money settlement and 4K album delivery, every step is automated, secure, and professional!
