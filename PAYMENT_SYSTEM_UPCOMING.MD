You are a senior full-stack engineer. Extend an existing production Prisma schema and Next.js + Node.js SaaS app to integrate Paddle subscriptions WITHOUT breaking current architecture.

IMPORTANT:

- DO NOT modify existing models unless explicitly stated
- DO NOT remove enums or relations
- ONLY extend schema safely
- Maintain naming convention @@map("ir\_\*")

Existing schema reference:

---

# GOAL

Implement Paddle subscription system with:

Plans:

- FREE (already exists)
- STARTER (monthly + yearly)
- PRO (monthly + yearly)

Future-ready:

- TEAM plan (do not hardcode logic)

---

# 1. PRISMA SCHEMA EXTENSION (SAFE MODIFY)

Extend existing User model:

ADD fields:

paddleCustomerId String? @unique
subscriptionStatus String? // active, past_due, canceled
billingCycle String? // monthly, yearly
currentPeriodEnd DateTime?

DO NOT remove existing "plan" field (UserPlan enum stays source of truth)

---

CREATE NEW MODEL:

model Subscription {
id String @id @default(cuid())
userId String
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

paddleSubscriptionId String @unique
paddleCustomerId String

plan UserPlan
billingCycle String

status String
currentPeriodEnd DateTime?

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

@@index([userId])
@@map("ir_subscriptions")
}

---

CREATE NEW MODEL:

model Payment {
id String @id @default(cuid())
userId String
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

paddlePaymentId String @unique
amount Int
currency String
status String

createdAt DateTime @default(now())

@@index([userId])
@@map("ir_payments")
}

---

# 2. ENV VARIABLES

Add:

PADDLE_API_KEY=
PADDLE_CLIENT_TOKEN=
PADDLE_WEBHOOK_SECRET=

---

# 3. PLAN CONFIG (SCALABLE)

Create:

/lib/plans.ts

Use enum mapping:

import { UserPlan } from "@prisma/client";

export const PLANS = {
FREE: { name: "Free" },
STARTER: {
monthly: { priceId: "pri_xxx" },
yearly: { priceId: "pri_xxx" }
},
PRO: {
monthly: { priceId: "pri_xxx" },
yearly: { priceId: "pri_xxx" }
}
};

DO NOT hardcode logic elsewhere.

---

# 4. CHECKOUT SYSTEM (NEXT.JS)

Create:

/components/billing/CheckoutButton.tsx

Requirements:

- Load Paddle.js
- Pass:
  - priceId
  - user email
  - custom_data: userId

Use:

Paddle.Checkout.open({
items: [{ priceId }],
customer: { email },
customData: { userId }
});

---

# 5. WEBHOOK (CRITICAL)

Create:

/app/api/paddle/webhook/route.ts

Handle events:

- subscription.created
- subscription.updated
- subscription.canceled
- transaction.completed

LOGIC:

1. Verify Paddle signature (REQUIRED)
2. Extract:
   - customer_id
   - subscription_id
   - price_id

3. Map price_id → plan + billingCycle
4. Find user via:
   - paddleCustomerId OR custom_data.userId

---

UPDATE FLOW:

- Upsert Subscription
- Update User:
  - plan (FREE / STARTER / PRO)
  - subscriptionStatus
  - billingCycle
  - currentPeriodEnd

---

PAYMENT FLOW:

On transaction.completed:

- Insert Payment record

---

DOWNGRADE LOGIC:

If canceled / expired:
→ set User.plan = FREE

---

# 6. SUBSCRIPTION GUARD

Create:

/lib/billing.ts

Functions:

- getUserPlan(userId)
- isPro(user)
- isStarter(user)

USE existing enum UserPlan

---

# 7. BILLING PAGE UI

Create:

/app/dashboard/billing/page.tsx

Show:

- Current plan (from User.plan)
- Billing cycle
- Renewal date
- Upgrade buttons
- Cancel button

---

# 8. PAYMENT HISTORY

Query Payment table:

Display:

- amount
- date
- status

---

# 9. CUSTOMER PORTAL

Use Paddle hosted portal:

- Generate customer portal session
- Redirect user

---

# 10. ACCESS CONTROL

DO NOT rely on frontend.

Use server-side checks:

Example:

IF user.plan == FREE → restrict
IF STARTER → limited
IF PRO → full

---

# 11. SECURITY

- Verify webhook signature
- Never expose API key
- Validate user session before checkout

---

# 12. PADDLE REVIEW REQUIREMENTS (AUTO FIX SITE)

Ensure pages exist:

/pricing
/terms
/privacy
/refund-policy

Each page must:

- Be accessible
- Not empty
- Clearly written

---

# 13. UX

- Monthly/yearly toggle
- Highlight Pro plan
- Clean checkout trigger
- No broken states

---

# 14. OUTPUT

Generate:

- Prisma schema changes ONLY (not full rewrite)
- All new files
- Clean integration into existing structure
- Type-safe code

Do not explain. Only output code and file structure.
