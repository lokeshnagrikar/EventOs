# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should handle successful login flow, save session state, and redirect to switcher
- Location: web\tests\integration\auth-and-dashboard.spec.ts:42:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to 3 elements. Proceeding with the first one: <button type="submit" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-purple-600/30 border border-purple-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">Welcome to EventOS!</h1> from <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="absolute inset-0 bg-black/85 backdrop-blur-md"></div> from <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="absolute inset-0 bg-black/85 backdrop-blur-md"></div> from <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic:
      - banner:
        - generic [ref=e5]:
          - generic "EventOS Home" [ref=e6] [cursor=pointer]:
            - img "EO" [ref=e7]
            - generic [ref=e9]:
              - heading "Event OS" [level=1] [ref=e10]:
                - text: Event
                - generic [ref=e11]: OS
              - generic: MANAGE. ENGAGE. ELEVATE.
          - navigation "Main Navigation" [ref=e12]:
            - link "Features" [ref=e13] [cursor=pointer]:
              - /url: "#features"
            - button "Solutions" [ref=e15] [cursor=pointer]:
              - text: Solutions
              - img [ref=e16]
            - link "Pricing" [ref=e18] [cursor=pointer]:
              - /url: "#pricing"
            - button "Resources" [ref=e20] [cursor=pointer]:
              - text: Resources
              - img [ref=e21]
          - generic [ref=e23]:
            - button "Live Demo" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
              - text: Live Demo
            - button "Login" [ref=e28] [cursor=pointer]
            - button "Get Started" [ref=e29] [cursor=pointer]:
              - generic: Get Started
      - main:
        - generic:
          - generic:
            - generic:
              - generic:
                - img
                - generic: "The #1 All-in-One AI Operating System for Event Businesses"
              - generic:
                - heading "Plan. Automate. Scale Events. From Lead to Invoice." [level=1]:
                  - generic: Plan. Automate.
                  - generic: Scale Events.
                  - generic:
                    - generic: From Lead to Invoice.
                - paragraph: The complete operating system for independent event coordinators and boutique agencies. Automate WhatsApp triggers, AI run-of-show timelines, mobile offline PWA check-ins, white-label client portals, and milestone invoicing.
              - generic:
                - button "Start 14-Day Free Trial":
                  - generic:
                    - text: Start 14-Day Free Trial
                    - img
                - button "Book a Demo":
                  - generic:
                    - img
                    - text: Book a Demo
              - generic:
                - generic:
                  - img
                  - text: SSL Encrypted
                - generic:
                  - img
                  - text: Tenant Isolated
                - generic:
                  - img
                  - text: 99.9% Uptime SLA
                - generic:
                  - img
                  - text: No Credit Card Required
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic:
                    - generic: AI Auto-Scheduler
                    - generic: 09:00 AM · Sound Check Approved
                - generic:
                  - generic:
                    - img
                  - generic:
                    - generic: Milestone Invoice
                    - generic: ₹12,50,000 Deposit Cleared ✓
                - generic:
                  - generic:
                    - img
                  - generic:
                    - generic: WhatsApp Automation
                    - generic: RSVP Confirmed & Directions Sent
                - generic:
                  - generic:
                    - img
                  - generic:
                    - generic: Offline PWA Venue Check-In
                    - generic: 1,250 Venue Guests Scanned
                - generic:
                  - generic:
                    - generic:
                      - generic: admin.eventos.io/dashboard
                    - generic:
                      - img
                      - generic: "Tenant Isolation: active"
                  - generic:
                    - generic:
                      - generic:
                        - generic: E
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - img
                      - generic:
                        - generic: U
                    - generic:
                      - generic:
                        - generic:
                          - text: Workspace Dashboard
                          - heading "Event Command Center" [level=4]
                        - generic:
                          - generic: Q
                          - generic: B
                          - generic: I
                      - generic:
                        - generic:
                          - generic: Lead Conversion Pipeline
                          - generic:
                            - generic: 84.2%
                            - generic: ↑ +4.2% vs last month
                        - generic:
                          - generic: Active Event Bookings
                          - generic:
                            - generic: 142 Projects
                            - generic: 32 Weddings · 110 Corporate
                        - generic:
                          - generic: Projected Revenue
                          - generic:
                            - generic: ₹8.4M
                            - generic: "Invoiced cleared: ₹7.2M"
                      - generic:
                        - generic:
                          - generic: "Live Status:"
                          - generic: "Quote #QT-2026-041 accepted by client (Sanjay Shah)"
                        - generic: View Pipeline →
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: 0+
                        - heading "Events Managed" [level=5]
                        - paragraph: Weddings, galas & corporate events
                      - generic:
                        - img
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: ₹0Cr+
                        - heading "Revenue Processed" [level=5]
                        - paragraph: Across all tenant workspaces
                      - generic:
                        - img
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: 0%
                        - heading "Client Satisfaction" [level=5]
                        - paragraph: Outstanding NPS index globally
                      - generic:
                        - img
        - generic:
          - generic:
            - paragraph: Trusted by high-end planners, luxury wedding agencies, and production teams globally
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Vogue Weddings
                - generic:
                  - generic:
                    - img
                  - generic: Apex Productions
                - generic:
                  - generic:
                    - img
                  - generic: Echo Planners
                - generic:
                  - generic:
                    - img
                  - generic: Horizon Galas
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Vogue Weddings
                - generic:
                  - generic:
                    - img
                  - generic: Apex Productions
                - generic:
                  - generic:
                    - img
                  - generic: Echo Planners
                - generic:
                  - generic:
                    - img
                  - generic: Horizon Galas
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Vogue Weddings
                - generic:
                  - generic:
                    - img
                  - generic: Apex Productions
                - generic:
                  - generic:
                    - img
                  - generic: Echo Planners
                - generic:
                  - generic:
                    - img
                  - generic: Horizon Galas
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Vogue Weddings
                - generic:
                  - generic:
                    - img
                  - generic: Apex Productions
                - generic:
                  - generic:
                    - img
                  - generic: Echo Planners
                - generic:
                  - generic:
                    - img
                  - generic: Horizon Galas
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
            - generic:
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
                - generic:
                  - generic: Bloom Event Co.
                - generic:
                  - generic:
                    - img
                  - generic: Summit Occasions
                - generic:
                  - generic:
                    - img
                  - generic: Prestige Soirees
                - generic:
                  - generic: Elara Weddings
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
                - generic:
                  - generic: Bloom Event Co.
                - generic:
                  - generic:
                    - img
                  - generic: Summit Occasions
                - generic:
                  - generic:
                    - img
                  - generic: Prestige Soirees
                - generic:
                  - generic: Elara Weddings
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
                - generic:
                  - generic: Bloom Event Co.
                - generic:
                  - generic:
                    - img
                  - generic: Summit Occasions
                - generic:
                  - generic:
                    - img
                  - generic: Prestige Soirees
                - generic:
                  - generic: Elara Weddings
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic: Starlight Agency
                - generic:
                  - generic:
                    - img
                  - generic: Nova Premium Events
                - generic:
                  - generic: Bloom Event Co.
                - generic:
                  - generic:
                    - img
                  - generic: Summit Occasions
                - generic:
                  - generic:
                    - img
                  - generic: Prestige Soirees
                - generic:
                  - generic: Elara Weddings
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: End-to-End Operating System
                - heading "Everything your agency needs, in one workspace." [level=2]
                - paragraph: Stop stitching together 6 different subscriptions. EventOS brings leads, proposals, timelines, invoices, client portals, and secure gallery sharing into a single tenant database.
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: AI Automation
                      - generic:
                        - heading "AI Co-pilot & Auto Scheduler" [level=3]
                        - paragraph: AI algorithm that builds optimal vendor & timeline schedules without overlapping venue slots. Automatically resolves run-of-show sound checks and ingress conflicts.
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: Branding
                      - generic:
                        - heading "White-Label Client Portals" [level=3]
                        - paragraph: Custom domains (events.yourbrand.com), custom logos, favicons, and tenant color themes. Give clients an enterprise-branded experience.
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: Offline PWA
                      - generic:
                        - heading "Mobile Offline Check-In PWA" [level=3]
                        - paragraph: Seamless guest check-in for remote banquet lawns and basement venues with zero internet connectivity. Background sync flushes automatically once reconnected.
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: Messaging
                      - generic:
                        - heading "Automated WhatsApp & SMS Triggers" [level=3]
                        - paragraph: Send automated updates for RSVP confirmations, invoice payment due dates, milestone clearance reminders, and venue direction links.
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: Quotes
                      - generic:
                        - heading "AI Proposal & Quote Generator" [level=3]
                        - paragraph: Generate custom branded web & PDF proposals from client briefs in under 30 seconds with line-item scope breakdowns and digital signature clearing.
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: Media Delivery
                      - generic:
                        - heading "Gallery & Media Delivery" [level=3]
                        - paragraph: Upload high-resolution event media. Deliver secure passcode-protected albums with custom download permissions and expiry links.
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic: Predictive Intelligence
                      - generic:
                        - heading "AI Lead Scoring & Churn Predictor" [level=3]
                        - paragraph: Intelligently predicts lead conversion likelihood (0-100), flags high-risk client cancellations before they happen, and triggers 1-click retention workflows.
                      - generic:
                        - generic: Auto-tracked
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: Complete Module Suite
                - heading "Six integrated modules. One unified workspace." [level=2]
                - paragraph: Every EventOS module talks to the others. A lead becomes a quote becomes a booking becomes an invoice becomes a gallery — automatically.
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "CRM & Lead Pipeline" [level=3]
                            - text: Acquisition
                      - paragraph: Visual Kanban board. Track leads, budgets, and conversion stages in real time.
                      - generic:
                        - generic:
                          - generic:
                            - generic: Inquiries
                            - generic: "8"
                          - generic:
                            - generic: Proposal Sent
                            - generic: "3"
                          - generic:
                            - generic: Booked
                            - generic: "5"
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Smart Quotes & Proposals" [level=3]
                            - text: Conversion
                      - paragraph: Line-item digital proposals. Clients sign online, auto-convert to bookings instantly.
                      - generic:
                        - generic:
                          - generic:
                            - generic: Subtotal
                            - generic: ₹14,50,000
                          - generic:
                            - generic: GST 18%
                            - generic: ₹2,61,000
                          - generic:
                            - generic: Total
                            - generic: ₹17,11,000
                          - button "Accept & Sign →"
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Invoices & Payments" [level=3]
                            - text: Finance
                      - paragraph: Generate milestone invoices from accepted quotes. Track UPI, bank transfers, and card deposits.
                      - generic:
                        - generic:
                          - generic:
                            - generic:
                              - generic: Deposit (50%)
                              - text: ₹8,55,000
                            - generic: Paid
                          - generic:
                            - generic:
                              - generic: Mid-Event (25%)
                              - text: ₹4,27,500
                            - generic: Pending
                          - generic:
                            - generic:
                              - generic: Final (25%)
                              - text: ₹4,27,500
                            - generic: Upcoming
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Event Timelines & Tasks" [level=3]
                            - text: Operations
                      - paragraph: Drag-and-drop task boards. Assign vendors, staff, and photographers to event milestones.
                      - generic:
                        - generic:
                          - generic:
                            - generic: 09:00
                            - generic: Team Check-in
                          - generic:
                            - generic: 11:30
                            - generic: Décor Setup
                          - generic:
                            - generic: 14:00
                            - generic: Sound Check
                          - generic:
                            - generic: 17:00
                            - generic: Guest Arrival
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Secure Gallery Delivery" [level=3]
                            - text: Media
                      - paragraph: Cloudinary-powered media albums. Passcode protection, expiry links, and granular download controls.
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - img
                          - generic:
                            - generic: Expires in 30 days
                            - generic: Download ZIP →
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "White-Label Client Portal" [level=3]
                            - text: Collaboration
                      - paragraph: Dedicated client dashboard. Accept quotes, pay invoices, view timelines — no extra login required.
                      - generic:
                        - generic:
                          - generic:
                            - generic: Proposal Status
                            - generic: ✓ Accepted
                          - generic:
                            - generic: Outstanding Payment
                            - generic: ₹50,000
                          - button "Pay Now →"
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: Security & Infrastructure
                - heading "Enterprise-Grade Multi-Tenancy" [level=2]
                - paragraph: Engineered to secure tenant environments, protect planner databases, and provide isolated guest spaces for client portal approvals.
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Workspace Isolation" [level=3]
                            - paragraph: Each tenant operates in a completely isolated container with separate DB schemas, avoiding any data leaks.
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Role-Based Access Control" [level=3]
                            - paragraph: Granular permissions for Planners, Coordinators, Vendors, and Clients. Limit visibility to relevant documents.
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - img
                          - generic:
                            - heading "Team Collaboration" [level=3]
                            - paragraph: Coordinators and planners share tasks, quotes, and timelines in real-time, syncing status updates instantly.
                - generic:
                  - generic:
                    - generic:
                      - generic: WORKSPACE_ROUTING_ROUTER
                      - generic: MFA Secure
                    - generic:
                      - generic:
                        - img
                        - generic: GATEWAY
                      - img
                      - generic:
                        - generic:
                          - img
                        - generic:
                          - 'heading "Planner Tenant #1" [level=4]'
                          - generic: elite.eventos.io
                      - generic:
                        - generic:
                          - img
                        - generic:
                          - 'heading "Planner Tenant #2" [level=4]'
                          - generic: stellar.eventos.io
                      - generic:
                        - img
                        - generic:
                          - heading "Schema-Isolated Databases" [level=4]
                          - generic: Encrypted at rest · TLS 1.3
                    - generic:
                      - generic:
                        - generic: "Tenant A: isolated"
                      - generic:
                        - generic: "Tenant B: isolated"
                      - generic:
                        - generic: Active SSO session
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: Integrated Lifecycle
                - heading "The Complete Event Workflow" [level=2]
                - paragraph: See how prospective leads turn into fully paid bookings and finished galleries inside the automated EventOS ecosystem — no context switching required.
              - generic:
                - img
                - img
                - img
                - img
                - generic:
                  - generic:
                    - generic:
                      - img
                      - generic: "1"
                    - generic:
                      - heading "Lead" [level=3]
                      - paragraph: Client inquiry logged in CRM
                  - generic:
                    - generic:
                      - img
                      - generic: "2"
                    - generic:
                      - heading "Quote" [level=3]
                      - paragraph: Proposal drafted & accepted
                  - generic:
                    - generic:
                      - img
                      - generic: "3"
                    - generic:
                      - heading "Booking" [level=3]
                      - paragraph: Contract signed, dates locked
                  - generic:
                    - generic:
                      - img
                      - generic: "4"
                    - generic:
                      - heading "Payment" [level=3]
                      - paragraph: Milestones invoiced & cleared
                  - generic:
                    - generic:
                      - img
                      - generic: "5"
                    - generic:
                      - heading "Gallery" [level=3]
                      - paragraph: High-res media delivered
              - generic:
                - generic:
                  - paragraph: < 15 min
                  - paragraph: Average time to create & send a proposal
                - generic:
                  - paragraph: Zero
                  - paragraph: Manual data re-entry between pipeline stages
                - generic:
                  - paragraph: 100%
                  - paragraph: Automated invoice generation from bookings
        - generic:
          - generic:
            - generic:
              - generic:
                - img
                - text: Interactive Timeline Simulator
              - heading "See how AI resolves venue schedule overlaps in real-time" [level=2]
              - paragraph: Test the EventOS AI Auto-Scheduler below. Click the conflict button to watch the AI automatically resolve vendor timeline collisions.
            - generic:
              - generic:
                - generic:
                  - generic:
                    - img
                  - generic:
                    - heading "Royal Gala Run-of-Show" [level=3]
                    - text: Live Timeline · 1,200 Attendees · Grand Banquet Lawn
                - generic:
                  - button "Resolve Conflict with AI Co-pilot":
                    - img
                    - generic: Resolve Conflict with AI Co-pilot
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img
                      - generic: 08:00 AM
                    - generic:
                      - heading "Stage Rigging & Floral Arch Ingress" [level=4]
                      - paragraph: Luxury Decor Co. & SoundWorks · Main Lawn Stage
                  - generic:
                    - generic:
                      - img
                      - text: Completed
                - generic:
                  - generic:
                    - generic:
                      - img
                      - generic: 11:30 AM
                    - generic:
                      - heading "DJ Sound Check & Bass Leveling" [level=4]
                      - paragraph: BeatSync DJ & Catering Staff · Grand Ballroom & Stage
                  - generic:
                    - generic:
                      - img
                      - text: Conflict Overlap
                - generic:
                  - generic:
                    - generic:
                      - img
                      - generic: 02:00 PM
                    - generic:
                      - heading "VIP Guest Reception & PWA Check-In" [level=4]
                      - paragraph: EventOS Mobile Gateways · South Gate Entrance
                  - generic:
                    - generic: Scheduled
                - generic:
                  - generic:
                    - generic:
                      - img
                      - generic: 06:30 PM
                    - generic:
                      - heading "Grand Entrance & Pyrotechnics Launch" [level=4]
                      - paragraph: PyroTech & Event Coordinators · Center Stage
                  - generic:
                    - generic: Scheduled
              - generic:
                - generic:
                  - img
                  - generic:
                    - strong: "Warning:"
                    - text: DJ Sound Check overlaps with Live Flambé Catering. Click above to let AI auto-shift times.
              - generic:
                - generic: Automate your run-of-show timelines with EventOS AI.
                - button "Build Your AI Timelines":
                  - generic: Build Your AI Timelines
                  - img
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: White-Label Client Portal
                - heading "Give your clients a premium experience." [level=2]
                - paragraph: Every client gets a dedicated, secure portal — no extra app required. They can approve quotes, pay invoices, view timelines, and access galleries in one branded link.
              - generic:
                - generic:
                  - generic:
                    - paragraph: Preview Portal View
                    - generic:
                      - button "Event Dashboard":
                        - img
                        - generic: Event Dashboard
                      - button "Review Quote":
                        - img
                        - generic: Review Quote
                      - button "Pay Invoice":
                        - img
                        - generic: Pay Invoice
                      - button "View Timeline":
                        - img
                        - generic: View Timeline
                  - generic:
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading "Isolated & Secure" [level=4]
                        - paragraph: Each client sees only their data — zero cross-contamination.
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading "Unique Invite Link" [level=4]
                        - paragraph: One-click setup. Clients register via a secure invitation URL.
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading "Mobile-First Design" [level=4]
                        - paragraph: Optimized for phones — clients access on-the-go.
                    - generic:
                      - generic:
                        - heading "White-Label Ready" [level=4]
                        - paragraph: Custom domain + logo mapping for Growth & Enterprise plans.
                  - generic:
                    - button "Try the Portal Demo":
                      - img
                      - text: Try the Portal Demo
                    - button "Learn More"
                - generic:
                  - generic:
                    - generic:
                      - generic: portal.eventos.io/client/preeti-arjun
                    - generic:
                      - button "Event Dashboard":
                        - img
                        - generic: Event Dashboard
                      - button "Review Quote":
                        - img
                        - generic: Review Quote
                      - button "Pay Invoice":
                        - img
                        - generic: Pay Invoice
                      - button "View Timeline":
                        - img
                        - generic: View Timeline
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - generic:
                              - paragraph: Client Portal
                              - heading "Preeti & Arjun — Wedding" [level=4]
                            - generic: Active
                          - generic:
                            - generic:
                              - generic:
                                - img
                                - generic: Event Date
                              - paragraph: 18 Oct 2026
                            - generic:
                              - generic:
                                - img
                                - generic: Venue
                              - paragraph: Taj Hotel, Delhi
                            - generic:
                              - generic:
                                - generic: Guest Count
                              - paragraph: 450 Guests
                            - generic:
                              - generic:
                                - img
                                - generic: Planner
                              - paragraph: Sen Weddings
                          - generic:
                            - img
                            - generic: Your planner has updated the event timeline. Review new changes.
                  - generic:
                    - img
                    - generic:
                      - paragraph: Tenant Isolated
                      - paragraph: Zero data cross-contamination
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: Client Stories
                - generic:
                  - generic:
                    - img
                    - img
                    - img
                    - img
                    - img
                  - generic: "5.0"
                  - generic: from 200+ agencies
                - heading "Endorsed by leading production teams." [level=2]
                - paragraph: See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: AS
                          - generic:
                            - heading "Aparna Sen" [level=3]
                            - paragraph: Founder, Sen Weddings & Co.
                        - generic: “
                      - blockquote: "\"EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.\""
                      - generic:
                        - generic:
                          - generic: Wedding Planner
                          - generic: Verified Agency
                        - generic:
                          - generic:
                            - img
                            - text: 15 min quotes
                          - generic:
                            - img
                            - text: 2 years customer
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: RK
                          - generic:
                            - heading "Rohan Kapoor" [level=3]
                            - paragraph: Operations Lead, Peak Corporate
                        - generic: “
                      - blockquote: "\"Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.\""
                      - generic:
                        - generic:
                          - generic: Corporate Events
                          - generic: Peak Corporate
                        - generic:
                          - generic:
                            - img
                            - text: Timeline Sync
                          - generic:
                            - img
                            - text: 25+ vendors
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: MN
                          - generic:
                            - heading "Meera Nair" [level=3]
                            - paragraph: Creative Director, Vogue Gala
                        - generic: “
                      - blockquote: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
                      - generic:
                        - generic:
                          - generic: Creative Director
                          - generic: Gala Specialist
                        - generic:
                          - generic:
                            - img
                            - text: Expiring links
                          - generic:
                            - img
                            - text: Shared 20x
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: VM
                          - generic:
                            - heading "Vikram Malhotra" [level=3]
                            - paragraph: Managing Director, Apex Events India
                        - generic: “
                      - blockquote: "\"Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.\""
                      - generic:
                        - generic:
                          - generic: Multi-Tenant CRM
                          - generic: Apex Events
                        - generic:
                          - generic:
                            - img
                            - text: Secure Tenants
                          - generic:
                            - img
                            - text: SOC2 compliant
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: SG
                          - generic:
                            - heading "Sanya Gupta" [level=3]
                            - paragraph: Principal Planner, Luxe Soirees
                        - generic: “
                      - blockquote: "\"Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.\""
                      - generic:
                        - generic:
                          - generic: Invoicing Automations
                          - generic: Luxe Soirees
                        - generic:
                          - generic:
                            - img
                            - text: Invoice automate
                          - generic:
                            - img
                            - text: Saves 15h/wk
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic: AM
                          - generic:
                            - heading "Arjun Mehta" [level=3]
                            - paragraph: Co-founder, EliteDecor Events
                        - generic: “
                      - blockquote: "\"We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.\""
                      - generic:
                        - generic:
                          - generic: Scaled 4x
                          - generic: EliteDecor
                        - generic:
                          - generic:
                            - img
                            - text: 80+ events/yr
                          - generic:
                            - img
                            - text: EliteDecor team
                  - generic:
                    - button "Go to testimonial 1"
                    - button "Go to testimonial 2"
                    - button "Go to testimonial 3"
                    - button "Go to testimonial 4"
                    - button "Go to testimonial 5"
                    - button "Go to testimonial 6"
        - generic:
          - generic:
            - generic:
              - generic:
                - img
                - text: Interactive ROI Calculator
              - heading "Calculate your time & revenue gains with EventOS" [level=2]
              - paragraph: See how much manual coordination time and lost deposit revenue EventOS recovers for your agency every month.
            - generic:
              - generic:
                - generic:
                  - heading "Configure Your Agency Parameters" [level=3]:
                    - img
                    - text: Configure Your Agency Parameters
                  - generic:
                    - generic:
                      - generic: Events Managed per Month
                      - generic: 8 Events
                    - slider: "8"
                    - generic:
                      - generic: 1 Event
                      - generic: 20 Events
                      - generic: 40+ Events
                  - generic:
                    - generic:
                      - generic: Average Event Budget / Value
                      - generic: ₹5.0 Lakh
                    - slider: "500000"
                    - generic:
                      - generic: ₹50K
                      - generic: ₹15 Lakh
                      - generic: ₹30 Lakh+
                  - generic:
                    - generic:
                      - generic: Coordinators & Team Seats
                      - generic: 4 Members
                    - slider: "4"
                    - generic:
                      - generic: 1 Solo Planner
                      - generic: 10 Seats
                      - generic: 20 Seats
                - generic:
                  - img
                  - generic: Calculations based on 2026 industry benchmarks across 10,000+ agency events.
              - generic:
                - generic:
                  - generic: Estimated Impact Summary
                  - heading "Your Monthly Yield" [level=4]
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic:
                          - generic: Time Reclaimed
                          - generic: 128 hrs/mo
                      - generic: +16 Days Saved
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - generic:
                          - generic: Scope Leakage Recovered
                          - generic: ₹2.6 Lakh/mo
                      - generic: Protected
                    - generic:
                      - generic:
                        - generic: Estimated Annual Return
                        - generic: 57x ROI
                      - generic:
                        - generic: Annual Net Value
                        - text: ₹41.2 Lakh
                - button "Unlock Your ROI — Start 14-Day Free Trial":
                  - generic: Unlock Your ROI — Start 14-Day Free Trial
                  - img
        - generic:
          - generic:
            - article:
              - generic:
                - img
                - text: Transparent Pricing
              - heading "Plans tailored for your event business" [level=2]
              - paragraph: Trusted by event agencies and coordinators worldwide. Choose a tier to unlock automation, client portals, and multi-tenant scaling.
              - generic:
                - generic:
                  - generic:
                    - button "Monthly":
                      - generic: Monthly
                    - button "Yearly SAVE 20%":
                      - generic:
                        - text: Yearly
                        - generic: SAVE 20%
            - generic:
              - generic:
                - generic:
                  - generic:
                    - heading "Starter" [level=3]
                    - paragraph: Perfect for independent planners managing multiple event schedules.
                  - generic:
                    - generic:
                      - generic: ₹1,999
                      - generic: /month
                  - generic:
                    - heading "5 Active Events" [level=4]
                    - list:
                      - listitem:
                        - generic:
                          - img
                        - generic: 2 Team seats included
                      - listitem:
                        - generic:
                          - img
                        - generic: 20 GB High-res media storage
                      - listitem:
                        - generic:
                          - img
                        - generic: Milestone payments clearing
                      - listitem:
                        - generic:
                          - img
                        - generic: Automated client contracts
                      - listitem:
                        - generic:
                          - img
                        - generic: Standard email support queue
                - generic:
                  - button "Start Free Trial":
                    - generic: Start Free Trial
                    - img
              - generic:
                - generic:
                  - img
                  - text: Most Popular
                - generic:
                  - generic:
                    - heading "Professional" [level=3]
                    - paragraph: Best value for active agencies & growing event organizations.
                  - generic:
                    - generic:
                      - generic: ₹5,999
                      - generic: /month
                  - generic:
                    - heading "Everything in Starter, plus:" [level=4]
                    - list:
                      - listitem:
                        - generic:
                          - img
                        - generic: 20 Active Events
                      - listitem:
                        - generic:
                          - img
                        - generic: 5 Team seats included
                      - listitem:
                        - generic:
                          - img
                        - generic: 100 GB High-res media storage
                      - listitem:
                        - generic:
                          - img
                        - generic: EventOS AI Operations Co-pilot
                      - listitem:
                        - generic:
                          - img
                        - generic: Interactive custom quotes editor
                      - listitem:
                        - generic:
                          - img
                        - generic: Priority support queue SLA
                - generic:
                  - button "Start Free Trial":
                    - generic: Start Free Trial
                    - img
              - generic:
                - generic:
                  - generic:
                    - heading "Enterprise" [level=3]
                    - paragraph: Advanced security & unlimited scale for large production houses.
                  - generic:
                    - generic:
                      - generic: ₹11,999
                      - generic: /month
                  - generic:
                    - heading "Everything in Professional, plus:" [level=4]
                    - list:
                      - listitem:
                        - generic:
                          - img
                        - generic: Unlimited Active Events & Seats
                      - listitem:
                        - generic:
                          - img
                        - generic: 500 GB+ Dedicated AWS storage
                      - listitem:
                        - generic:
                          - img
                        - generic: Custom white-labeled domains
                      - listitem:
                        - generic:
                          - img
                        - generic: Developer API & webhooks access
                      - listitem:
                        - generic:
                          - img
                        - generic: 24/7 Dedicated account manager
                - generic:
                  - button "Contact Sales":
                    - generic: Contact Sales
                    - img
        - generic:
          - generic:
            - generic:
              - generic: Subscription Consolidator
              - heading "Ditch fragmented bills. Reclaim control." [level=3]
              - paragraph: Why event Planners and photography studio collectives waste ₹28,000+/mo across disconnected tools, and how EventOS replaces them under a single architecture.
            - generic:
              - table:
                - rowgroup:
                  - row "Feature Sets EventOS HoneyBook HubSpot ClickUp Pixieset QuickBooks":
                    - columnheader "Feature Sets"
                    - columnheader "EventOS"
                    - columnheader "HoneyBook"
                    - columnheader "HubSpot"
                    - columnheader "ClickUp"
                    - columnheader "Pixieset"
                    - columnheader "QuickBooks"
                - rowgroup:
                  - row "Consolidated Workspace (CRM + Ledger + Gallery) ✔ Yes ✕ No ✕ No ✕ No ✕ No ✕ No":
                    - cell "Consolidated Workspace (CRM + Ledger + Gallery)"
                    - cell "✔ Yes"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✕ No"
                  - row "Schema-Based Multi-Tenant DB Isolation ✔ Yes (Private Schema) ✕ Shared DB ✕ Shared DB ✕ Shared DB ✕ Shared DB ✕ Shared DB":
                    - cell "Schema-Based Multi-Tenant DB Isolation"
                    - cell "✔ Yes (Private Schema)"
                    - cell "✕ Shared DB"
                    - cell "✕ Shared DB"
                    - cell "✕ Shared DB"
                    - cell "✕ Shared DB"
                    - cell "✕ Shared DB"
                  - row "High-Res proofing galleries CDN integration ✔ Yes (AWS S3/CloudFront) ✕ No ✕ No ✕ No ✔ Yes ✕ No":
                    - cell "High-Res proofing galleries CDN integration"
                    - cell "✔ Yes (AWS S3/CloudFront)"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✔ Yes"
                    - cell "✕ No"
                  - row "Timeline Overlap Scheduling Alerts ✔ Yes (WebSocket sync) ✕ No ✕ No ✔ Yes (Basic) ✕ No ✕ No":
                    - cell "Timeline Overlap Scheduling Alerts"
                    - cell "✔ Yes (WebSocket sync)"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✔ Yes (Basic)"
                    - cell "✕ No"
                    - cell "✕ No"
                  - row "Milestone Proposal contract acceptance ✔ Yes (Secure E-Sign) ✔ Yes ✕ No ✕ No ✕ No ✕ No":
                    - cell "Milestone Proposal contract acceptance"
                    - cell "✔ Yes (Secure E-Sign)"
                    - cell "✔ Yes"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✕ No"
                    - cell "✕ No"
                  - row "Unified Operational Monthly Cost ₹1,999 / mo ₹3,200 / mo ₹7,500 / mo ₹1,500 / mo ₹2,500 / mo ₹2,200 / mo":
                    - cell "Unified Operational Monthly Cost"
                    - cell "₹1,999 / mo"
                    - cell "₹3,200 / mo"
                    - cell "₹7,500 / mo"
                    - cell "₹1,500 / mo"
                    - cell "₹2,500 / mo"
                    - cell "₹2,200 / mo"
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: Got Questions?
                - heading "Frequently Asked Questions" [level=2]
                - paragraph: Everything you need to know about EventOS security, billing, white-label options, and team management.
              - generic:
                - generic:
                  - generic:
                    - heading "Is my customer and transaction data isolated?" [level=3]:
                      - button "Is my customer and transaction data isolated?":
                        - generic:
                          - img
                          - text: Is my customer and transaction data isolated?
                        - img
                  - generic:
                    - heading "Can I use my own brand logo and custom domain?" [level=3]:
                      - button "Can I use my own brand logo and custom domain?":
                        - generic:
                          - img
                          - text: Can I use my own brand logo and custom domain?
                        - img
                  - generic:
                    - heading "How secure are the client galleries?" [level=3]:
                      - button "How secure are the client galleries?":
                        - generic:
                          - img
                          - text: How secure are the client galleries?
                        - img
                  - generic:
                    - heading "Can I manage multiple event agencies or client workspaces?" [level=3]:
                      - button "Can I manage multiple event agencies or client workspaces?":
                        - generic:
                          - img
                          - text: Can I manage multiple event agencies or client workspaces?
                        - img
                  - generic:
                    - heading "Does EventOS support automatic payment reminders?" [level=3]:
                      - button "Does EventOS support automatic payment reminders?":
                        - generic:
                          - img
                          - text: Does EventOS support automatic payment reminders?
                        - img
                  - generic:
                    - heading "What team roles and permissions are available?" [level=3]:
                      - button "What team roles and permissions are available?":
                        - generic: What team roles and permissions are available?
                        - img
              - generic:
                - paragraph:
                  - text: Still have questions?
                  - link "Chat with our team →":
                    - /url: mailto:support@eventos.io
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img
                      - text: Glassmorphic Support Desk
                    - heading "Let's scale your event enterprise together." [level=2]
                    - paragraph: Have questions about custom workflows, white-label setup, or enterprise migration? Drop us a line below. Our engineering team is here 24/7.
                  - generic:
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading "Direct Email Desk" [level=4]
                        - paragraph: Rapid response within 12 hours
                        - link "hello@eventos.io →":
                          - /url: mailto:hello@eventos.io
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading "Operational SLA" [level=4]
                        - paragraph: Global support coverage
                        - paragraph: Monday – Friday, 9:00 AM – 6:00 PM (SGT)
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading "Global Headquarters" [level=4]
                        - paragraph: Isolated Enterprise Hub
                        - paragraph: Singapore, Central Business District
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - heading "Submit Technical Inquiry" [level=3]
                          - paragraph: Fill out your event details below to connect with an engineer.
                        - img
                      - generic:
                        - generic:
                          - generic: Full Name *
                          - textbox "Full Name *":
                            - /placeholder: Jane Doe
                        - generic:
                          - generic: Business Email *
                          - textbox "Business Email *":
                            - /placeholder: jane@agency.com
                      - generic:
                        - text: Agency Team Size
                        - generic:
                          - combobox "Agency Team Size":
                            - option "1 – 5 Coordinators" [selected]
                            - option "6 – 15 Coordinators"
                            - option "16 – 50 Coordinators"
                            - option "50+ Enterprise Planners"
                          - generic:
                            - img
                      - generic:
                        - generic: Inquiry Message *
                        - textbox "Inquiry Message *":
                          - /placeholder: Tell us about your event operations, team size, and requirements...
                      - button "Submit Glassmorphic Inquiry":
                        - img
                        - generic: Submit Glassmorphic Inquiry
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - img
                  - text: Free 14-Day Trial — No Credit Card Required
                - generic:
                  - heading "Streamline your event operations today." [level=2]:
                    - text: Streamline your event
                    - text: operations today.
                  - paragraph: Connect your team, coordinate vendors, and delight clients from a single secure workspace. Cancel anytime, no lock-in.
                - generic:
                  - generic: Email address
                  - generic:
                    - img
                    - textbox "Email address":
                      - /placeholder: Enter your agency email
                  - button "Get Started":
                    - text: Get Started
                    - img
                - generic:
                  - generic:
                    - img
                    - text: SSL Encrypted
                  - generic: •
                  - generic:
                    - img
                    - text: SaaS Multi-Tenancy
                  - generic: •
                  - generic:
                    - img
                    - text: 100% Isolated Data
                  - generic: •
                  - generic:
                    - img
                    - text: No Credit Card
      - contentinfo:
        - generic:
          - generic:
            - link "EventOS Home":
              - img "EO"
              - generic:
                - heading "Event OS" [level=4]:
                  - text: Event
                  - generic: OS
                - generic: MANAGE. ENGAGE. ELEVATE.
            - paragraph: EventOS is the all-in-one operating system for event planners, wedding agencies, and production teams. Tenant-isolated, secure, and built for scale.
            - generic:
              - link "EventOS on X/Twitter":
                - /url: https://twitter.com
                - img
              - link "EventOS on GitHub":
                - /url: https://github.com
                - img
              - link "EventOS on LinkedIn":
                - /url: https://linkedin.com
                - img
              - link "EventOS on Instagram":
                - /url: https://instagram.com
                - img
            - generic: All systems operational
          - generic:
            - heading "Product" [level=5]
            - list:
              - listitem:
                - link "CRM & Leads":
                  - /url: "#features"
                  - img
                  - text: CRM & Leads
              - listitem:
                - link "Smart Quotes":
                  - /url: "#features"
                  - img
                  - text: Smart Quotes
              - listitem:
                - link "Task Timelines":
                  - /url: "#workflow"
                  - img
                  - text: Task Timelines
              - listitem:
                - link "Modules Suite":
                  - /url: "#modules"
                  - img
                  - text: Modules Suite
              - listitem:
                - link "Gallery Delivery":
                  - /url: "#features"
                  - img
                  - text: Gallery Delivery
          - generic:
            - heading "Company" [level=5]
            - list:
              - listitem:
                - link "About Us":
                  - /url: /about
                  - img
                  - text: About Us
              - listitem:
                - link "Templates Center":
                  - /url: /resources
                  - img
                  - text: Templates Center
              - listitem:
                - link "Platform Security":
                  - /url: /security
                  - img
                  - text: Platform Security
              - listitem:
                - link "System Status":
                  - /url: /status
                  - img
                  - text: System Status
          - generic:
            - heading "Legal" [level=5]
            - list:
              - listitem:
                - link "Privacy Policy":
                  - /url: /privacy
                  - img
                  - text: Privacy Policy
              - listitem:
                - link "Terms of Service":
                  - /url: /terms
                  - img
                  - text: Terms of Service
              - listitem:
                - link "Tenant SLA":
                  - /url: /sla
                  - img
                  - text: Tenant SLA
              - listitem:
                - link "Cookie Policy":
                  - /url: /cookies
                  - img
                  - text: Cookie Policy
        - generic:
          - generic: © 2026 EventOS Business Suite. All rights reserved.
          - generic:
            - generic:
              - img
              - text: "Build: v1.1.0-prod"
            - generic: •
            - generic: "Server Region: IN-WEST"
    - generic [ref=e32]:
      - link [ref=e33] [cursor=pointer]:
        - /url: "#hero"
      - link [ref=e35] [cursor=pointer]:
        - /url: "#features"
        - img [ref=e37]
      - link [ref=e40] [cursor=pointer]:
        - /url: "#modules"
      - link [ref=e42] [cursor=pointer]:
        - /url: "#pricing"
        - img [ref=e44]
      - link [ref=e48] [cursor=pointer]:
        - /url: "#contact"
        - img [ref=e50]
  - button "Open Next.js Dev Tools" [ref=e58] [cursor=pointer]:
    - img [ref=e59]
  - alert [ref=e62]
  - button "EventOS AI Co-pilot (Cmd + Space)" [ref=e63] [cursor=pointer]:
    - img [ref=e66]
  - generic [ref=e71]:
    - button "Close onboarding" [ref=e72] [cursor=pointer]:
      - img [ref=e73]
    - generic [ref=e76]:
      - generic [ref=e77]:
        - generic [ref=e78]: Step 1 of 9
        - generic [ref=e79]: 0%
      - generic [ref=e81]:
        - 'button "Go to step 1: Welcome" [ref=e82] [cursor=pointer]'
        - 'button "Go to step 2: Workspace" [ref=e83] [cursor=pointer]'
        - 'button "Go to step 3: Team" [ref=e84] [cursor=pointer]'
        - 'button "Go to step 4: Client" [ref=e85] [cursor=pointer]'
        - 'button "Go to step 5: Lead" [ref=e86] [cursor=pointer]'
        - 'button "Go to step 6: Quote" [ref=e87] [cursor=pointer]'
        - 'button "Go to step 7: Event" [ref=e88] [cursor=pointer]'
        - 'button "Go to step 8: Gallery" [ref=e89] [cursor=pointer]'
        - 'button "Go to step 9: Finish" [ref=e90] [cursor=pointer]'
    - generic [ref=e92]:
      - generic [ref=e93]: E
      - heading "Welcome to EventOS!" [level=1] [ref=e94]
      - paragraph [ref=e95]: Let's set up your workspace in a few quick steps. You can skip any step and come back later.
      - generic [ref=e96]:
        - button "Start Setup" [ref=e97] [cursor=pointer]:
          - img [ref=e98]
          - text: Start Setup
          - img [ref=e103]
        - button "Load Demo" [ref=e105] [cursor=pointer]:
          - img [ref=e106]
          - text: Load Demo
    - button "Skip Setup" [ref=e111] [cursor=pointer]
  - generic [ref=e115]:
    - button "Close modal" [ref=e117] [cursor=pointer]:
      - img [ref=e118]
    - generic [ref=e122]:
      - generic [ref=e123]:
        - img [ref=e125]
        - heading "EventOS" [level=2] [ref=e127]
        - paragraph [ref=e128]: The Operating System for Event Businesses
      - generic [ref=e129]:
        - generic [ref=e130]:
          - text: Email Address
          - generic [ref=e131]:
            - img [ref=e132]
            - textbox "Email Address" [ref=e135]:
              - /placeholder: you@company.com
              - text: demo@eventos.com
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]: Password
            - link "Forgot password?" [ref=e139] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e140]:
            - img [ref=e141]
            - textbox "Password" [active] [ref=e144]:
              - /placeholder: ••••••••
              - text: securePassword123
            - button [ref=e145] [cursor=pointer]:
              - img [ref=e146]
        - generic [ref=e149]:
          - checkbox [ref=e150] [cursor=pointer]
          - generic [ref=e151] [cursor=pointer]: Remember me
        - button "Sign In" [ref=e153] [cursor=pointer]
      - generic [ref=e156]: Or continue with
      - button "Continue with Google" [ref=e159] [cursor=pointer]:
        - img [ref=e160]
        - generic [ref=e165]: Continue with Google
      - paragraph [ref=e167]:
        - text: Don't have an account?
        - button "Create a workspace" [ref=e168] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('EventOS Frontend Integration & Authentication Flow', () => {
  4   | 
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Clear cookies/session storage and set bypass preloader flag before each integration test
  7   |     await page.goto('/');
  8   |     await page.evaluate(() => {
  9   |       sessionStorage.clear();
  10  |       localStorage.clear();
  11  |       localStorage.setItem('nopreload', 'true');
  12  |     });
  13  |   });
  14  | 
  15  |   test('should display Landing Page with CTAs linking to Login and Register', async ({ page }) => {
  16  |     await page.goto('/?nopreload=true');
  17  | 
  18  |     // Check Landing Page elements
  19  |     await expect(page.locator('text=The Operating System for Event Businesses')).toBeVisible();
  20  |     await expect(page.locator('text=Run your entire event business')).toBeVisible();
  21  | 
  22  |     // Check action buttons exist
  23  |     const createWorkspaceBtn = page.locator('text=Start Free Trial');
  24  |     const enterDashboardBtn = page.locator('text=Book a Demo');
  25  | 
  26  |     await expect(createWorkspaceBtn).toBeVisible();
  27  |     await expect(enterDashboardBtn).toBeVisible();
  28  | 
  29  |     // Click login button in the header
  30  |     await page.click('header >> text=Sign In');
  31  |     await expect(page).toHaveURL(/\/login/);
  32  |   });
  33  | 
  34  |   test('should enforce protected route redirects for unauthenticated users', async ({ page }) => {
  35  |     // Attempting to access dashboard, switcher, or settings directly
  36  |     await page.goto('/workspace-select');
  37  | 
  38  |     // Middleware should redirect user to login since hasSession cookie is missing
  39  |     await expect(page).toHaveURL(/\/login\?redirect=%2Fworkspace-select/);
  40  |   });
  41  | 
  42  |   test('should handle successful login flow, save session state, and redirect to switcher', async ({ page }) => {
  43  |     await page.goto('/login');
  44  | 
  45  |     // Intercept/mock login API response
  46  |     await page.route('**/api/v1/auth/login', async (route) => {
  47  |       await route.fulfill({
  48  |         status: 200,
  49  |         contentType: 'application/json',
  50  |         body: JSON.stringify({
  51  |           success: true,
  52  |           data: {
  53  |             accessToken: 'mock_jwt_access_token_xyz123',
  54  |             userId: '88888888-8888-8888-8888-888888888888',
  55  |             firstName: 'Demo',
  56  |             role: 'OWNER',
  57  |             tenantId: '99999999-9999-9999-9999-999999999999',
  58  |             memberships: [
  59  |               {
  60  |                 tenantId: '99999999-9999-9999-9999-999999999999',
  61  |                 companyId: 'company_abc',
  62  |                 companyName: 'Apex Wedding Planners',
  63  |                 role: 'OWNER',
  64  |                 status: 'ACTIVE'
  65  |               },
  66  |               {
  67  |                 tenantId: '11111111-1111-1111-1111-111111111111',
  68  |                 companyId: 'company_def',
  69  |                 companyName: 'Elite Corporate Events',
  70  |                 role: 'MANAGER',
  71  |                 status: 'ACTIVE'
  72  |               }
  73  |             ]
  74  |           }
  75  |         })
  76  |       });
  77  |     });
  78  | 
  79  |     // Fill in credentials
  80  |     await page.fill('input[id="email"]', 'demo@eventos.com');
  81  |     await page.fill('input[id="password"]', 'securePassword123');
  82  | 
  83  |     // Submit login form
> 84  |     await page.click('button[type="submit"]');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  85  | 
  86  |     // Should redirect to Workspace Switcher page
  87  |     await expect(page).toHaveURL(/\/workspace-select/);
  88  | 
  89  |     // Verify session details saved in Session Storage via page evaluation
  90  |     const storedActiveTenant = await page.evaluate(() => sessionStorage.getItem('activeTenantId'));
  91  |     const storedUser = await page.evaluate(() => sessionStorage.getItem('user'));
  92  | 
  93  |     expect(storedActiveTenant).toBe('99999999-9999-9999-9999-999999999999');
  94  |     expect(storedUser).not.toBeNull();
  95  |     expect(storedUser!).toContain('demo@eventos.com');
  96  |     expect(storedUser!).toContain('Demo');
  97  |   });
  98  | 
  99  |   test('should switch workspace contexts and set appropriate HTTP headers', async ({ page }) => {
  100 |     // Set cookie first to prevent middleware redirecting to login page
  101 |     await page.context().addCookies([
  102 |       { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
  103 |     ]);
  104 | 
  105 |     // Pre-populate authenticated state using cookie and sessionStorage simulation
  106 |     await page.goto('/workspace-select');
  107 |     await page.evaluate(() => {
  108 |       sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
  109 |       sessionStorage.setItem('user', JSON.stringify({
  110 |         id: '88888888-8888-8888-8888-888888888888',
  111 |         email: 'demo@eventos.com',
  112 |         firstName: 'Demo',
  113 |         role: 'OWNER'
  114 |       }));
  115 |       sessionStorage.setItem('memberships', JSON.stringify([
  116 |         {
  117 |           tenantId: '99999999-9999-9999-9999-999999999999',
  118 |           companyName: 'Apex Wedding Planners',
  119 |           role: 'OWNER'
  120 |         },
  121 |         {
  122 |           tenantId: '11111111-1111-1111-1111-111111111111',
  123 |           companyName: 'Elite Corporate Events',
  124 |           role: 'MANAGER'
  125 |         }
  126 |       ]));
  127 |     });
  128 | 
  129 |     // Reload switcher page to bind sessionStorage values to UI state
  130 |     await page.reload();
  131 | 
  132 |     // Verify both workspace options are rendered
  133 |     await expect(page.locator('text=Apex Wedding Planners')).toBeVisible();
  134 |     await expect(page.locator('text=Elite Corporate Events')).toBeVisible();
  135 | 
  136 |     // Mock switcher API response
  137 |     let lastSwitchRequestPayload: any = null;
  138 |     await page.route('**/api/v1/auth/switch', async (route) => {
  139 |       lastSwitchRequestPayload = route.request().postDataJSON();
  140 |       await route.fulfill({
  141 |         status: 200,
  142 |         contentType: 'application/json',
  143 |         body: JSON.stringify({
  144 |           success: true,
  145 |           data: {
  146 |             accessToken: 'new_jwt_access_token_context_switched',
  147 |             userId: '88888888-8888-8888-8888-888888888888',
  148 |             role: 'MANAGER',
  149 |             firstName: 'Demo',
  150 |             memberships: []
  151 |           }
  152 |         })
  153 |       });
  154 |     });
  155 | 
  156 |     // Switch to second workspace
  157 |     await page.click('text=Elite Corporate Events');
  158 | 
  159 |     // Check correct API payload and redirection to home (dashboard) page
  160 |     expect(lastSwitchRequestPayload?.tenantId).toBe('11111111-1111-1111-1111-111111111111');
  161 |     await expect(page).toHaveURL(/\/dashboard/);
  162 |   });
  163 | 
  164 |   test('should display active sessions list and revoke old sessions', async ({ page }) => {
  165 |     // Set cookie first to prevent middleware redirecting to login page
  166 |     await page.context().addCookies([
  167 |       { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
  168 |     ]);
  169 | 
  170 |     // Setup authenticated state
  171 |     await page.goto('/settings/security');
  172 |     await page.evaluate(() => {
  173 |       sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
  174 |       sessionStorage.setItem('user', JSON.stringify({
  175 |         id: '88888888-8888-8888-8888-888888888888',
  176 |         email: 'demo@eventos.com',
  177 |         firstName: 'Demo',
  178 |         role: 'OWNER'
  179 |       }));
  180 |     });
  181 | 
  182 |     // Reload page to apply authenticated context
  183 |     await page.reload();
  184 | 
```