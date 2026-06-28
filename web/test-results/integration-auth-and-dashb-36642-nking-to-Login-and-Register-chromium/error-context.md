# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should display Landing Page with CTAs linking to Login and Register
- Location: tests\integration\auth-and-dashboard.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Start Free Trial')
Expected: visible
Error: strict mode violation: locator('text=Start Free Trial') resolved to 4 elements:
    1) <button data-slot="button" data-size="default" data-variant="default" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destruc…>Start Free Trial</button> aka getByRole('banner').getByRole('button', { name: 'Start Free Trial' })
    2) <button data-slot="button" data-size="default" data-variant="default" class="group/button shrink-0 border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructi…>…</button> aka getByRole('button', { name: 'Start Free Trial' }).nth(1)
    3) <button data-slot="button" data-size="default" data-variant="default" class="group/button inline-flex shrink-0 items-center justify-center bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:…>Start Free Trial</button> aka getByRole('button', { name: 'Start Free Trial' }).nth(2)
    4) <button data-slot="button" data-size="default" data-variant="default" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destruc…>Start Free Trial</button> aka getByRole('button', { name: 'Start Free Trial' }).nth(3)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Start Free Trial')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - generic "EventOS Home" [ref=e5] [cursor=pointer]:
        - generic [ref=e6]: E
        - generic [ref=e7]:
          - heading "EventOS" [level=1] [ref=e8]
          - generic [ref=e9]: Business Suite
      - navigation "Main Navigation" [ref=e10]:
        - link "Features" [ref=e11] [cursor=pointer]:
          - /url: "#features"
        - link "Workflow" [ref=e12] [cursor=pointer]:
          - /url: "#workflow"
        - link "Showcase" [ref=e13] [cursor=pointer]:
          - /url: "#showcase"
        - link "Testimonials" [ref=e14] [cursor=pointer]:
          - /url: "#testimonials"
        - link "Pricing" [ref=e15] [cursor=pointer]:
          - /url: "#pricing"
        - link "FAQ" [ref=e16] [cursor=pointer]:
          - /url: "#faq"
      - generic [ref=e17]:
        - button "Sign In" [ref=e18] [cursor=pointer]
        - button "Start Free Trial" [ref=e19] [cursor=pointer]
  - main [ref=e20]:
    - generic [ref=e22]:
      - generic [ref=e23]:
        - img
      - generic [ref=e24]:
        - generic [ref=e25]:
          - img [ref=e29]
          - generic [ref=e31]: The Operating System for Events
        - generic [ref=e32]:
          - heading "Run your entire event business from a single platform." [level=2] [ref=e33]:
            - text: Run your entire event business
            - text: from a single platform.
          - paragraph [ref=e34]: Manage leads, bookings, invoices, galleries, payments, and client communication in one place. Engineered for event planners, wedding agencies, and production teams.
        - generic [ref=e35]:
          - button "Start Free Trial" [ref=e36] [cursor=pointer]:
            - text: Start Free Trial
            - img
          - button "Book a Demo" [ref=e37] [cursor=pointer]:
            - img
            - text: Book a Demo
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]: ●
              - generic [ref=e43]: ●
              - generic [ref=e44]: ●
              - generic [ref=e45]: admin.eventos.io/dashboard
            - generic [ref=e46]:
              - img [ref=e47]
              - generic [ref=e49]: "Tenant Isolation: active"
          - generic [ref=e51]:
            - generic [ref=e52]:
              - generic [ref=e53]:
                - text: Workspace Dashboard
                - heading "Event Command Center" [level=4] [ref=e54]
              - generic [ref=e55]:
                - generic [ref=e56] [cursor=pointer]: Q
                - generic [ref=e57] [cursor=pointer]: B
            - generic [ref=e58]:
              - generic [ref=e59]:
                - generic [ref=e60]: Lead Conversion Pipeline
                - generic [ref=e61]:
                  - generic [ref=e62]: 84.2%
                  - generic [ref=e63]:
                    - generic [ref=e64]: ↑ +4.2%
                    - generic [ref=e65]: vs last month
              - generic [ref=e66]:
                - generic [ref=e67]: Active Event Bookings
                - generic [ref=e68]:
                  - generic [ref=e69]: 142 Projects
                  - generic [ref=e70]: 32 Wedding receptions, 110 corporate galas
              - generic [ref=e71]:
                - generic [ref=e72]: Projected Revenue
                - generic [ref=e73]:
                  - generic [ref=e74]: ₹8.4M
                  - generic [ref=e75]: "Invoiced payments cleared: ₹7.2M"
            - generic [ref=e76]:
              - generic [ref=e77]:
                - generic [ref=e79]: "Live Status Feed:"
                - generic [ref=e80]: "Quote #QT-2026-041 has been accepted by client (Sanjay Shah)"
              - generic [ref=e81] [cursor=pointer]: View CRM Pipeline →
        - generic [ref=e83]:
          - generic [ref=e86]:
            - generic [ref=e87]:
              - generic [ref=e88]: 10,000+
              - heading "Events Managed" [level=5] [ref=e89]
              - paragraph [ref=e90]: Planners, weddings, & galas
            - img [ref=e92]
          - generic [ref=e99]:
            - generic [ref=e100]:
              - generic [ref=e101]: ₹500Cr+
              - heading "Revenue Processed" [level=5] [ref=e102]
              - paragraph [ref=e103]: Secure tenant payments
            - img [ref=e105]
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e111]: 98%
              - heading "Client Satisfaction" [level=5] [ref=e112]
              - paragraph [ref=e113]: Outstanding NPS index
            - img [ref=e115]
    - generic [ref=e119]:
      - paragraph [ref=e120]: Trusted by high-end planners, luxury wedding agencies, and production teams globally
      - generic [ref=e122]:
        - generic [ref=e123]:
          - generic [ref=e124]:
            - img [ref=e126]
            - generic [ref=e128]: Vogue Weddings
          - generic [ref=e129]:
            - img [ref=e131]
            - generic [ref=e133]: Apex Productions
          - generic [ref=e134]:
            - img [ref=e136]
            - generic [ref=e138]: Echo Planners
          - generic [ref=e139]:
            - img [ref=e141]
            - generic [ref=e144]: Horizon Galas
          - generic [ref=e145]:
            - img [ref=e147]
            - generic [ref=e149]: Starlight Agency
          - generic [ref=e150]:
            - img [ref=e152]
            - generic [ref=e155]: Nova Premium Events
        - generic [ref=e156]:
          - generic [ref=e157]:
            - img [ref=e159]
            - generic [ref=e161]: Vogue Weddings
          - generic [ref=e162]:
            - img [ref=e164]
            - generic [ref=e166]: Apex Productions
          - generic [ref=e167]:
            - img [ref=e169]
            - generic [ref=e171]: Echo Planners
          - generic [ref=e172]:
            - img [ref=e174]
            - generic [ref=e177]: Horizon Galas
          - generic [ref=e178]:
            - img [ref=e180]
            - generic [ref=e182]: Starlight Agency
          - generic [ref=e183]:
            - img [ref=e185]
            - generic [ref=e188]: Nova Premium Events
        - generic [ref=e189]:
          - generic [ref=e190]:
            - img [ref=e192]
            - generic [ref=e194]: Vogue Weddings
          - generic [ref=e195]:
            - img [ref=e197]
            - generic [ref=e199]: Apex Productions
          - generic [ref=e200]:
            - img [ref=e202]
            - generic [ref=e204]: Echo Planners
          - generic [ref=e205]:
            - img [ref=e207]
            - generic [ref=e210]: Horizon Galas
          - generic [ref=e211]:
            - img [ref=e213]
            - generic [ref=e215]: Starlight Agency
          - generic [ref=e216]:
            - img [ref=e218]
            - generic [ref=e221]: Nova Premium Events
        - generic [ref=e222]:
          - generic [ref=e223]:
            - img [ref=e225]
            - generic [ref=e227]: Vogue Weddings
          - generic [ref=e228]:
            - img [ref=e230]
            - generic [ref=e232]: Apex Productions
          - generic [ref=e233]:
            - img [ref=e235]
            - generic [ref=e237]: Echo Planners
          - generic [ref=e238]:
            - img [ref=e240]
            - generic [ref=e243]: Horizon Galas
          - generic [ref=e244]:
            - img [ref=e246]
            - generic [ref=e248]: Starlight Agency
          - generic [ref=e249]:
            - img [ref=e251]
            - generic [ref=e254]: Nova Premium Events
    - generic [ref=e257]:
      - generic [ref=e258]:
        - generic [ref=e259]: End-to-End Operating System
        - heading "Everything your agency needs, in one single workspace." [level=3] [ref=e260]
        - paragraph [ref=e261]: Stop stitching together 6 different subscriptions. EventOS brings leads, proposals, timelines, invoices, client portals, and secure gallery sharing into a single tenant database.
      - generic [ref=e262]:
        - generic [ref=e264]:
          - generic [ref=e265]:
            - img [ref=e267]
            - generic [ref=e272]: Pipeline
          - generic [ref=e273]:
            - heading "CRM & Lead Pipeline" [level=4] [ref=e274]
            - paragraph [ref=e275]: Visual Kanban board tracking prospective clients, budgets, dates, and deal stages. Never let an event lead slip through.
        - generic [ref=e277]:
          - generic [ref=e278]:
            - img [ref=e280]
            - generic [ref=e283]: Conversion
          - generic [ref=e284]:
            - heading "Smart Quotes & Proposals" [level=4] [ref=e285]
            - paragraph [ref=e286]: Draft professional digital estimates. Send line-item proposals with digital signature acceptance and automatic lead conversion.
        - generic [ref=e288]:
          - generic [ref=e289]:
            - img [ref=e291]
            - generic [ref=e293]: Operations
          - generic [ref=e294]:
            - heading "Event Timelines & Coordination" [level=4] [ref=e295]
            - paragraph [ref=e296]: Map out event schedules, manage task assignments, assign photographer/vendor roles, and sync with calendars.
        - generic [ref=e298]:
          - generic [ref=e299]:
            - img [ref=e301]
            - generic [ref=e303]: Billing
          - generic [ref=e304]:
            - heading "Invoices & Payments" [level=4] [ref=e305]
            - paragraph [ref=e306]: Generate drafts from accepted quotes. Set split payment milestones, log card/bank deposits, and track accounting ledgers.
        - generic [ref=e308]:
          - generic [ref=e309]:
            - img [ref=e311]
            - generic [ref=e314]: Collaboration
          - generic [ref=e315]:
            - heading "Secure Client Portal" [level=4] [ref=e316]
            - paragraph [ref=e317]: Give clients a dedicated, white-label dashboard to accept proposals, pay deposit invoices, and view active timelines.
        - generic [ref=e319]:
          - generic [ref=e320]:
            - img [ref=e322]
            - generic [ref=e326]: Media Delivery
          - generic [ref=e327]:
            - heading "Gallery & Media Delivery" [level=4] [ref=e328]
            - paragraph [ref=e329]: Upload high-resolution event media. Deliver secure passcode-protected albums with custom download permissions.
    - generic [ref=e332]:
      - generic [ref=e333]:
        - generic [ref=e334]: Integrated Lifecycle
        - heading "The Complete Event Workflow" [level=3] [ref=e335]
        - paragraph [ref=e336]: See how prospective leads turn into fully paid bookings and finished galleries inside the automated EventOS ecosystem.
      - generic [ref=e337]:
        - img
        - img
        - img
        - img
        - img
        - generic [ref=e338]:
          - generic [ref=e339]:
            - generic [ref=e340]:
              - img [ref=e341]
              - generic [ref=e346]: "1"
            - generic [ref=e347]:
              - heading "1. Lead" [level=4] [ref=e348]
              - paragraph [ref=e349]: Client inquiry logged in CRM
          - generic [ref=e350]:
            - generic [ref=e351]:
              - img [ref=e352]
              - generic [ref=e355]: "2"
            - generic [ref=e356]:
              - heading "2. Quote" [level=4] [ref=e357]
              - paragraph [ref=e358]: Proposal accepted by client
          - generic [ref=e359]:
            - generic [ref=e360]:
              - img [ref=e361]
              - generic [ref=e364]: "3"
            - generic [ref=e365]:
              - heading "3. Booking" [level=4] [ref=e366]
              - paragraph [ref=e367]: Contract signed, dates locked
          - generic [ref=e368]:
            - generic [ref=e369]:
              - img [ref=e370]
              - generic [ref=e372]: "4"
            - generic [ref=e373]:
              - heading "4. Event" [level=4] [ref=e374]
              - paragraph [ref=e375]: Timelines & tasks coordinated
          - generic [ref=e376]:
            - generic [ref=e377]:
              - img [ref=e378]
              - generic [ref=e380]: "5"
            - generic [ref=e381]:
              - heading "5. Payment" [level=4] [ref=e382]
              - paragraph [ref=e383]: Milestones invoiced & processed
          - generic [ref=e384]:
            - generic [ref=e385]:
              - img [ref=e386]
              - generic [ref=e390]: "6"
            - generic [ref=e391]:
              - heading "6. Gallery" [level=4] [ref=e392]
              - paragraph [ref=e393]: High-res media delivered securely
    - generic [ref=e396]:
      - generic [ref=e397]:
        - generic [ref=e398]:
          - generic [ref=e399]: Dynamic Interfaces
          - heading "Visual tools designed for production velocity." [level=3] [ref=e400]
          - paragraph [ref=e401]: Step into the operating system. Click through our primary client interface views to preview how your team and clients interact.
        - generic [ref=e402]:
          - button "Desktop Preview" [ref=e403] [cursor=pointer]:
            - img [ref=e404]
            - generic [ref=e406]: Desktop
          - button "Mobile Preview" [ref=e407] [cursor=pointer]:
            - img [ref=e408]
            - generic [ref=e410]: Mobile
      - generic [ref=e411]:
        - button "Pipeline Kanban" [ref=e412] [cursor=pointer]:
          - generic [ref=e414]:
            - img [ref=e415]
            - text: Pipeline Kanban
        - button "Event Calendar" [ref=e416] [cursor=pointer]:
          - generic [ref=e417]:
            - img [ref=e418]
            - text: Event Calendar
        - button "Client Portal" [ref=e420] [cursor=pointer]:
          - generic [ref=e421]:
            - img [ref=e422]
            - text: Client Portal
        - button "Media Gallery" [ref=e424] [cursor=pointer]:
          - generic [ref=e425]:
            - img [ref=e426]
            - text: Media Gallery
      - generic [ref=e438]:
        - generic [ref=e440]:
          - heading "CRM Leads Kanban" [level=4] [ref=e441]
          - paragraph [ref=e442]: Drag & drop leads across sales milestones
        - generic [ref=e443]:
          - generic [ref=e444]:
            - generic [ref=e445]:
              - generic [ref=e446]: Inquiries
              - generic [ref=e447]: "3"
            - generic [ref=e448]:
              - generic [ref=e449]:
                - generic [ref=e450]: Instagram
                - heading "Riya & Karan" [level=5] [ref=e451]
                - paragraph [ref=e452]: Wedding Setup
                - generic [ref=e453]:
                  - generic [ref=e454]: Est. Budget
                  - generic [ref=e455]: ₹15,00,000
              - generic [ref=e456]:
                - generic [ref=e457]: Website
                - heading "Microsoft India" [level=5] [ref=e458]
                - paragraph [ref=e459]: Annual Tech Summit
                - generic [ref=e460]:
                  - generic [ref=e461]: Est. Budget
                  - generic [ref=e462]: ₹30,00,000
          - generic [ref=e463]:
            - generic [ref=e464]:
              - generic [ref=e465]: Proposal Sent
              - generic [ref=e466]: "2"
            - generic [ref=e468]:
              - generic [ref=e469]: Referral
              - heading "Aanya Verma" [level=5] [ref=e470]
              - paragraph [ref=e471]: Birthday Bash
              - generic [ref=e472]:
                - generic [ref=e473]: Est. Budget
                - generic [ref=e474]: ₹5,00,000
          - generic [ref=e475]:
            - generic [ref=e476]:
              - generic [ref=e477]: Booked & Paid
              - generic [ref=e478]: "4"
            - generic [ref=e480]:
              - generic [ref=e481]: Instagram
              - heading "Sanjay Shah" [level=5] [ref=e482]
              - paragraph [ref=e483]: Anniversary Gala
              - generic [ref=e484]:
                - generic [ref=e485]: Est. Budget
                - generic [ref=e486]: ₹8,50,000
    - generic [ref=e489]:
      - generic [ref=e490]:
        - generic [ref=e491]: Client Stories
        - heading "Endorsed by leading production teams." [level=3] [ref=e492]
        - paragraph [ref=e493]: See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
      - generic [ref=e494]:
        - generic [ref=e495]:
          - generic [ref=e496]:
            - generic [ref=e497]:
              - generic [ref=e498]:
                - img [ref=e499]
                - img [ref=e501]
                - img [ref=e503]
                - img [ref=e505]
                - img [ref=e507]
              - paragraph [ref=e509]: "\"EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.\""
              - generic [ref=e510]:
                - img "Aparna Sen" [ref=e512]
                - generic [ref=e513]:
                  - heading "Aparna Sen" [level=4] [ref=e514]
                  - generic [ref=e515]: Founder, Sen Weddings & Co.
            - generic [ref=e516]:
              - generic [ref=e517]:
                - img [ref=e518]
                - img [ref=e520]
                - img [ref=e522]
                - img [ref=e524]
                - img [ref=e526]
              - paragraph [ref=e528]: "\"Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.\""
              - generic [ref=e529]:
                - img "Rohan Kapoor" [ref=e531]
                - generic [ref=e532]:
                  - heading "Rohan Kapoor" [level=4] [ref=e533]
                  - generic [ref=e534]: Operations Lead, Peak Corporate
            - generic [ref=e535]:
              - generic [ref=e536]:
                - img [ref=e537]
                - img [ref=e539]
                - img [ref=e541]
                - img [ref=e543]
                - img [ref=e545]
              - paragraph [ref=e547]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e548]:
                - img "Meera Nair" [ref=e550]
                - generic [ref=e551]:
                  - heading "Meera Nair" [level=4] [ref=e552]
                  - generic [ref=e553]: Creative Director, Vogue Gala
          - generic [ref=e554]:
            - generic [ref=e555]:
              - generic [ref=e556]:
                - img [ref=e557]
                - img [ref=e559]
                - img [ref=e561]
                - img [ref=e563]
                - img [ref=e565]
              - paragraph [ref=e567]: "\"EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.\""
              - generic [ref=e568]:
                - img "Aparna Sen" [ref=e570]
                - generic [ref=e571]:
                  - heading "Aparna Sen" [level=4] [ref=e572]
                  - generic [ref=e573]: Founder, Sen Weddings & Co.
            - generic [ref=e574]:
              - generic [ref=e575]:
                - img [ref=e576]
                - img [ref=e578]
                - img [ref=e580]
                - img [ref=e582]
                - img [ref=e584]
              - paragraph [ref=e586]: "\"Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.\""
              - generic [ref=e587]:
                - img "Rohan Kapoor" [ref=e589]
                - generic [ref=e590]:
                  - heading "Rohan Kapoor" [level=4] [ref=e591]
                  - generic [ref=e592]: Operations Lead, Peak Corporate
            - generic [ref=e593]:
              - generic [ref=e594]:
                - img [ref=e595]
                - img [ref=e597]
                - img [ref=e599]
                - img [ref=e601]
                - img [ref=e603]
              - paragraph [ref=e605]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e606]:
                - img "Meera Nair" [ref=e608]
                - generic [ref=e609]:
                  - heading "Meera Nair" [level=4] [ref=e610]
                  - generic [ref=e611]: Creative Director, Vogue Gala
          - generic [ref=e612]:
            - generic [ref=e613]:
              - generic [ref=e614]:
                - img [ref=e615]
                - img [ref=e617]
                - img [ref=e619]
                - img [ref=e621]
                - img [ref=e623]
              - paragraph [ref=e625]: "\"EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.\""
              - generic [ref=e626]:
                - img "Aparna Sen" [ref=e628]
                - generic [ref=e629]:
                  - heading "Aparna Sen" [level=4] [ref=e630]
                  - generic [ref=e631]: Founder, Sen Weddings & Co.
            - generic [ref=e632]:
              - generic [ref=e633]:
                - img [ref=e634]
                - img [ref=e636]
                - img [ref=e638]
                - img [ref=e640]
                - img [ref=e642]
              - paragraph [ref=e644]: "\"Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.\""
              - generic [ref=e645]:
                - img "Rohan Kapoor" [ref=e647]
                - generic [ref=e648]:
                  - heading "Rohan Kapoor" [level=4] [ref=e649]
                  - generic [ref=e650]: Operations Lead, Peak Corporate
            - generic [ref=e651]:
              - generic [ref=e652]:
                - img [ref=e653]
                - img [ref=e655]
                - img [ref=e657]
                - img [ref=e659]
                - img [ref=e661]
              - paragraph [ref=e663]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e664]:
                - img "Meera Nair" [ref=e666]
                - generic [ref=e667]:
                  - heading "Meera Nair" [level=4] [ref=e668]
                  - generic [ref=e669]: Creative Director, Vogue Gala
          - generic [ref=e670]:
            - generic [ref=e671]:
              - generic [ref=e672]:
                - img [ref=e673]
                - img [ref=e675]
                - img [ref=e677]
                - img [ref=e679]
                - img [ref=e681]
              - paragraph [ref=e683]: "\"EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.\""
              - generic [ref=e684]:
                - img "Aparna Sen" [ref=e686]
                - generic [ref=e687]:
                  - heading "Aparna Sen" [level=4] [ref=e688]
                  - generic [ref=e689]: Founder, Sen Weddings & Co.
            - generic [ref=e690]:
              - generic [ref=e691]:
                - img [ref=e692]
                - img [ref=e694]
                - img [ref=e696]
                - img [ref=e698]
                - img [ref=e700]
              - paragraph [ref=e702]: "\"Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.\""
              - generic [ref=e703]:
                - img "Rohan Kapoor" [ref=e705]
                - generic [ref=e706]:
                  - heading "Rohan Kapoor" [level=4] [ref=e707]
                  - generic [ref=e708]: Operations Lead, Peak Corporate
            - generic [ref=e709]:
              - generic [ref=e710]:
                - img [ref=e711]
                - img [ref=e713]
                - img [ref=e715]
                - img [ref=e717]
                - img [ref=e719]
              - paragraph [ref=e721]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e722]:
                - img "Meera Nair" [ref=e724]
                - generic [ref=e725]:
                  - heading "Meera Nair" [level=4] [ref=e726]
                  - generic [ref=e727]: Creative Director, Vogue Gala
        - generic [ref=e728]:
          - generic [ref=e729]:
            - generic [ref=e730]:
              - generic [ref=e731]:
                - img [ref=e732]
                - img [ref=e734]
                - img [ref=e736]
                - img [ref=e738]
                - img [ref=e740]
              - paragraph [ref=e742]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e743]:
                - img "Meera Nair" [ref=e745]
                - generic [ref=e746]:
                  - heading "Meera Nair" [level=4] [ref=e747]
                  - generic [ref=e748]: Creative Director, Vogue Gala
            - generic [ref=e749]:
              - generic [ref=e750]:
                - img [ref=e751]
                - img [ref=e753]
                - img [ref=e755]
                - img [ref=e757]
                - img [ref=e759]
              - paragraph [ref=e761]: "\"Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.\""
              - generic [ref=e762]:
                - img "Vikram Malhotra" [ref=e764]
                - generic [ref=e765]:
                  - heading "Vikram Malhotra" [level=4] [ref=e766]
                  - generic [ref=e767]: Managing Director, Apex Events India
            - generic [ref=e768]:
              - generic [ref=e769]:
                - img [ref=e770]
                - img [ref=e772]
                - img [ref=e774]
                - img [ref=e776]
                - img [ref=e778]
              - paragraph [ref=e780]: "\"Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.\""
              - generic [ref=e781]:
                - img "Sanya Gupta" [ref=e783]
                - generic [ref=e784]:
                  - heading "Sanya Gupta" [level=4] [ref=e785]
                  - generic [ref=e786]: Principal Planner, Luxe Soirees
          - generic [ref=e787]:
            - generic [ref=e788]:
              - generic [ref=e789]:
                - img [ref=e790]
                - img [ref=e792]
                - img [ref=e794]
                - img [ref=e796]
                - img [ref=e798]
              - paragraph [ref=e800]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e801]:
                - img "Meera Nair" [ref=e803]
                - generic [ref=e804]:
                  - heading "Meera Nair" [level=4] [ref=e805]
                  - generic [ref=e806]: Creative Director, Vogue Gala
            - generic [ref=e807]:
              - generic [ref=e808]:
                - img [ref=e809]
                - img [ref=e811]
                - img [ref=e813]
                - img [ref=e815]
                - img [ref=e817]
              - paragraph [ref=e819]: "\"Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.\""
              - generic [ref=e820]:
                - img "Vikram Malhotra" [ref=e822]
                - generic [ref=e823]:
                  - heading "Vikram Malhotra" [level=4] [ref=e824]
                  - generic [ref=e825]: Managing Director, Apex Events India
            - generic [ref=e826]:
              - generic [ref=e827]:
                - img [ref=e828]
                - img [ref=e830]
                - img [ref=e832]
                - img [ref=e834]
                - img [ref=e836]
              - paragraph [ref=e838]: "\"Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.\""
              - generic [ref=e839]:
                - img "Sanya Gupta" [ref=e841]
                - generic [ref=e842]:
                  - heading "Sanya Gupta" [level=4] [ref=e843]
                  - generic [ref=e844]: Principal Planner, Luxe Soirees
          - generic [ref=e845]:
            - generic [ref=e846]:
              - generic [ref=e847]:
                - img [ref=e848]
                - img [ref=e850]
                - img [ref=e852]
                - img [ref=e854]
                - img [ref=e856]
              - paragraph [ref=e858]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e859]:
                - img "Meera Nair" [ref=e861]
                - generic [ref=e862]:
                  - heading "Meera Nair" [level=4] [ref=e863]
                  - generic [ref=e864]: Creative Director, Vogue Gala
            - generic [ref=e865]:
              - generic [ref=e866]:
                - img [ref=e867]
                - img [ref=e869]
                - img [ref=e871]
                - img [ref=e873]
                - img [ref=e875]
              - paragraph [ref=e877]: "\"Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.\""
              - generic [ref=e878]:
                - img "Vikram Malhotra" [ref=e880]
                - generic [ref=e881]:
                  - heading "Vikram Malhotra" [level=4] [ref=e882]
                  - generic [ref=e883]: Managing Director, Apex Events India
            - generic [ref=e884]:
              - generic [ref=e885]:
                - img [ref=e886]
                - img [ref=e888]
                - img [ref=e890]
                - img [ref=e892]
                - img [ref=e894]
              - paragraph [ref=e896]: "\"Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.\""
              - generic [ref=e897]:
                - img "Sanya Gupta" [ref=e899]
                - generic [ref=e900]:
                  - heading "Sanya Gupta" [level=4] [ref=e901]
                  - generic [ref=e902]: Principal Planner, Luxe Soirees
          - generic [ref=e903]:
            - generic [ref=e904]:
              - generic [ref=e905]:
                - img [ref=e906]
                - img [ref=e908]
                - img [ref=e910]
                - img [ref=e912]
                - img [ref=e914]
              - paragraph [ref=e916]: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
              - generic [ref=e917]:
                - img "Meera Nair" [ref=e919]
                - generic [ref=e920]:
                  - heading "Meera Nair" [level=4] [ref=e921]
                  - generic [ref=e922]: Creative Director, Vogue Gala
            - generic [ref=e923]:
              - generic [ref=e924]:
                - img [ref=e925]
                - img [ref=e927]
                - img [ref=e929]
                - img [ref=e931]
                - img [ref=e933]
              - paragraph [ref=e935]: "\"Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.\""
              - generic [ref=e936]:
                - img "Vikram Malhotra" [ref=e938]
                - generic [ref=e939]:
                  - heading "Vikram Malhotra" [level=4] [ref=e940]
                  - generic [ref=e941]: Managing Director, Apex Events India
            - generic [ref=e942]:
              - generic [ref=e943]:
                - img [ref=e944]
                - img [ref=e946]
                - img [ref=e948]
                - img [ref=e950]
                - img [ref=e952]
              - paragraph [ref=e954]: "\"Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.\""
              - generic [ref=e955]:
                - img "Sanya Gupta" [ref=e957]
                - generic [ref=e958]:
                  - heading "Sanya Gupta" [level=4] [ref=e959]
                  - generic [ref=e960]: Principal Planner, Luxe Soirees
    - generic [ref=e963]:
      - generic [ref=e964]:
        - generic [ref=e965]: Flexible Pricing
        - heading "Transparent pricing for teams of all sizes." [level=3] [ref=e966]
        - paragraph [ref=e967]: All plans include tenant database isolation, secure SSL connections, and core dashboard functionality. Choose a tier to scale your operations.
        - generic [ref=e969]:
          - button "Monthly" [ref=e970] [cursor=pointer]
          - button "Annually -20%" [ref=e971] [cursor=pointer]:
            - generic [ref=e972]: Annually
            - generic [ref=e973]: "-20%"
      - generic [ref=e974]:
        - generic [ref=e975]:
          - generic [ref=e976]:
            - generic [ref=e977]:
              - heading "Starter" [level=4] [ref=e978]
              - paragraph [ref=e979]: Perfect for independent wedding coordinators and solo planners.
            - generic [ref=e980]:
              - generic [ref=e981]: ₹2,499
              - generic [ref=e982]: /month
            - list "Features of Starter plan" [ref=e984]:
              - listitem [ref=e985]:
                - img [ref=e986]
                - generic [ref=e988]: Up to 15 Active Events
              - listitem [ref=e989]:
                - img [ref=e990]
                - generic [ref=e992]: CRM Lead Pipeline Kanban
              - listitem [ref=e993]:
                - img [ref=e994]
                - generic [ref=e996]: Smart Proposals & Signature Acceptance
              - listitem [ref=e997]:
                - img [ref=e998]
                - generic [ref=e1000]: Milestone Invoice Drafting
              - listitem [ref=e1001]:
                - img [ref=e1002]
                - generic [ref=e1004]: Secure Client Portal Link
              - listitem [ref=e1005]:
                - img [ref=e1006]
                - generic [ref=e1008]: 2 Team Members Included
              - listitem [ref=e1009]:
                - img [ref=e1010]
                - generic [ref=e1012]: 10GB Media Gallery Storage
          - button "Start Free Trial" [ref=e1014] [cursor=pointer]
        - generic [ref=e1015]:
          - generic [ref=e1016]: Most Popular
          - generic [ref=e1017]:
            - generic [ref=e1018]:
              - heading "Growth" [level=4] [ref=e1019]
              - paragraph [ref=e1020]: For mid-size event agencies and busy production teams.
            - generic [ref=e1021]:
              - generic [ref=e1022]: ₹5,999
              - generic [ref=e1023]: /month
            - list "Features of Growth plan" [ref=e1025]:
              - listitem [ref=e1026]:
                - img [ref=e1027]
                - generic [ref=e1029]: Unlimited Active Events
              - listitem [ref=e1030]:
                - img [ref=e1031]
                - generic [ref=e1033]: Advanced CRM Fields & Automations
              - listitem [ref=e1034]:
                - img [ref=e1035]
                - generic [ref=e1037]: White-Labeled Custom Client Portal
              - listitem [ref=e1038]:
                - img [ref=e1039]
                - generic [ref=e1041]: Auto-billing & Online Deposits
              - listitem [ref=e1042]:
                - img [ref=e1043]
                - generic [ref=e1045]: Vendor Task Assignments & Timelines
              - listitem [ref=e1046]:
                - img [ref=e1047]
                - generic [ref=e1049]: Up to 10 Team Members
              - listitem [ref=e1050]:
                - img [ref=e1051]
                - generic [ref=e1053]: 100GB Premium Gallery Storage
              - listitem [ref=e1054]:
                - img [ref=e1055]
                - generic [ref=e1057]: Custom Branding & Gallery Overlays
          - button "Start Free Trial" [ref=e1059] [cursor=pointer]
        - generic [ref=e1060]:
          - generic [ref=e1061]:
            - generic [ref=e1062]:
              - heading "Enterprise" [level=4] [ref=e1063]
              - paragraph [ref=e1064]: For large-scale venue managers and national production houses.
            - generic [ref=e1066]: Custom
            - list "Features of Enterprise plan" [ref=e1068]:
              - listitem [ref=e1069]:
                - img [ref=e1070]
                - generic [ref=e1072]: Dedicated Multi-Tenant Isolation SLA
              - listitem [ref=e1073]:
                - img [ref=e1074]
                - generic [ref=e1076]: Custom Domain Mapping (e.g. portal.yourbrand.com)
              - listitem [ref=e1077]:
                - img [ref=e1078]
                - generic [ref=e1080]: White-Labeled SMTP Email Deliveries
              - listitem [ref=e1081]:
                - img [ref=e1082]
                - generic [ref=e1084]: Unlimited Team Members & Roles
              - listitem [ref=e1085]:
                - img [ref=e1086]
                - generic [ref=e1088]: Premium API Access & Webhooks
              - listitem [ref=e1089]:
                - img [ref=e1090]
                - generic [ref=e1092]: 1TB Secure Media Gallery Storage
              - listitem [ref=e1093]:
                - img [ref=e1094]
                - generic [ref=e1096]: Priority 24/7 Phone Support & SLA
              - listitem [ref=e1097]:
                - img [ref=e1098]
                - generic [ref=e1100]: Custom Feature Development Options
          - button "Contact Sales" [ref=e1102] [cursor=pointer]
    - generic [ref=e1105]:
      - generic [ref=e1106]:
        - generic [ref=e1107]: Got Questions?
        - heading "Frequently Asked Questions" [level=3] [ref=e1108]
        - paragraph [ref=e1109]: Everything you need to know about EventOS security, billing, and white-label options.
      - generic [ref=e1111]:
        - heading "Is my customer and transaction data isolated?" [level=3] [ref=e1113]:
          - button "Is my customer and transaction data isolated?" [ref=e1114] [cursor=pointer]:
            - text: Is my customer and transaction data isolated?
            - img
        - heading "Can I use my own brand logo and custom domain?" [level=3] [ref=e1116]:
          - button "Can I use my own brand logo and custom domain?" [ref=e1117] [cursor=pointer]:
            - text: Can I use my own brand logo and custom domain?
            - img
        - heading "How secure are the client galleries?" [level=3] [ref=e1119]:
          - button "How secure are the client galleries?" [ref=e1120] [cursor=pointer]:
            - text: How secure are the client galleries?
            - img
        - heading "Can I manage multiple event agencies or client workspaces?" [level=3] [ref=e1122]:
          - button "Can I manage multiple event agencies or client workspaces?" [ref=e1123] [cursor=pointer]:
            - text: Can I manage multiple event agencies or client workspaces?
            - img
        - heading "Does EventOS support automatic payment reminders?" [level=3] [ref=e1125]:
          - button "Does EventOS support automatic payment reminders?" [ref=e1126] [cursor=pointer]:
            - text: Does EventOS support automatic payment reminders?
            - img
    - generic [ref=e1130]:
      - generic [ref=e1131]: Free 14-Day Trial
      - generic [ref=e1132]:
        - heading "Streamline your event operations today." [level=3] [ref=e1133]
        - paragraph [ref=e1134]: No credit card required. Cancel anytime. Connect your team and coordinate vendors from a single secure login.
      - generic [ref=e1135]:
        - generic [ref=e1136]: Email address
        - textbox "Email address" [ref=e1137]:
          - /placeholder: Enter your agency email
        - button "Get Started" [ref=e1138] [cursor=pointer]:
          - generic [ref=e1139]: Get Started
          - img
      - generic [ref=e1140]:
        - generic [ref=e1141]:
          - img [ref=e1142]
          - text: SSL Encrypted
        - generic [ref=e1145]: •
        - generic [ref=e1146]: SaaS Multi-Tenancy
        - generic [ref=e1147]: •
        - generic [ref=e1148]: 100% Isolated Data
  - contentinfo [ref=e1149]:
    - generic [ref=e1150]:
      - generic [ref=e1151]:
        - generic [ref=e1152] [cursor=pointer]:
          - generic [ref=e1153]: E
          - generic [ref=e1154]:
            - heading "EventOS" [level=4] [ref=e1155]
            - text: Business Suite
        - paragraph [ref=e1156]: EventOS is the all-in-one operating system for event planners, wedding agencies, and production teams. Enforce tenant isolation, secure proposal pipelines, and deliver high-resolution media.
        - generic [ref=e1157]:
          - link "EventOS on Twitter" [ref=e1158] [cursor=pointer]:
            - /url: https://twitter.com
            - img [ref=e1159]
          - link "EventOS on GitHub" [ref=e1161] [cursor=pointer]:
            - /url: https://github.com
            - img [ref=e1162]
          - link "EventOS on LinkedIn" [ref=e1165] [cursor=pointer]:
            - /url: https://linkedin.com
            - img [ref=e1166]
          - link "EventOS on Instagram" [ref=e1170] [cursor=pointer]:
            - /url: https://instagram.com
            - img [ref=e1171]
      - generic [ref=e1174]:
        - heading "Product" [level=5] [ref=e1175]
        - list [ref=e1176]:
          - listitem [ref=e1177]:
            - link "CRM & Leads" [ref=e1178] [cursor=pointer]:
              - /url: "#features"
          - listitem [ref=e1179]:
            - link "Smart Quotes" [ref=e1180] [cursor=pointer]:
              - /url: "#features"
          - listitem [ref=e1181]:
            - link "Task Timelines" [ref=e1182] [cursor=pointer]:
              - /url: "#workflow"
          - listitem [ref=e1183]:
            - link "Gallery Delivery" [ref=e1184] [cursor=pointer]:
              - /url: "#features"
      - generic [ref=e1185]:
        - heading "Company" [level=5] [ref=e1186]
        - list [ref=e1187]:
          - listitem [ref=e1188]:
            - link "About Us" [ref=e1189] [cursor=pointer]:
              - /url: /about
          - listitem [ref=e1190]:
            - link "Careers" [ref=e1191] [cursor=pointer]:
              - /url: /careers
          - listitem [ref=e1192]:
            - link "Platform Security" [ref=e1193] [cursor=pointer]:
              - /url: /security
          - listitem [ref=e1194]:
            - link "System Status" [ref=e1195] [cursor=pointer]:
              - /url: /status
      - generic [ref=e1196]:
        - heading "Legal" [level=5] [ref=e1197]
        - list [ref=e1198]:
          - listitem [ref=e1199]:
            - link "Privacy Policy" [ref=e1200] [cursor=pointer]:
              - /url: /privacy
          - listitem [ref=e1201]:
            - link "Terms of Service" [ref=e1202] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=e1203]:
            - link "Tenant SLA" [ref=e1204] [cursor=pointer]:
              - /url: /sla
          - listitem [ref=e1205]:
            - link "Cookie Policy" [ref=e1206] [cursor=pointer]:
              - /url: /cookies
    - generic [ref=e1207]:
      - generic [ref=e1208]: © 2026 EventOS Business Suite. All rights reserved.
      - generic [ref=e1209]:
        - generic [ref=e1210]:
          - text: "Build: v1.0.8-prod"
          - img [ref=e1211]
        - generic [ref=e1214]: •
        - generic [ref=e1215]: "Server Region: IN-WEST"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('EventOS Frontend Integration & Authentication Flow', () => {
  4   | 
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Clear cookies/session storage before each integration test
  7   |     await page.goto('/');
  8   |     await page.evaluate(() => {
  9   |       sessionStorage.clear();
  10  |       localStorage.clear();
  11  |     });
  12  |   });
  13  | 
  14  |   test('should display Landing Page with CTAs linking to Login and Register', async ({ page }) => {
  15  |     await page.goto('/');
  16  | 
  17  |     // Check Landing Page elements
  18  |     await expect(page.locator('text=The Operating System for Events')).toBeVisible();
  19  |     await expect(page.locator('text=Run your entire event business')).toBeVisible();
  20  | 
  21  |     // Check action buttons exist
  22  |     const createWorkspaceBtn = page.locator('text=Start Free Trial');
  23  |     const enterDashboardBtn = page.locator('text=Book a Demo');
  24  | 
> 25  |     await expect(createWorkspaceBtn).toBeVisible();
      |                                      ^ Error: expect(locator).toBeVisible() failed
  26  |     await expect(enterDashboardBtn).toBeVisible();
  27  | 
  28  |     // Click login button in the header
  29  |     await page.click('header >> text=Sign In');
  30  |     await expect(page).toHaveURL(/\/login/);
  31  |   });
  32  | 
  33  |   test('should enforce protected route redirects for unauthenticated users', async ({ page }) => {
  34  |     // Attempting to access dashboard, switcher, or settings directly
  35  |     await page.goto('/workspace-select');
  36  | 
  37  |     // Middleware should redirect user to login since hasSession cookie is missing
  38  |     await expect(page).toHaveURL(/\/login\?redirect=%2Fworkspace-select/);
  39  |   });
  40  | 
  41  |   test('should handle successful login flow, save session state, and redirect to switcher', async ({ page }) => {
  42  |     await page.goto('/login');
  43  | 
  44  |     // Intercept/mock login API response
  45  |     await page.route('**/api/v1/auth/login', async (route) => {
  46  |       await route.fulfill({
  47  |         status: 200,
  48  |         contentType: 'application/json',
  49  |         body: JSON.stringify({
  50  |           success: true,
  51  |           data: {
  52  |             accessToken: 'mock_jwt_access_token_xyz123',
  53  |             userId: '88888888-8888-8888-8888-888888888888',
  54  |             firstName: 'Demo',
  55  |             role: 'OWNER',
  56  |             tenantId: '99999999-9999-9999-9999-999999999999',
  57  |             memberships: [
  58  |               {
  59  |                 tenantId: '99999999-9999-9999-9999-999999999999',
  60  |                 companyId: 'company_abc',
  61  |                 companyName: 'Apex Wedding Planners',
  62  |                 role: 'OWNER',
  63  |                 status: 'ACTIVE'
  64  |               },
  65  |               {
  66  |                 tenantId: '11111111-1111-1111-1111-111111111111',
  67  |                 companyId: 'company_def',
  68  |                 companyName: 'Elite Corporate Events',
  69  |                 role: 'MANAGER',
  70  |                 status: 'ACTIVE'
  71  |               }
  72  |             ]
  73  |           }
  74  |         })
  75  |       });
  76  |     });
  77  | 
  78  |     // Fill in credentials
  79  |     await page.fill('input[id="email"]', 'demo@eventos.com');
  80  |     await page.fill('input[id="password"]', 'securePassword123');
  81  | 
  82  |     // Submit login form
  83  |     await page.click('button[type="submit"]');
  84  | 
  85  |     // Should redirect to Workspace Switcher page
  86  |     await expect(page).toHaveURL(/\/workspace-select/);
  87  | 
  88  |     // Verify session details saved in Session Storage via page evaluation
  89  |     const storedActiveTenant = await page.evaluate(() => sessionStorage.getItem('activeTenantId'));
  90  |     const storedUser = await page.evaluate(() => sessionStorage.getItem('user'));
  91  | 
  92  |     expect(storedActiveTenant).toBe('99999999-9999-9999-9999-999999999999');
  93  |     expect(storedUser).not.toBeNull();
  94  |     expect(storedUser!).toContain('demo@eventos.com');
  95  |     expect(storedUser!).toContain('Demo');
  96  |   });
  97  | 
  98  |   test('should switch workspace contexts and set appropriate HTTP headers', async ({ page }) => {
  99  |     // Pre-populate authenticated state using cookie and sessionStorage simulation
  100 |     await page.goto('/workspace-select');
  101 |     await page.evaluate(() => {
  102 |       sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
  103 |       sessionStorage.setItem('user', JSON.stringify({
  104 |         id: '88888888-8888-8888-8888-888888888888',
  105 |         email: 'demo@eventos.com',
  106 |         firstName: 'Demo',
  107 |         role: 'OWNER'
  108 |       }));
  109 |       sessionStorage.setItem('memberships', JSON.stringify([
  110 |         {
  111 |           tenantId: '99999999-9999-9999-9999-999999999999',
  112 |           companyName: 'Apex Wedding Planners',
  113 |           role: 'OWNER'
  114 |         },
  115 |         {
  116 |           tenantId: '11111111-1111-1111-1111-111111111111',
  117 |           companyName: 'Elite Corporate Events',
  118 |           role: 'MANAGER'
  119 |         }
  120 |       ]));
  121 |     });
  122 | 
  123 |     // Set cookie to simulate authenticated session for middleware
  124 |     await page.context().addCookies([
  125 |       { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
```