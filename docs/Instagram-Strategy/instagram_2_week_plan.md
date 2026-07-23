# Instagram 14-Day Daily Script Roadmap (solo.founder.ai)

This file contains a complete, day-by-day roadmap with **14 unique video scripts** for your Instagram reels. It covers frontend design, backend security, business workflows, and deployment behind **EventOS**.

---

## 📅 WEEK 1: UI AESTHETICS & FRONTEND LOGIC

### 🎬 Day 1 (Monday): The Scroll Morphing Navbar
* **Visual:** Scroll the landing page. Watch the full navbar transition smoothly into a centered Apple capsule with frosted glass.
* **On-Screen Text:** "Coding an Apple-style morphing navbar in Next.js"
* **Word-for-Word Script:**
  > *"I wanted the navigation on my SaaS to feel like macOS. So I coded a custom container that listens to scroll offsets. At the top, it's a wide glass banner. Once you scroll past 50 pixels, it morphs into a compact floating capsule. I used Tailwind's backdrop-blur-2xl and a transition duration of 700ms with a custom cubic-bezier. Code config is in my bio link!"*

### 🎬 Day 2 (Tuesday): Cursor-Following Spotlight Glow
* **Visual:** Move the mouse cursor across bento grid cards. Show the radial neon gradient following the cursor's exact coordinates.
* **On-Screen Text:** "This UI hover effect took me 3 hours to perfect."
* **Word-for-Word Script:**
  > *"Instead of static hover shadows, I wanted my bento cards to react to the cursor. I wrote a React hook that tracks the mouse client X and Y relative to the card. It calculates the offset and updates a CSS radial gradient mask dynamically. The border lights up only where your mouse is pointing. Simple math, premium UI."*

### 🎬 Day 3 (Wednesday): Interactive CRM Kanban Board
* **Visual:** Drag a client card from "Lead Received" to "Booking Confirmed" on your CRM dashboard.
* **On-Screen Text:** "How event planners manage booking pipelines."
* **Word-for-Word Script:**
  > *"Event planners usually waste hours on emails and sticky notes. I built a dynamic Kanban board using React DnD. You can organize sales milestones, drag client bookings, and track estimated budgets instantly. Behind the scenes, the UI updates the state and syncs with the database. Smooth, visual, and fast."*

### 🎬 Day 4 (Thursday): The Statistics Counter Row
* **Visual:** Load the hero section and zoom in on the counter statistics (e.g., 10,000+ Events) counting up dynamically from 0.
* **On-Screen Text:** "Adding live statistics tickers to my UI."
* **Word-for-Word Script:**
  > *"A static number looks boring. To make the dashboard feel alive, I coded an interactive counter component. It runs a spring animation using Framer Motion that ticks the values up as soon as they enter the user's viewport. It supports prefixes like the Rupee symbol and custom speeds. It’s all about the micro-interactions."*

### 🎬 Day 5 (Friday): Glassmorphic FAQ Accordion
* **Visual:** Click on accordion questions. Watch the smooth height expansion and the frosted glass background reflecting the underglow.
* **On-Screen Text:** "Upgrading standard elements into glassmorphism."
* **Word-for-Word Script:**
  > *"Even simple FAQs deserve to look premium. I replaced the standard accordion panel with a transparent container. It uses a backdrop-blur of 40px and a very light white border to mimic frosted glass. The background gradients bleed through the panel, creating depth. Design is in the details."*

### 🎬 Day 6 (Saturday): Developer Workspace & Desk Setup
* **Visual:** A aesthetic desk setup showing VS Code, IntelliJ, Postman, and a coffee cup.
* **On-Screen Text:** "Coding a microservices SaaS from my desk."
* **Word-for-Word Script:**
  > *"This is where I build my SaaS. I use Next.js for client interfaces, Spring Boot for backend microservices, and PostgreSQL for isolated databases. Building in public is a journey of solving small bugs every day. Comment 'STACK' and I'll send you my complete list of VS Code extensions!"*

### 🎬 Day 7 (Sunday): Weekly Progress Summary
* **Visual:** Screen recordings of all Week 1 UI upgrades playing side-by-side or in fast sequence.
* **On-Screen Text:** "Week 1: Visuals & layout completed."
* **Word-for-Word Script:**
  > *"Week 1 of shipping my SaaS is officially done. We completed the Apple-style capsule navbar, upgraded all cards to frosted glass, and finalized the CRM kanban board. Next week, we dive into backend security, database schema isolation, and automated payment triggers. Drop a follow to watch it happen!"*

---

## 📅 WEEK 2: BACKEND, DATABASE SECURITY & BUSINESS LOGIC

### 🎬 Day 8 (Monday): Database Schema Isolation per Tenant
* **Visual:** IntelliJ code showing PostgreSQL schema queries and separate database tables.
* **On-Screen Text:** "How to secure tenant data in B2B SaaS."
* **Word-for-Word Script:**
  > *"In a multi-tenant SaaS, client security is priority number one. A planner from Agency A must never see data from Agency B. I solved this by using a schema-per-tenant architecture in PostgreSQL. When an API request comes in, a custom Hibernate Tenant Resolver determines the client tenant ID and dynamically routes the query to their isolated database schema. Enterprise-grade security, built from scratch."*

### 🎬 Day 9 (Tuesday): Spring Security & JWT Authorization
* **Visual:** Postman window showing a request getting a 403 Forbidden error, then adding a Bearer token and getting 200 OK.
* **On-Screen Text:** "How I secure API endpoints in Java."
* **Word-for-Word Script:**
  > *"Securing microservice endpoints can be tricky. I wired up Spring Security with JWT tokens. When a user logs in, the Auth microservice generates a signed token. The API gateway validates this token, checks user roles like OWNER or CLIENT, and blocks unauthorized attempts. No token, no access. Simple as that."*

### 🎬 Day 10 (Wednesday): Dynamic Invoice PDF Generation (INR)
* **Visual:** Click "Generate Invoice" and show a styled receipt PDF displaying the Rupee (`₹`) symbol and a GST tax breakdown.
* **On-Screen Text:** "Automating GST invoices in India."
* **Word-for-Word Script:**
  > *"Instead of planners manually calculating tax and typing invoices, I automated the entire process. The system takes the booking milestone, calculates the 18% GST dynamically, formats the total in Indian Rupees, and generates a print-ready PDF invoice. It saves agencies hours of paperwork every single week."*

### 🎬 Day 11 (Thursday): UPI QR Code Payments Setup
* **Visual:** Client portal displaying an agency's custom QR Code. Scan it with a test mobile device.
* **On-Screen Text:** "Integrating UPI QR payments in SaaS."
* **Word-for-Word Script:**
  > *"Credit cards charge a 2-3% transaction fee, which is huge for wedding planners. So I integrated a hybrid payment flow. Agencies can upload their custom UPI QR Codes. On the client portal, the client scans the QR, pays with GPay or Paytm, and uploads the UTR reference. The planner receives an instant alert to approve the receipt. Zero fees, maximum convenience."*

### 🎬 Day 12 (Friday): WebSockets Real-Time Sync
* **Visual:** Tap "Sign Proposal" on a phone (client view) and watch the desktop pipeline screen instantly update to "Confirmed" without refreshing.
* **On-Screen Text:** "Adding real-time WebSockets to my React app."
* **Word-for-Word Script:**
  > *"I wanted the platform to react instantly when clients sign proposals. I set up a WebSocket channel using Spring MessageBroker. When a client signs, a message is broadcasted, and the agency dashboard updates in milliseconds without any page reload. Real-time synchronization keeps teams aligned instantly."*

### 🎬 Day 13 (Saturday): Containerizing with Docker & Cloud Deploy
* **Visual:** Terminal running `docker-compose up` and showing active status on cloud dashboards.
* **On-Screen Text:** "Deploying Next.js & Java to production."
* **Word-for-Word Script:**
  > *"To ensure the SaaS runs exactly the same in production as on my machine, I containerized the services using Docker. The Next.js frontend is deployed on Vercel for fast loading speeds, and the Spring Boot jar files run on cloud containers. Everything is monitored and scale-ready. We are ready to go live!"*

### 🎬 Day 14 (Sunday): The Launch & Business Pitch
* **Visual:** Show the landing page, then the pricing section, and click "Start Free Trial".
* **On-Screen Text:** "My SaaS is officially live! 🚀"
* **Word-for-Word Script:**
  > *"After weeks of coding, EventOS is live. It’s a unified workspace built for event planners to manage leads, sign quotes, collect UPI payments, and deliver galleries. If you are an agency owner looking to save time and look more professional, try the 14-day free trial. Link is in my bio!"*
