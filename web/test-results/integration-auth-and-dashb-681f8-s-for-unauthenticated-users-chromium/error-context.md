# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should enforce protected route redirects for unauthenticated users
- Location: tests\integration\auth-and-dashboard.spec.ts:34:7

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/workspace-select
Call log:
  - navigating to "http://localhost:3000/workspace-select", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - generic "EventOS Home" [ref=e7] [cursor=pointer]:
          - img "EO" [ref=e8]
          - generic [ref=e10]:
            - heading "Event OS" [level=1] [ref=e11]:
              - text: Event
              - generic [ref=e12]: OS
            - generic [ref=e13]: MANAGE. ENGAGE. ELEVATE.
        - navigation "Main Navigation" [ref=e14]:
          - link "Features" [ref=e15] [cursor=pointer]:
            - /url: /features
          - button "Solutions" [ref=e17] [cursor=pointer]: Solutions
          - link "Pricing" [ref=e18] [cursor=pointer]:
            - /url: /pricing
          - button "Resources" [ref=e20] [cursor=pointer]: Resources
        - generic [ref=e21]:
          - button "Live Demo" [ref=e22] [cursor=pointer]: Live Demo
          - button "Login" [ref=e23] [cursor=pointer]
          - button "Get Started" [ref=e24] [cursor=pointer]:
            - generic: Get Started
    - main [ref=e27]:
      - generic [ref=e31]:
        - generic [ref=e36]: The Operating System for Event Businesses
        - generic [ref=e37]:
          - heading "Run Events. Manage Clients. Deliver Memories." [level=1] [ref=e38]:
            - generic [ref=e39]: Run Events.
            - generic [ref=e40]: Manage Clients.
            - generic [ref=e42]: Deliver Memories.
          - paragraph [ref=e43]: Manage leads, bookings, proposals, invoicing, galleries, payments, and client communication in one place. Engineered for event planners, wedding agencies, and production teams.
        - generic [ref=e44]:
          - button "Start Free Trial" [ref=e45] [cursor=pointer]:
            - generic: Start Free Trial
          - button "Book a Demo" [ref=e48] [cursor=pointer]:
            - generic: Book a Demo
        - generic [ref=e51]:
          - generic [ref=e52]: SSL Encrypted
          - generic [ref=e53]: Tenant Isolated
          - generic [ref=e54]: 99.9% Uptime SLA
          - generic [ref=e55]: No Credit Card Required
        - generic [ref=e57]:
          - generic [ref=e58]:
            - generic [ref=e63]: admin.eventos.io/dashboard
            - generic [ref=e65]: "Tenant Isolation: active"
          - generic [ref=e66]:
            - generic [ref=e67]:
              - generic [ref=e69]: E
              - generic [ref=e78]: U
            - generic [ref=e80]:
              - generic [ref=e81]:
                - generic [ref=e82]:
                  - text: Workspace Dashboard
                  - heading "Event Command Center" [level=4] [ref=e83]
                - generic [ref=e84]:
                  - generic [ref=e85]: Q
                  - generic [ref=e86]: B
                  - generic [ref=e87]: I
              - generic [ref=e88]:
                - generic [ref=e89]:
                  - generic [ref=e90]: Lead Conversion Pipeline
                  - generic [ref=e91]:
                    - generic [ref=e92]: 84.2%
                    - generic [ref=e93]: ↑ +4.2% vs last month
                - generic [ref=e94]:
                  - generic [ref=e95]: Active Event Bookings
                  - generic [ref=e96]:
                    - generic [ref=e97]: 142 Projects
                    - generic [ref=e98]: 32 Weddings · 110 Corporate
                - generic [ref=e99]:
                  - generic [ref=e100]: Projected Revenue
                  - generic [ref=e101]:
                    - generic [ref=e102]: ₹8.4M
                    - generic [ref=e103]: "Invoiced cleared: ₹7.2M"
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - generic [ref=e107]: "Live Status:"
                  - generic [ref=e108]: "Quote #QT-2026-041 accepted by client (Sanjay Shah)"
                - generic [ref=e109] [cursor=pointer]: View Pipeline →
        - generic [ref=e111]:
          - generic [ref=e115]:
            - generic [ref=e117]: 0+
            - heading "Events Managed" [level=5] [ref=e118]
            - paragraph [ref=e119]: Weddings, galas & corporate events
          - generic [ref=e124]:
            - generic [ref=e126]: ₹0Cr+
            - heading "Revenue Processed" [level=5] [ref=e127]
            - paragraph [ref=e128]: Across all tenant workspaces
          - generic [ref=e133]:
            - generic [ref=e135]: 0%
            - heading "Client Satisfaction" [level=5] [ref=e136]
            - paragraph [ref=e137]: Outstanding NPS index globally
      - generic [ref=e139]:
        - paragraph [ref=e141]: Trusted by high-end planners, luxury wedding agencies, and production teams globally
        - generic [ref=e142]:
          - generic [ref=e143]:
            - generic [ref=e144]:
              - generic [ref=e147]: Vogue Weddings
              - generic [ref=e150]: Apex Productions
              - generic [ref=e153]: Echo Planners
              - generic [ref=e156]: Horizon Galas
              - generic [ref=e159]: Starlight Agency
              - generic [ref=e162]: Nova Premium Events
            - generic [ref=e163]:
              - generic [ref=e166]: Vogue Weddings
              - generic [ref=e169]: Apex Productions
              - generic [ref=e172]: Echo Planners
              - generic [ref=e175]: Horizon Galas
              - generic [ref=e178]: Starlight Agency
              - generic [ref=e181]: Nova Premium Events
            - generic [ref=e182]:
              - generic [ref=e185]: Vogue Weddings
              - generic [ref=e188]: Apex Productions
              - generic [ref=e191]: Echo Planners
              - generic [ref=e194]: Horizon Galas
              - generic [ref=e197]: Starlight Agency
              - generic [ref=e200]: Nova Premium Events
            - generic [ref=e201]:
              - generic [ref=e204]: Vogue Weddings
              - generic [ref=e207]: Apex Productions
              - generic [ref=e210]: Echo Planners
              - generic [ref=e213]: Horizon Galas
              - generic [ref=e216]: Starlight Agency
              - generic [ref=e219]: Nova Premium Events
          - generic [ref=e220]:
            - generic [ref=e221]:
              - generic [ref=e224]: Starlight Agency
              - generic [ref=e227]: Nova Premium Events
              - generic [ref=e230]: Bloom Event Co.
              - generic [ref=e233]: Summit Occasions
              - generic [ref=e236]: Prestige Soirees
              - generic [ref=e239]: Elara Weddings
            - generic [ref=e240]:
              - generic [ref=e243]: Starlight Agency
              - generic [ref=e246]: Nova Premium Events
              - generic [ref=e249]: Bloom Event Co.
              - generic [ref=e252]: Summit Occasions
              - generic [ref=e255]: Prestige Soirees
              - generic [ref=e258]: Elara Weddings
            - generic [ref=e259]:
              - generic [ref=e262]: Starlight Agency
              - generic [ref=e265]: Nova Premium Events
              - generic [ref=e268]: Bloom Event Co.
              - generic [ref=e271]: Summit Occasions
              - generic [ref=e274]: Prestige Soirees
              - generic [ref=e277]: Elara Weddings
            - generic [ref=e278]:
              - generic [ref=e281]: Starlight Agency
              - generic [ref=e284]: Nova Premium Events
              - generic [ref=e287]: Bloom Event Co.
              - generic [ref=e290]: Summit Occasions
              - generic [ref=e293]: Prestige Soirees
              - generic [ref=e296]: Elara Weddings
      - generic [ref=e299]:
        - generic [ref=e300]:
          - generic [ref=e301]: End-to-End Operating System
          - heading "Everything your agency needs, in one workspace." [level=2] [ref=e302]
          - paragraph [ref=e303]: Stop stitching together 6 different subscriptions. EventOS brings leads, proposals, timelines, invoices, client portals, and secure gallery sharing into a single tenant database.
        - generic [ref=e304]:
          - generic [ref=e307]:
            - generic [ref=e310]: Pipeline
            - generic [ref=e311]:
              - heading "CRM & Lead Pipeline" [level=3] [ref=e312]
              - paragraph [ref=e313]: Visual Kanban board tracking prospective clients, budgets, dates, and deal stages. Never let an event lead slip through.
          - generic [ref=e316]:
            - generic [ref=e319]: Conversion
            - generic [ref=e320]:
              - heading "Smart Quotes & Proposals" [level=3] [ref=e321]
              - paragraph [ref=e322]: Draft professional digital estimates. Send line-item proposals with digital signature acceptance and automatic lead conversion.
          - generic [ref=e325]:
            - generic [ref=e328]: Operations
            - generic [ref=e329]:
              - heading "Event Timelines & Coordination" [level=3] [ref=e330]
              - paragraph [ref=e331]: Map out event schedules, manage task assignments, assign photographer/vendor roles, and sync with calendars across your team.
          - generic [ref=e334]:
            - generic [ref=e337]: Billing
            - generic [ref=e338]:
              - heading "Invoices & Payments" [level=3] [ref=e339]
              - paragraph [ref=e340]: Generate drafts from accepted quotes. Set split payment milestones, log card/bank deposits, and track accounting ledgers with full history.
          - generic [ref=e343]:
            - generic [ref=e346]: Collaboration
            - generic [ref=e347]:
              - heading "Secure Client Portal" [level=3] [ref=e348]
              - paragraph [ref=e349]: Give clients a dedicated, white-label dashboard to accept proposals, pay deposit invoices, and view active timelines. Zero friction.
          - generic [ref=e352]:
            - generic [ref=e355]: Media Delivery
            - generic [ref=e356]:
              - heading "Gallery & Media Delivery" [level=3] [ref=e357]
              - paragraph [ref=e358]: Upload high-resolution event media. Deliver secure passcode-protected albums with custom download permissions and expiry links.
          - generic [ref=e361]:
            - generic [ref=e364]: AI Automation
            - generic [ref=e365]:
              - heading "EventOS AI Engine" [level=3] [ref=e366]
              - paragraph [ref=e367]: Intelligently matches vendor contracts, analyzes client budget deviations, and schedules automated email/SMS reminders. Reduce manual operational tasks to zero.
            - generic [ref=e372]: Auto-tracked
      - generic [ref=e375]:
        - generic [ref=e376]:
          - generic [ref=e377]: Complete Module Suite
          - heading "Six integrated modules. One unified workspace." [level=2] [ref=e378]
          - paragraph [ref=e379]: Every EventOS module talks to the others. A lead becomes a quote becomes a booking becomes an invoice becomes a gallery — automatically.
        - generic [ref=e380]:
          - generic [ref=e383]:
            - generic [ref=e387]:
              - heading "CRM & Lead Pipeline" [level=3] [ref=e388]
              - text: Acquisition
            - paragraph [ref=e389]: Visual Kanban board. Track leads, budgets, and conversion stages in real time.
            - generic [ref=e390]:
              - generic [ref=e391]:
                - generic [ref=e392]: Inquiries
                - generic [ref=e393]: "8"
              - generic [ref=e394]:
                - generic [ref=e395]: Proposal Sent
                - generic [ref=e396]: "3"
              - generic [ref=e397]:
                - generic [ref=e398]: Booked
                - generic [ref=e399]: "5"
          - generic [ref=e402]:
            - generic [ref=e406]:
              - heading "Smart Quotes & Proposals" [level=3] [ref=e407]
              - text: Conversion
            - paragraph [ref=e408]: Line-item digital proposals. Clients sign online, auto-convert to bookings instantly.
            - generic [ref=e409]:
              - generic [ref=e410]:
                - generic [ref=e411]: Subtotal
                - generic [ref=e412]: ₹14,50,000
              - generic [ref=e413]:
                - generic [ref=e414]: GST 18%
                - generic [ref=e415]: ₹2,61,000
              - generic [ref=e417]:
                - generic [ref=e418]: Total
                - generic [ref=e419]: ₹17,11,000
              - button "Accept & Sign →" [ref=e420] [cursor=pointer]
          - generic [ref=e423]:
            - generic [ref=e427]:
              - heading "Invoices & Payments" [level=3] [ref=e428]
              - text: Finance
            - paragraph [ref=e429]: Generate milestone invoices from accepted quotes. Track UPI, bank transfers, and card deposits.
            - generic [ref=e430]:
              - generic [ref=e431]:
                - generic [ref=e432]:
                  - generic [ref=e433]: Deposit (50%)
                  - text: ₹8,55,000
                - generic [ref=e434]: Paid
              - generic [ref=e435]:
                - generic [ref=e436]:
                  - generic [ref=e437]: Mid-Event (25%)
                  - text: ₹4,27,500
                - generic [ref=e438]: Pending
              - generic [ref=e439]:
                - generic [ref=e440]:
                  - generic [ref=e441]: Final (25%)
                  - text: ₹4,27,500
                - generic [ref=e442]: Upcoming
          - generic [ref=e445]:
            - generic [ref=e449]:
              - heading "Event Timelines & Tasks" [level=3] [ref=e450]
              - text: Operations
            - paragraph [ref=e451]: Drag-and-drop task boards. Assign vendors, staff, and photographers to event milestones.
            - generic [ref=e452]:
              - generic [ref=e453]:
                - generic [ref=e454]: 09:00
                - generic [ref=e455]: Team Check-in
              - generic [ref=e457]:
                - generic [ref=e458]: 11:30
                - generic [ref=e459]: Décor Setup
              - generic [ref=e461]:
                - generic [ref=e462]: 14:00
                - generic [ref=e463]: Sound Check
              - generic [ref=e465]:
                - generic [ref=e466]: 17:00
                - generic [ref=e467]: Guest Arrival
          - generic [ref=e471]:
            - generic [ref=e475]:
              - heading "Secure Gallery Delivery" [level=3] [ref=e476]
              - text: Media
            - paragraph [ref=e477]: Cloudinary-powered media albums. Passcode protection, expiry links, and granular download controls.
            - generic [ref=e483]:
              - generic [ref=e484]: Expires in 30 days
              - generic [ref=e485]: Download ZIP →
          - generic [ref=e488]:
            - generic [ref=e492]:
              - heading "White-Label Client Portal" [level=3] [ref=e493]
              - text: Collaboration
            - paragraph [ref=e494]: Dedicated client dashboard. Accept quotes, pay invoices, view timelines — no extra login required.
            - generic [ref=e495]:
              - generic [ref=e496]:
                - generic [ref=e497]: Proposal Status
                - generic [ref=e498]: ✓ Accepted
              - generic [ref=e499]:
                - generic [ref=e500]: Outstanding Payment
                - generic [ref=e501]: ₹50,000
              - button "Pay Now →" [ref=e502] [cursor=pointer]
      - generic [ref=e505]:
        - generic [ref=e506]:
          - generic [ref=e507]: Security & Infrastructure
          - heading "Enterprise-Grade Multi-Tenancy" [level=2] [ref=e508]
          - paragraph [ref=e509]: Engineered to secure tenant environments, protect planner databases, and provide isolated guest spaces for client portal approvals.
        - generic [ref=e510]:
          - generic [ref=e511]:
            - generic [ref=e517]:
              - heading "Workspace Isolation" [level=3] [ref=e518]
              - paragraph [ref=e519]: Each tenant operates in a completely isolated container with separate DB schemas, avoiding any data leaks.
            - generic [ref=e525]:
              - heading "Role-Based Access Control" [level=3] [ref=e526]
              - paragraph [ref=e527]: Granular permissions for Planners, Coordinators, Vendors, and Clients. Limit visibility to relevant documents.
            - generic [ref=e533]:
              - heading "Team Collaboration" [level=3] [ref=e534]
              - paragraph [ref=e535]: Coordinators and planners share tasks, quotes, and timelines in real-time, syncing status updates instantly.
          - generic [ref=e537]:
            - generic [ref=e538]:
              - generic [ref=e539]: WORKSPACE_ROUTING_ROUTER
              - generic [ref=e540]: MFA Secure
            - generic [ref=e542]:
              - generic [ref=e544]: GATEWAY
              - img
              - generic [ref=e547]:
                - 'heading "Planner Tenant #1" [level=4] [ref=e548]'
                - generic [ref=e549]: elite.eventos.io
              - generic [ref=e552]:
                - 'heading "Planner Tenant #2" [level=4] [ref=e553]'
                - generic [ref=e554]: stellar.eventos.io
              - generic [ref=e556]:
                - heading "Schema-Isolated Databases" [level=4] [ref=e557]
                - generic [ref=e558]: Encrypted at rest · TLS 1.3
            - generic [ref=e559]:
              - generic [ref=e562]: "Tenant A: isolated"
              - generic [ref=e565]: "Tenant B: isolated"
              - generic [ref=e568]: Active SSO session
      - generic [ref=e571]:
        - generic [ref=e572]:
          - generic [ref=e573]: White-Label Client Portal
          - heading "Give your clients a premium experience." [level=2] [ref=e574]
          - paragraph [ref=e575]: Every client gets a dedicated, secure portal — no extra app required. They can approve quotes, pay invoices, view timelines, and access galleries in one branded link.
        - generic [ref=e576]:
          - generic [ref=e577]:
            - generic [ref=e578]:
              - paragraph [ref=e579]: Preview Portal View
              - generic [ref=e580]:
                - button "Event Dashboard" [ref=e581] [cursor=pointer]:
                  - generic [ref=e582]: Event Dashboard
                - button "Review Quote" [ref=e583] [cursor=pointer]:
                  - generic [ref=e584]: Review Quote
                - button "Pay Invoice" [ref=e585] [cursor=pointer]:
                  - generic [ref=e586]: Pay Invoice
                - button "View Timeline" [ref=e587] [cursor=pointer]:
                  - generic [ref=e588]: View Timeline
            - generic [ref=e589]:
              - generic [ref=e592]:
                - heading "Isolated & Secure" [level=4] [ref=e593]
                - paragraph [ref=e594]: Each client sees only their data — zero cross-contamination.
              - generic [ref=e597]:
                - heading "Unique Invite Link" [level=4] [ref=e598]
                - paragraph [ref=e599]: One-click setup. Clients register via a secure invitation URL.
              - generic [ref=e602]:
                - heading "Mobile-First Design" [level=4] [ref=e603]
                - paragraph [ref=e604]: Optimized for phones — clients access on-the-go.
              - generic [ref=e607]:
                - heading "White-Label Ready" [level=4] [ref=e608]
                - paragraph [ref=e609]: Custom domain + logo mapping for Growth & Enterprise plans.
            - generic [ref=e610]:
              - button "Try the Portal Demo" [ref=e611] [cursor=pointer]: Try the Portal Demo
              - button "Learn More" [ref=e612] [cursor=pointer]
          - generic [ref=e613]:
            - generic [ref=e614]:
              - generic [ref=e619]: portal.eventos.io/client/preeti-arjun
              - generic [ref=e620]:
                - button "Event Dashboard" [ref=e621] [cursor=pointer]:
                  - generic [ref=e622]: Event Dashboard
                - button "Review Quote" [ref=e623] [cursor=pointer]:
                  - generic [ref=e624]: Review Quote
                - button "Pay Invoice" [ref=e625] [cursor=pointer]:
                  - generic [ref=e626]: Pay Invoice
                - button "View Timeline" [ref=e627] [cursor=pointer]:
                  - generic [ref=e628]: View Timeline
              - generic [ref=e631]:
                - generic [ref=e632]:
                  - generic [ref=e633]:
                    - paragraph [ref=e634]: Client Portal
                    - heading "Preeti & Arjun — Wedding" [level=4] [ref=e635]
                  - generic [ref=e636]: Active
                - generic [ref=e637]:
                  - generic [ref=e638]:
                    - generic [ref=e640]: Event Date
                    - paragraph [ref=e641]: 18 Oct 2026
                  - generic [ref=e642]:
                    - generic [ref=e644]: Venue
                    - paragraph [ref=e645]: Taj Hotel, Delhi
                  - generic [ref=e646]:
                    - generic [ref=e648]: Guest Count
                    - paragraph [ref=e649]: 450 Guests
                  - generic [ref=e650]:
                    - generic [ref=e652]: Planner
                    - paragraph [ref=e653]: Sen Weddings
                - generic [ref=e655]: Your planner has updated the event timeline. Review new changes.
            - generic [ref=e657]:
              - paragraph [ref=e658]: Tenant Isolated
              - paragraph [ref=e659]: Zero data cross-contamination
      - generic [ref=e662]:
        - generic [ref=e663]:
          - generic [ref=e664]:
            - generic [ref=e665]: Dynamic Interfaces
            - heading "Visual tools designed for production velocity." [level=3] [ref=e666]
            - paragraph [ref=e667]: Step into the operating system. Click through our primary client interface views to preview how your team and clients interact.
          - generic [ref=e668]:
            - button "Desktop Preview" [ref=e669] [cursor=pointer]:
              - img [ref=e670]
              - generic [ref=e672]: Desktop
            - button "Mobile Preview" [ref=e673] [cursor=pointer]:
              - img [ref=e674]
              - generic [ref=e676]: Mobile
        - generic [ref=e677]:
          - button "Pipeline Kanban" [ref=e678] [cursor=pointer]:
            - generic [ref=e680]:
              - img [ref=e681]
              - text: Pipeline Kanban
          - button "Event Calendar" [ref=e682] [cursor=pointer]:
            - generic [ref=e683]:
              - img [ref=e684]
              - text: Event Calendar
          - button "Client Portal" [ref=e686] [cursor=pointer]:
            - generic [ref=e687]:
              - img [ref=e688]
              - text: Client Portal
          - button "Media Gallery" [ref=e690] [cursor=pointer]:
            - generic [ref=e691]:
              - img [ref=e692]
              - text: Media Gallery
        - generic [ref=e704]:
          - generic [ref=e706]:
            - heading "CRM Leads Kanban" [level=4] [ref=e707]
            - paragraph [ref=e708]: Drag & drop leads across sales milestones
          - generic [ref=e709]:
            - generic [ref=e710]:
              - generic [ref=e711]:
                - generic [ref=e712]: Inquiries
                - generic [ref=e713]: "3"
              - generic [ref=e714]:
                - generic [ref=e715]:
                  - generic [ref=e716]: Instagram
                  - heading "Riya & Karan" [level=5] [ref=e717]
                  - paragraph [ref=e718]: Wedding Setup
                  - generic [ref=e719]:
                    - generic [ref=e720]: Est. Budget
                    - generic [ref=e721]: ₹15,00,000
                - generic [ref=e722]:
                  - generic [ref=e723]: Website
                  - heading "Microsoft India" [level=5] [ref=e724]
                  - paragraph [ref=e725]: Annual Tech Summit
                  - generic [ref=e726]:
                    - generic [ref=e727]: Est. Budget
                    - generic [ref=e728]: ₹30,00,000
            - generic [ref=e729]:
              - generic [ref=e730]:
                - generic [ref=e731]: Proposal Sent
                - generic [ref=e732]: "2"
              - generic [ref=e734]:
                - generic [ref=e735]: Referral
                - heading "Aanya Verma" [level=5] [ref=e736]
                - paragraph [ref=e737]: Birthday Bash
                - generic [ref=e738]:
                  - generic [ref=e739]: Est. Budget
                  - generic [ref=e740]: ₹5,00,000
            - generic [ref=e741]:
              - generic [ref=e742]:
                - generic [ref=e743]: Booked & Paid
                - generic [ref=e744]: "4"
              - generic [ref=e746]:
                - generic [ref=e747]: Instagram
                - heading "Sanjay Shah" [level=5] [ref=e748]
                - paragraph [ref=e749]: Anniversary Gala
                - generic [ref=e750]:
                  - generic [ref=e751]: Est. Budget
                  - generic [ref=e752]: ₹8,50,000
      - generic [ref=e755]:
        - generic [ref=e756]:
          - generic [ref=e757]: Client Stories
          - generic [ref=e758]:
            - generic [ref=e759]: "5.0"
            - generic [ref=e760]: from 200+ agencies
          - heading "Endorsed by leading production teams." [level=2] [ref=e761]
          - paragraph [ref=e762]: See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
        - generic [ref=e763]:
          - generic [ref=e764]:
            - generic [ref=e765]:
              - generic [ref=e766]:
                - paragraph [ref=e768]: “EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.”
                - generic [ref=e769]:
                  - img "Aparna Sen" [ref=e771]
                  - generic [ref=e772]:
                    - heading "Aparna Sen" [level=4] [ref=e773]
                    - generic [ref=e774]: Founder, Sen Weddings & Co.
              - generic [ref=e775]:
                - paragraph [ref=e777]: “Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.”
                - generic [ref=e778]:
                  - img "Rohan Kapoor" [ref=e780]
                  - generic [ref=e781]:
                    - heading "Rohan Kapoor" [level=4] [ref=e782]
                    - generic [ref=e783]: Operations Lead, Peak Corporate
              - generic [ref=e784]:
                - paragraph [ref=e786]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e787]:
                  - img "Meera Nair" [ref=e789]
                  - generic [ref=e790]:
                    - heading "Meera Nair" [level=4] [ref=e791]
                    - generic [ref=e792]: Creative Director, Vogue Gala
              - generic [ref=e793]:
                - paragraph [ref=e795]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e796]:
                  - img "Vikram Malhotra" [ref=e798]
                  - generic [ref=e799]:
                    - heading "Vikram Malhotra" [level=4] [ref=e800]
                    - generic [ref=e801]: Managing Director, Apex Events India
            - generic [ref=e802]:
              - generic [ref=e803]:
                - paragraph [ref=e805]: “EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.”
                - generic [ref=e806]:
                  - img "Aparna Sen" [ref=e808]
                  - generic [ref=e809]:
                    - heading "Aparna Sen" [level=4] [ref=e810]
                    - generic [ref=e811]: Founder, Sen Weddings & Co.
              - generic [ref=e812]:
                - paragraph [ref=e814]: “Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.”
                - generic [ref=e815]:
                  - img "Rohan Kapoor" [ref=e817]
                  - generic [ref=e818]:
                    - heading "Rohan Kapoor" [level=4] [ref=e819]
                    - generic [ref=e820]: Operations Lead, Peak Corporate
              - generic [ref=e821]:
                - paragraph [ref=e823]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e824]:
                  - img "Meera Nair" [ref=e826]
                  - generic [ref=e827]:
                    - heading "Meera Nair" [level=4] [ref=e828]
                    - generic [ref=e829]: Creative Director, Vogue Gala
              - generic [ref=e830]:
                - paragraph [ref=e832]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e833]:
                  - img "Vikram Malhotra" [ref=e835]
                  - generic [ref=e836]:
                    - heading "Vikram Malhotra" [level=4] [ref=e837]
                    - generic [ref=e838]: Managing Director, Apex Events India
            - generic [ref=e839]:
              - generic [ref=e840]:
                - paragraph [ref=e842]: “EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.”
                - generic [ref=e843]:
                  - img "Aparna Sen" [ref=e845]
                  - generic [ref=e846]:
                    - heading "Aparna Sen" [level=4] [ref=e847]
                    - generic [ref=e848]: Founder, Sen Weddings & Co.
              - generic [ref=e849]:
                - paragraph [ref=e851]: “Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.”
                - generic [ref=e852]:
                  - img "Rohan Kapoor" [ref=e854]
                  - generic [ref=e855]:
                    - heading "Rohan Kapoor" [level=4] [ref=e856]
                    - generic [ref=e857]: Operations Lead, Peak Corporate
              - generic [ref=e858]:
                - paragraph [ref=e860]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e861]:
                  - img "Meera Nair" [ref=e863]
                  - generic [ref=e864]:
                    - heading "Meera Nair" [level=4] [ref=e865]
                    - generic [ref=e866]: Creative Director, Vogue Gala
              - generic [ref=e867]:
                - paragraph [ref=e869]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e870]:
                  - img "Vikram Malhotra" [ref=e872]
                  - generic [ref=e873]:
                    - heading "Vikram Malhotra" [level=4] [ref=e874]
                    - generic [ref=e875]: Managing Director, Apex Events India
            - generic [ref=e876]:
              - generic [ref=e877]:
                - paragraph [ref=e879]: “EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.”
                - generic [ref=e880]:
                  - img "Aparna Sen" [ref=e882]
                  - generic [ref=e883]:
                    - heading "Aparna Sen" [level=4] [ref=e884]
                    - generic [ref=e885]: Founder, Sen Weddings & Co.
              - generic [ref=e886]:
                - paragraph [ref=e888]: “Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.”
                - generic [ref=e889]:
                  - img "Rohan Kapoor" [ref=e891]
                  - generic [ref=e892]:
                    - heading "Rohan Kapoor" [level=4] [ref=e893]
                    - generic [ref=e894]: Operations Lead, Peak Corporate
              - generic [ref=e895]:
                - paragraph [ref=e897]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e898]:
                  - img "Meera Nair" [ref=e900]
                  - generic [ref=e901]:
                    - heading "Meera Nair" [level=4] [ref=e902]
                    - generic [ref=e903]: Creative Director, Vogue Gala
              - generic [ref=e904]:
                - paragraph [ref=e906]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e907]:
                  - img "Vikram Malhotra" [ref=e909]
                  - generic [ref=e910]:
                    - heading "Vikram Malhotra" [level=4] [ref=e911]
                    - generic [ref=e912]: Managing Director, Apex Events India
          - generic [ref=e913]:
            - generic [ref=e914]:
              - generic [ref=e915]:
                - paragraph [ref=e917]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e918]:
                  - img "Meera Nair" [ref=e920]
                  - generic [ref=e921]:
                    - heading "Meera Nair" [level=4] [ref=e922]
                    - generic [ref=e923]: Creative Director, Vogue Gala
              - generic [ref=e924]:
                - paragraph [ref=e926]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e927]:
                  - img "Vikram Malhotra" [ref=e929]
                  - generic [ref=e930]:
                    - heading "Vikram Malhotra" [level=4] [ref=e931]
                    - generic [ref=e932]: Managing Director, Apex Events India
              - generic [ref=e933]:
                - paragraph [ref=e935]: “Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.”
                - generic [ref=e936]:
                  - img "Sanya Gupta" [ref=e938]
                  - generic [ref=e939]:
                    - heading "Sanya Gupta" [level=4] [ref=e940]
                    - generic [ref=e941]: Principal Planner, Luxe Soirees
              - generic [ref=e942]:
                - paragraph [ref=e944]: “We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.”
                - generic [ref=e945]:
                  - img "Arjun Mehta" [ref=e947]
                  - generic [ref=e948]:
                    - heading "Arjun Mehta" [level=4] [ref=e949]
                    - generic [ref=e950]: Co-founder, EliteDecor Events
            - generic [ref=e951]:
              - generic [ref=e952]:
                - paragraph [ref=e954]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e955]:
                  - img "Meera Nair" [ref=e957]
                  - generic [ref=e958]:
                    - heading "Meera Nair" [level=4] [ref=e959]
                    - generic [ref=e960]: Creative Director, Vogue Gala
              - generic [ref=e961]:
                - paragraph [ref=e963]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e964]:
                  - img "Vikram Malhotra" [ref=e966]
                  - generic [ref=e967]:
                    - heading "Vikram Malhotra" [level=4] [ref=e968]
                    - generic [ref=e969]: Managing Director, Apex Events India
              - generic [ref=e970]:
                - paragraph [ref=e972]: “Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.”
                - generic [ref=e973]:
                  - img "Sanya Gupta" [ref=e975]
                  - generic [ref=e976]:
                    - heading "Sanya Gupta" [level=4] [ref=e977]
                    - generic [ref=e978]: Principal Planner, Luxe Soirees
              - generic [ref=e979]:
                - paragraph [ref=e981]: “We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.”
                - generic [ref=e982]:
                  - img "Arjun Mehta" [ref=e984]
                  - generic [ref=e985]:
                    - heading "Arjun Mehta" [level=4] [ref=e986]
                    - generic [ref=e987]: Co-founder, EliteDecor Events
            - generic [ref=e988]:
              - generic [ref=e989]:
                - paragraph [ref=e991]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e992]:
                  - img "Meera Nair" [ref=e994]
                  - generic [ref=e995]:
                    - heading "Meera Nair" [level=4] [ref=e996]
                    - generic [ref=e997]: Creative Director, Vogue Gala
              - generic [ref=e998]:
                - paragraph [ref=e1000]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e1001]:
                  - img "Vikram Malhotra" [ref=e1003]
                  - generic [ref=e1004]:
                    - heading "Vikram Malhotra" [level=4] [ref=e1005]
                    - generic [ref=e1006]: Managing Director, Apex Events India
              - generic [ref=e1007]:
                - paragraph [ref=e1009]: “Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.”
                - generic [ref=e1010]:
                  - img "Sanya Gupta" [ref=e1012]
                  - generic [ref=e1013]:
                    - heading "Sanya Gupta" [level=4] [ref=e1014]
                    - generic [ref=e1015]: Principal Planner, Luxe Soirees
              - generic [ref=e1016]:
                - paragraph [ref=e1018]: “We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.”
                - generic [ref=e1019]:
                  - img "Arjun Mehta" [ref=e1021]
                  - generic [ref=e1022]:
                    - heading "Arjun Mehta" [level=4] [ref=e1023]
                    - generic [ref=e1024]: Co-founder, EliteDecor Events
            - generic [ref=e1025]:
              - generic [ref=e1026]:
                - paragraph [ref=e1028]: “The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.”
                - generic [ref=e1029]:
                  - img "Meera Nair" [ref=e1031]
                  - generic [ref=e1032]:
                    - heading "Meera Nair" [level=4] [ref=e1033]
                    - generic [ref=e1034]: Creative Director, Vogue Gala
              - generic [ref=e1035]:
                - paragraph [ref=e1037]: “Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.”
                - generic [ref=e1038]:
                  - img "Vikram Malhotra" [ref=e1040]
                  - generic [ref=e1041]:
                    - heading "Vikram Malhotra" [level=4] [ref=e1042]
                    - generic [ref=e1043]: Managing Director, Apex Events India
              - generic [ref=e1044]:
                - paragraph [ref=e1046]: “Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.”
                - generic [ref=e1047]:
                  - img "Sanya Gupta" [ref=e1049]
                  - generic [ref=e1050]:
                    - heading "Sanya Gupta" [level=4] [ref=e1051]
                    - generic [ref=e1052]: Principal Planner, Luxe Soirees
              - generic [ref=e1053]:
                - paragraph [ref=e1055]: “We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.”
                - generic [ref=e1056]:
                  - img "Arjun Mehta" [ref=e1058]
                  - generic [ref=e1059]:
                    - heading "Arjun Mehta" [level=4] [ref=e1060]
                    - generic [ref=e1061]: Co-founder, EliteDecor Events
      - generic [ref=e1064]:
        - generic [ref=e1065]:
          - generic [ref=e1066]: Flexible Pricing
          - heading "Transparent pricing for teams of all sizes." [level=3] [ref=e1067]
          - paragraph [ref=e1068]: All plans include tenant database isolation, secure SSL connections, and core dashboard functionality. Choose a tier to scale your operations.
          - generic [ref=e1070]:
            - button "Monthly" [ref=e1071] [cursor=pointer]
            - button "Annually -20%" [ref=e1072] [cursor=pointer]:
              - generic [ref=e1073]: Annually
              - generic [ref=e1074]: "-20%"
        - generic [ref=e1075]:
          - generic [ref=e1076]:
            - generic [ref=e1077]:
              - generic [ref=e1078]:
                - heading "Free" [level=4] [ref=e1079]
                - paragraph [ref=e1080]: For newly launched event coordinators getting off the ground.
              - generic [ref=e1081]:
                - generic [ref=e1082]: $0
                - generic [ref=e1083]: /mo
              - list "Features of Free plan" [ref=e1085]:
                - listitem [ref=e1086]:
                  - img [ref=e1087]
                  - generic [ref=e1089]: 2 Active Events
                - listitem [ref=e1090]:
                  - img [ref=e1091]
                  - generic [ref=e1093]: 1 Team seat
                - listitem [ref=e1094]:
                  - img [ref=e1095]
                  - generic [ref=e1097]: 5 GB Media storage quota
                - listitem [ref=e1098]:
                  - img [ref=e1099]
                  - generic [ref=e1101]: Standard client portal access
                - listitem [ref=e1102]:
                  - img [ref=e1103]
                  - generic [ref=e1105]: Standard email invoices
            - button "Start Free" [ref=e1107] [cursor=pointer]
          - generic [ref=e1108]:
            - generic [ref=e1109]:
              - generic [ref=e1110]:
                - heading "Starter" [level=4] [ref=e1111]
                - paragraph [ref=e1112]: Perfect for independent planners managing multiple schedules.
              - generic [ref=e1113]:
                - generic [ref=e1114]: $39
                - generic [ref=e1115]: /mo
              - list "Features of Starter plan" [ref=e1117]:
                - listitem [ref=e1118]:
                  - img [ref=e1119]
                  - generic [ref=e1121]: 5 Active Events
                - listitem [ref=e1122]:
                  - img [ref=e1123]
                  - generic [ref=e1125]: 2 Team seats
                - listitem [ref=e1126]:
                  - img [ref=e1127]
                  - generic [ref=e1129]: 20 GB Media storage quota
                - listitem [ref=e1130]:
                  - img [ref=e1131]
                  - generic [ref=e1133]: Milestone payments clearing
                - listitem [ref=e1134]:
                  - img [ref=e1135]
                  - generic [ref=e1137]: Automated contract signing
                - listitem [ref=e1138]:
                  - img [ref=e1139]
                  - generic [ref=e1141]: Standard email support
            - button "Start Free Trial" [ref=e1143] [cursor=pointer]
          - generic [ref=e1144]:
            - generic [ref=e1145]: Most Popular
            - generic [ref=e1146]:
              - generic [ref=e1147]:
                - heading "Professional" [level=4] [ref=e1148]
                - paragraph [ref=e1149]: Our most popular package for active event organizations.
              - generic [ref=e1150]:
                - generic [ref=e1151]: $99
                - generic [ref=e1152]: /mo
              - list "Features of Professional plan" [ref=e1154]:
                - listitem [ref=e1155]:
                  - img [ref=e1156]
                  - generic [ref=e1158]: 20 Active Events
                - listitem [ref=e1159]:
                  - img [ref=e1160]
                  - generic [ref=e1162]: 5 Team seats
                - listitem [ref=e1163]:
                  - img [ref=e1164]
                  - generic [ref=e1166]: 100 GB Media storage quota
                - listitem [ref=e1167]:
                  - img [ref=e1168]
                  - generic [ref=e1170]: AI Assistant operations advisor
                - listitem [ref=e1171]:
                  - img [ref=e1172]
                  - generic [ref=e1174]: Interactive custom quotes editor
                - listitem [ref=e1175]:
                  - img [ref=e1176]
                  - generic [ref=e1178]: Priority support queue SLA
            - button "Start Free Trial" [ref=e1180] [cursor=pointer]
          - generic [ref=e1181]:
            - generic [ref=e1182]:
              - generic [ref=e1183]:
                - heading "Business" [level=4] [ref=e1184]
                - paragraph [ref=e1185]: For established production houses requiring custom domains.
              - generic [ref=e1186]:
                - generic [ref=e1187]: $189
                - generic [ref=e1188]: /mo
              - list "Features of Business plan" [ref=e1190]:
                - listitem [ref=e1191]:
                  - img [ref=e1192]
                  - generic [ref=e1194]: 50 Active Events
                - listitem [ref=e1195]:
                  - img [ref=e1196]
                  - generic [ref=e1198]: 15 Team seats
                - listitem [ref=e1199]:
                  - img [ref=e1200]
                  - generic [ref=e1202]: 500 GB Media storage quota
                - listitem [ref=e1203]:
                  - img [ref=e1204]
                  - generic [ref=e1206]: Custom white-labeled domains
                - listitem [ref=e1207]:
                  - img [ref=e1208]
                  - generic [ref=e1210]: Developer API & webhooks access
                - listitem [ref=e1211]:
                  - img [ref=e1212]
                  - generic [ref=e1214]: 24/7 dedicated support channels
            - button "Start Free Trial" [ref=e1216] [cursor=pointer]
          - generic [ref=e1217]:
            - generic [ref=e1218]:
              - generic [ref=e1219]:
                - heading "Enterprise" [level=4] [ref=e1220]
                - paragraph [ref=e1221]: Custom structures for global scale agency workloads.
              - generic [ref=e1223]: Custom
              - list "Features of Enterprise plan" [ref=e1225]:
                - listitem [ref=e1226]:
                  - img [ref=e1227]
                  - generic [ref=e1229]: Unlimited Active Events
                - listitem [ref=e1230]:
                  - img [ref=e1231]
                  - generic [ref=e1233]: Unlimited Team seats
                - listitem [ref=e1234]:
                  - img [ref=e1235]
                  - generic [ref=e1237]: Dedicated AWS storage assets
                - listitem [ref=e1238]:
                  - img [ref=e1239]
                  - generic [ref=e1241]: Custom AI training parameters
                - listitem [ref=e1242]:
                  - img [ref=e1243]
                  - generic [ref=e1245]: Multi-tenant tenant isolation
                - listitem [ref=e1246]:
                  - img [ref=e1247]
                  - generic [ref=e1249]: Dedicated SLA accounts manager
            - button "Contact Sales" [ref=e1251] [cursor=pointer]
      - generic [ref=e1253]:
        - generic [ref=e1254]:
          - generic [ref=e1255]: Subscription Consolidator
          - heading "Ditch fragmented bills. Reclaim control." [level=3] [ref=e1256]
          - paragraph [ref=e1257]: Why event Planners and photography studio collectives waste ₹28,000+/mo across disconnected tools, and how EventOS replaces them under a single architecture.
        - table [ref=e1259]:
          - rowgroup [ref=e1260]:
            - row "Feature Sets EventOS HoneyBook HubSpot ClickUp Pixieset QuickBooks" [ref=e1261]:
              - columnheader "Feature Sets" [ref=e1262]
              - columnheader "EventOS" [ref=e1263]
              - columnheader "HoneyBook" [ref=e1264]
              - columnheader "HubSpot" [ref=e1265]
              - columnheader "ClickUp" [ref=e1266]
              - columnheader "Pixieset" [ref=e1267]
              - columnheader "QuickBooks" [ref=e1268]
          - rowgroup [ref=e1269]:
            - row "Consolidated Workspace (CRM + Ledger + Gallery) ✔ Yes ✕ No ✕ No ✕ No ✕ No ✕ No" [ref=e1270]:
              - cell "Consolidated Workspace (CRM + Ledger + Gallery)" [ref=e1271]
              - cell "✔ Yes" [ref=e1272]
              - cell "✕ No" [ref=e1273]
              - cell "✕ No" [ref=e1274]
              - cell "✕ No" [ref=e1275]
              - cell "✕ No" [ref=e1276]
              - cell "✕ No" [ref=e1277]
            - row "Schema-Based Multi-Tenant DB Isolation ✔ Yes (Private Schema) ✕ Shared DB ✕ Shared DB ✕ Shared DB ✕ Shared DB ✕ Shared DB" [ref=e1278]:
              - cell "Schema-Based Multi-Tenant DB Isolation" [ref=e1279]
              - cell "✔ Yes (Private Schema)" [ref=e1280]
              - cell "✕ Shared DB" [ref=e1281]
              - cell "✕ Shared DB" [ref=e1282]
              - cell "✕ Shared DB" [ref=e1283]
              - cell "✕ Shared DB" [ref=e1284]
              - cell "✕ Shared DB" [ref=e1285]
            - row "High-Res proofing galleries CDN integration ✔ Yes (AWS S3/CloudFront) ✕ No ✕ No ✕ No ✔ Yes ✕ No" [ref=e1286]:
              - cell "High-Res proofing galleries CDN integration" [ref=e1287]
              - cell "✔ Yes (AWS S3/CloudFront)" [ref=e1288]
              - cell "✕ No" [ref=e1289]
              - cell "✕ No" [ref=e1290]
              - cell "✕ No" [ref=e1291]
              - cell "✔ Yes" [ref=e1292]
              - cell "✕ No" [ref=e1293]
            - row "Timeline Overlap Scheduling Alerts ✔ Yes (WebSocket sync) ✕ No ✕ No ✔ Yes (Basic) ✕ No ✕ No" [ref=e1294]:
              - cell "Timeline Overlap Scheduling Alerts" [ref=e1295]
              - cell "✔ Yes (WebSocket sync)" [ref=e1296]
              - cell "✕ No" [ref=e1297]
              - cell "✕ No" [ref=e1298]
              - cell "✔ Yes (Basic)" [ref=e1299]
              - cell "✕ No" [ref=e1300]
              - cell "✕ No" [ref=e1301]
            - row "Milestone Proposal contract acceptance ✔ Yes (Secure E-Sign) ✔ Yes ✕ No ✕ No ✕ No ✕ No" [ref=e1302]:
              - cell "Milestone Proposal contract acceptance" [ref=e1303]
              - cell "✔ Yes (Secure E-Sign)" [ref=e1304]
              - cell "✔ Yes" [ref=e1305]
              - cell "✕ No" [ref=e1306]
              - cell "✕ No" [ref=e1307]
              - cell "✕ No" [ref=e1308]
              - cell "✕ No" [ref=e1309]
            - row "Unified Operational Monthly Cost ₹1,999 / mo ₹3,200 / mo ₹7,500 / mo ₹1,500 / mo ₹2,500 / mo ₹2,200 / mo" [ref=e1310]:
              - cell "Unified Operational Monthly Cost" [ref=e1311]
              - cell "₹1,999 / mo" [ref=e1312]
              - cell "₹3,200 / mo" [ref=e1313]
              - cell "₹7,500 / mo" [ref=e1314]
              - cell "₹1,500 / mo" [ref=e1315]
              - cell "₹2,500 / mo" [ref=e1316]
              - cell "₹2,200 / mo" [ref=e1317]
      - generic [ref=e1321]:
        - generic [ref=e1322]:
          - generic [ref=e1323]:
            - generic [ref=e1324]: Get In Touch
            - heading "Let's scale your event enterprise together." [level=2] [ref=e1325]
            - paragraph [ref=e1326]: Have questions about custom features, workflow migrations, or enterprise workspace setups? Drop us a line. Our team is here to assist.
          - generic [ref=e1327]:
            - generic [ref=e1330]:
              - heading "Email Us" [level=4] [ref=e1331]
              - paragraph [ref=e1332]: Response within 12 hours
              - link "hello@eventos.io" [ref=e1333] [cursor=pointer]:
                - /url: mailto:hello@eventos.io
            - generic [ref=e1336]:
              - heading "Support Hours" [level=4] [ref=e1337]
              - paragraph [ref=e1338]: Global operational times
              - paragraph [ref=e1339]: Monday – Friday, 9:00 AM – 6:00 PM (SGT)
            - generic [ref=e1342]:
              - heading "HQ Office" [level=4] [ref=e1343]
              - paragraph [ref=e1344]: Physical business base
              - paragraph [ref=e1345]: Singapore, Central Business District
        - generic [ref=e1348]:
          - generic [ref=e1349]:
            - generic [ref=e1350]:
              - generic [ref=e1351]: Full Name *
              - textbox "Full Name *" [ref=e1352]:
                - /placeholder: Jane Doe
            - generic [ref=e1353]:
              - generic [ref=e1354]: Business Email *
              - textbox "Business Email *" [ref=e1355]:
                - /placeholder: jane@company.com
          - generic [ref=e1356]:
            - text: Team Size
            - combobox "Team Size" [ref=e1358] [cursor=pointer]:
              - option "1 – 5 planners" [selected]
              - option "6 – 15 planners"
              - option "16 – 50 planners"
              - option "50+ planners"
          - generic [ref=e1359]:
            - generic [ref=e1360]: Message *
            - textbox "Message *" [ref=e1361]:
              - /placeholder: Tell us about your events team and how we can support you...
          - button "Submit Inquiry" [ref=e1362] [cursor=pointer]:
            - generic [ref=e1363]: Submit Inquiry
      - generic [ref=e1367]:
        - generic [ref=e1368]: Free 14-Day Trial — No Credit Card Required
        - generic [ref=e1369]:
          - heading "Streamline your event operations today." [level=2] [ref=e1370]:
            - text: Streamline your event
            - text: operations today.
          - paragraph [ref=e1371]: Connect your team, coordinate vendors, and delight clients from a single secure workspace. Cancel anytime, no lock-in.
        - generic [ref=e1372]:
          - generic [ref=e1373]: Email address
          - textbox "Email address" [ref=e1375]:
            - /placeholder: Enter your agency email
          - button "Get Started" [ref=e1376] [cursor=pointer]: Get Started
        - generic [ref=e1377]:
          - generic [ref=e1378]: SSL Encrypted
          - generic [ref=e1379]: •
          - generic [ref=e1380]: SaaS Multi-Tenancy
          - generic [ref=e1381]: •
          - generic [ref=e1382]: 100% Isolated Data
          - generic [ref=e1383]: •
          - generic [ref=e1384]: No Credit Card
    - contentinfo [ref=e1385]:
      - generic [ref=e1386]:
        - generic [ref=e1387]:
          - link "EventOS Home" [ref=e1388] [cursor=pointer]:
            - img "EO" [ref=e1389]
            - generic [ref=e1391]:
              - heading "Event OS" [level=4] [ref=e1392]:
                - text: Event
                - generic [ref=e1393]: OS
              - generic [ref=e1394]: MANAGE. ENGAGE. ELEVATE.
          - paragraph [ref=e1395]: EventOS is the all-in-one operating system for event planners, wedding agencies, and production teams. Tenant-isolated, secure, and built for scale.
          - generic [ref=e1396]:
            - link "EventOS on X/Twitter" [ref=e1397] [cursor=pointer]:
              - /url: https://twitter.com
            - link "EventOS on GitHub" [ref=e1398] [cursor=pointer]:
              - /url: https://github.com
            - link "EventOS on LinkedIn" [ref=e1399] [cursor=pointer]:
              - /url: https://linkedin.com
            - link "EventOS on Instagram" [ref=e1400] [cursor=pointer]:
              - /url: https://instagram.com
          - generic [ref=e1401]: All systems operational
        - generic [ref=e1403]:
          - heading "Product" [level=5] [ref=e1404]
          - list [ref=e1405]:
            - listitem [ref=e1406]:
              - link "CRM & Leads" [ref=e1407] [cursor=pointer]:
                - /url: "#features"
                - text: CRM & Leads
            - listitem [ref=e1408]:
              - link "Smart Quotes" [ref=e1409] [cursor=pointer]:
                - /url: "#features"
                - text: Smart Quotes
            - listitem [ref=e1410]:
              - link "Task Timelines" [ref=e1411] [cursor=pointer]:
                - /url: "#workflow"
                - text: Task Timelines
            - listitem [ref=e1412]:
              - link "Modules Suite" [ref=e1413] [cursor=pointer]:
                - /url: "#modules"
                - text: Modules Suite
            - listitem [ref=e1414]:
              - link "Gallery Delivery" [ref=e1415] [cursor=pointer]:
                - /url: "#features"
                - text: Gallery Delivery
        - generic [ref=e1416]:
          - heading "Company" [level=5] [ref=e1417]
          - list [ref=e1418]:
            - listitem [ref=e1419]:
              - link "About Us" [ref=e1420] [cursor=pointer]:
                - /url: /about
                - text: About Us
            - listitem [ref=e1421]:
              - link "Templates Center" [ref=e1422] [cursor=pointer]:
                - /url: /resources
                - text: Templates Center
            - listitem [ref=e1423]:
              - link "Platform Security" [ref=e1424] [cursor=pointer]:
                - /url: /security
                - text: Platform Security
            - listitem [ref=e1425]:
              - link "System Status" [ref=e1426] [cursor=pointer]:
                - /url: /status
                - text: System Status
        - generic [ref=e1427]:
          - heading "Legal" [level=5] [ref=e1428]
          - list [ref=e1429]:
            - listitem [ref=e1430]:
              - link "Privacy Policy" [ref=e1431] [cursor=pointer]:
                - /url: /privacy
                - text: Privacy Policy
            - listitem [ref=e1432]:
              - link "Terms of Service" [ref=e1433] [cursor=pointer]:
                - /url: /terms
                - text: Terms of Service
            - listitem [ref=e1434]:
              - link "Tenant SLA" [ref=e1435] [cursor=pointer]:
                - /url: /sla
                - text: Tenant SLA
            - listitem [ref=e1436]:
              - link "Cookie Policy" [ref=e1437] [cursor=pointer]:
                - /url: /cookies
                - text: Cookie Policy
      - generic [ref=e1438]:
        - generic [ref=e1439]: © 2026 EventOS Business Suite. All rights reserved.
        - generic [ref=e1440]:
          - generic [ref=e1441]: "Build: v1.1.0-prod"
          - generic [ref=e1442]: •
          - generic [ref=e1443]: "Server Region: IN-WEST"
  - button "EventOS AI Co-pilot" [ref=e1444] [cursor=pointer]:
    - img [ref=e1445]
    - generic: EventOS AI Co-pilot
  - button "Workspace Setup (0%)" [ref=e1450] [cursor=pointer]:
    - img [ref=e1451]
    - generic [ref=e1454]: Workspace Setup (0%)
    - img [ref=e1455]
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
> 36  |     await page.goto('/workspace-select');
      |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/workspace-select
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
  84  |     await page.click('button[type="submit"]');
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
```