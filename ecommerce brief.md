# Project Brief: Full-Fledged E-commerce Ecosystem with Seller Inventory, Delivery Partner App, Tracking, and PWA

## 1) Project overview

Build a **complete e-commerce ecosystem** that includes:

* a **customer-facing e-commerce application**
* a **seller/inventory management application**
* a **delivery tracking and delivery partner application**
* a **publicly deployed, usable product**
* **PWA support** for relevant user experiences

This is not a basic store project. The objective is to design and deliver a system that feels like a **real-world commerce platform** with multiple actors, operational workflows, order lifecycle management, inventory accuracy, delivery handling, and good product thinking.

You are expected to think not only as developers, but also as:

* product managers
* system designers
* QA owners
* operators responsible for deployment and reliability

The final output should be a polished, working system that anyone can access and use through deployed URLs.

---

## 2) Objective of the exercise

The goal of this project is to evaluate your ability to build a **robust, complete, scalable-feeling product** in a short period, not just a collection of screens and CRUD APIs.

Your project should demonstrate:

* strong product understanding
* clean workflows
* sensible handling of real-world edge cases
* good code quality
* proper separation of responsibilities across different parts of the system
* realistic error handling
* operational readiness
* publicly accessible deployment

You are free to choose the exact technical stack, libraries, structure, and architecture. The focus is on **what the system does and how well it behaves**, not on any fixed implementation approach.

---

## 3) Expected product scope

The system should include the following major areas:

### A. Customer commerce application

A customer should be able to:

* browse products
* search and filter products
* view product details
* see pricing, stock availability, variants, and delivery information
* add items to cart
* manage wishlist
* place orders
* view order history
* track order progress
* cancel eligible orders
* request return/replacement where applicable
* manage profile, addresses, and preferences

### B. Seller and inventory management application

A seller should be able to:

* onboard into the platform
* manage products
* manage categories, variants, pricing, images, and descriptions
* manage stock and inventory levels
* view incoming orders
* process or reject order fulfilment where needed
* prepare shipments
* monitor sales and order statuses
* view alerts related to low stock, failed deliveries, or returned items

### C. Delivery partner application

A delivery partner should be able to:

* view assigned deliveries
* accept or reject delivery assignments
* view route/task details
* update delivery statuses
* mark pickup and drop milestones
* report failed delivery attempts
* upload proof of delivery where relevant
* view delivery history and earnings or performance-style summaries if you include them

### D. Delivery tracking and operational visibility

The system should support:

* customer-facing tracking updates
* seller-facing shipment visibility
* internal/admin visibility into order and delivery lifecycle
* clear state transitions from order creation to fulfilment to delivery to closure

### E. Progressive Web App (PWA)

At least the most relevant user-facing experiences should behave well as a PWA.

Good candidates include:

* customer storefront
* delivery partner experience
* both, if feasible

The PWA should not be cosmetic only. It should provide meaningful utility such as:

* installability
* responsive mobile-first experience
* basic offline tolerance where relevant
* fast repeat loading
* app-like behaviour on supported devices

---

## 4) Primary user roles

Your system should support clear role separation. At minimum, design for:

* customer
* seller
* delivery partner
* platform administrator / operations user

You may add more roles if useful, such as:

* warehouse staff
* seller staff
* support agent

Each role should have clearly scoped access and workflows. Permissions should not be loosely handled.

---

## 5) Functional requirements

## 5.1 Customer application requirements

The customer application should include, at minimum:

### Product discovery

* home page or landing experience
* product listing pages
* category browsing
* search
* filters and sorting
* featured/new/trending style sections if relevant

### Product detail page

* product images
* product description
* price
* discount visibility if any
* variant selection
* stock/availability indication
* delivery estimate or delivery information
* seller or fulfilment information where relevant

### Cart and checkout

* add to cart
* update quantity
* remove items
* save for later or wishlist
* address selection or creation
* order summary
* shipping charge logic if any
* coupon/promo handling if included
* order placement flow

### User account

* sign up / sign in
* profile management
* saved addresses
* wishlist
* order history
* order detail page
* return/cancellation requests where permitted

### Order tracking

Customers should be able to see a meaningful timeline, not just a single status. Order tracking should reflect the lifecycle clearly.

Possible milestones include:

* order placed
* order confirmed
* seller preparing order
* packed
* shipped
* out for delivery
* delivered
* cancelled
* return requested
* return approved
* returned
* refund initiated/completed

---

## 5.2 Seller application requirements

The seller application should feel like a real operational dashboard, not a simple product list.

### Seller onboarding and profile

* seller registration or onboarding flow
* shop/business details
* profile management
* fulfilment-related settings if relevant

### Catalogue management

* create products
* edit products
* archive/unpublish products
* manage product variants
* upload images
* manage category assignment
* manage pricing and discounts
* manage SKU-style identifiers if you choose to include them

### Inventory management

* stock quantity management
* variant-wise stock handling
* stock alerts
* out-of-stock handling
* reservation behaviour awareness during ordering
* visibility of stock movement if included

### Order management

* view new orders
* view order details
* prepare fulfilment
* pack/mark ready for pickup
* view cancelled and returned orders
* handle seller-side fulfilment exceptions

### Seller insights

At minimum, some meaningful dashboards or summaries should exist, such as:

* sales summary
* pending orders
* low stock products
* return/failure indicators

---

## 5.3 Delivery partner application requirements

This should be treated as an actual delivery workflow app, not just a status update page.

### Delivery work queue

* view assigned tasks
* task details
* pickup and drop information
* customer contact or masked contact representation if included
* delivery sequence or route relevance if included

### Delivery lifecycle actions

A delivery partner should be able to update statuses such as:

* assigned
* accepted
* picked up
* in transit
* out for delivery
* delivered
* delivery failed
* delivery reattempt needed
* returned to origin if appropriate

### Operational proof and issue reporting

Include practical capabilities such as:

* proof of delivery upload
* failed attempt reason
* notes/comments
* issue reporting

### Mobile-first usability

This interface should be especially strong on mobile and is a good candidate for PWA-first thinking.

---

## 5.4 Admin / platform operations requirements

The platform should have some internal control surface for administration or operational oversight.

At minimum, this should allow visibility into:

* customers
* sellers
* delivery partners
* products
* orders
* shipments
* complaints/issues if you include them
* system-wide summaries

The admin experience does not need to be overly large, but the platform should not feel impossible to operate without manual database intervention.

---

## 6) End-to-end workflows expected

Your platform must support coherent end-to-end flows. At minimum, the following scenarios should work:

### Core buying journey

A customer should be able to:

1. browse/search products
2. view product details
3. add items to cart
4. place an order
5. receive order confirmation
6. track progress
7. see delivery completion

### Seller fulfilment journey

A seller should be able to:

1. receive an order
2. review order items
3. prepare the shipment
4. mark it ready
5. hand it into the delivery flow
6. see downstream progress

### Delivery journey

A delivery partner should be able to:

1. view assignment
2. accept or begin handling
3. update milestone statuses
4. complete delivery or report failure
5. have customer and seller views update appropriately

### Post-order problem journey

At least one operational exception should be handled well, such as:

* partial stock issue
* cancelled order
* failed delivery
* return request
* refund-style status flow
* seller unable to fulfil
* item becoming unavailable after cart addition

---

## 7) Strongly recommended advanced areas

These are important because this is meant to be a deeper engineering exercise.

### Inventory correctness

The system should show awareness of the fact that inventory is not trivial.

You should think carefully about:

* when stock should reduce
* when stock should be restored
* how cancelled orders affect stock
* how failed payments or abandoned checkouts affect stock if relevant
* how multiple users interacting simultaneously may affect availability

### Status consistency

Order state, payment state, fulfilment state, and delivery state should not be confused with each other. The product should show a clean and understandable lifecycle.

### Notifications

Relevant users should receive meaningful updates. This can include:

* order confirmation
* seller order alerts
* delivery assignment alerts
* customer delivery updates
* cancellation/failure updates

### Search and discoverability

Product browsing should not feel weak or purely demo-level.

### Mobile responsiveness

All critical interfaces should work well on mobile, especially:

* customer storefront
* checkout
* delivery partner app

---

## 8) Optional advanced feature area: dynamic pricing / market price intelligence

This is **optional but highly valuable** if done well.

You may implement one of the following:

### Option A: Dynamic pricing

Support seller-side or platform-side pricing logic based on rules such as:

* stock levels
* sales velocity
* time-based promotions
* category demand
* seller-defined thresholds

### Option B: Competitive or market price intelligence

Use publicly available data sources or legal/public web information to support market-aware pricing insights.

This must be done responsibly. If you choose this path:

* use only lawful and appropriate public sources
* respect terms of service, robots policies, and rate limits
* do not build anything abusive or fragile
* clearly document assumptions and limitations

This feature is not mandatory, but if included, it should be meaningful and well-thought-out, not superficial.

---

## 9) Non-functional expectations

Your project will also be judged on behaviour and quality, not only features.

### Reliability

The application should fail gracefully. Users should not see broken flows, confusing errors, or silent failures.

### Validation

Inputs should be validated properly across major workflows.

### Error handling

User-visible errors should be clear and actionable where possible.

### Data consistency

The system should not easily allow invalid or contradictory states.

### Performance awareness

Even if built within a short timeline, the application should show awareness of:

* pagination
* efficient data fetching
* sensible loading states
* avoiding obviously wasteful UX or backend behaviour

### Security awareness

You should handle:

* access control
* permission separation
* sensitive data handling
* protection against obvious misuse
* safe authentication/session handling

### Maintainability

The codebase should feel structured, not chaotic. Separation of concerns, clarity, and consistency matter.

---

## 10) UX expectations

This project should not feel like a raw engineering prototype. Product thinking matters.

You are expected to make sensible decisions around:

* homepage and onboarding experience
* browsing and conversion flow
* seller dashboard usability
* delivery partner mobile usability
* handling empty states
* loading states
* error states
* operational feedback to users
* clarity of status labels and timelines

The platform should feel like something a real user could understand without being guided through every step.

---

## 11) Deployment expectations

This project must be **deployed and publicly accessible**.

### Minimum deployment expectation

* working deployed frontend(s)
* working deployed backend/API(s)
* deployed database and required services
* any required worker/background processing also deployed if your design needs it
* all major flows usable by external reviewers

### Reviewer access

Reviewers should be able to access and test the system without needing local setup.

Provide:

* all live URLs
* demo account credentials for each role
* any required setup notes for reviewers
* sample data already seeded

### Seed/demo readiness

Your deployed system should include realistic demo-ready data, such as:

* products
* sellers
* delivery partners
* orders in different stages
* some completed and failed journey examples if possible

The system should not appear empty on first login.

### Stability expectation

Your deployment should remain reasonably functional during review. A fragile demo that only works once is not sufficient.

---

## 12) Deliverables

You must submit the following:

### A. Working deployed product

Provide all live URLs.

### B. Demo credentials

Provide role-based credentials for at least:

* customer
* seller
* delivery partner
* admin

### C. Short project documentation

This should include:

* project overview
* key features
* role definitions
* assumptions made
* known limitations
* trade-offs
* optional features completed
* brief description of deployment setup
* brief note on how you approached testing

### D. Product flow summary

Provide a concise summary of major supported flows.

### E. Architecture / system explanation

Without going into excessive detail, explain:

* major components
* how the different applications/services relate to each other
* how important workflows are handled
* how state transitions are thought about

### F. Test evidence

Provide at least some proof of meaningful testing or validation effort.

### G. Source code

Your repository/repositories should be review-ready and reasonably documented.

---

## 13) Expected quality bar

This project is expected to be:

* complete enough to feel usable
* polished enough to demonstrate product judgement
* structured enough to pass code review comfortably
* realistic enough to reveal thought around real-world edge cases

A good submission is not just “many features”. A good submission is one where:

* flows make sense
* statuses are coherent
* different user roles are handled properly
* the product feels operable
* the system is understandable
* the code appears intentional and maintainable

---

## 14) Important edge cases you should think about

You are expected to think through realistic operational issues. Examples include:

* item goes out of stock during checkout or before fulfilment
* seller cannot fulfil the order
* customer cancels before shipping
* delivery partner fails delivery attempt
* product is returned after delivery
* multiple products in one order having different fulfilment statuses
* address issues
* pricing/discount mismatch edge cases
* invalid variant selection
* stale cart prices or stock
* duplicate actions or repeated submissions
* broken image/media handling
* network interruptions on mobile flows
* unauthorised access between roles

You do not need to handle every edge case under the sun, but your platform should clearly show awareness of real operational complexity.

---

## 15) Optional stretch ideas

These are not mandatory, but valuable if done well:

* dynamic pricing engine
* market price intelligence
* recommendation engine
* abandoned cart journey
* seller performance metrics
* return/refund automation logic
* customer reviews and ratings
* coupon and promotion engine
* warehouse or pickup staff role
* route optimisation concepts
* multilingual UI
* richer offline support in PWA
* push notifications
* analytics dashboard
* progressive enhancement for low-network conditions

Only attempt stretch features if your core workflows are already strong.

---

## 16) What not to do

Avoid the following:

* building only a storefront and calling it a full ecosystem
* ignoring seller and delivery operations depth
* building many screens without proper end-to-end flow completion
* leaving major lifecycle states inconsistent or unclear
* creating role access that is loosely enforced
* deploying an empty or half-seeded system
* relying on manual database changes during demo
* implementing flashy features while core flows remain weak

---

## 17) Evaluation focus

Your submission will be judged on both:

### Product completeness

* how complete and usable the workflows are
* whether the system feels coherent and realistic

### Engineering quality

* code quality
* architecture judgement
* handling of edge cases
* reliability and validation
* operational readiness
* clarity of documentation
* deployment quality

Both matter.

---

## 18) Final outcome expected

By the end of this project, reviewers should be able to do the following without assistance:

* browse and order as a customer
* manage catalogue and stock as a seller
* handle delivery tasks as a delivery partner
* inspect platform-wide activity as an admin
* see a complete order lifecycle across all sides of the system

The final product should feel like a serious, thoughtfully designed e-commerce platform ecosystem rather than a simple online shop demo.