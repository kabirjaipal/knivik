# Knivik

AI Buying Intent Lead Finder

Knivik scans online conversations and detects people actively looking for products or solutions.

Businesses use Knivik to find potential customers early and join conversations where buyers are asking for recommendations.

---

# Core Idea

Instead of cold outreach, Knivik finds **warm leads**.

Example conversations:

* “Looking for a project management tool”
* “Best CRM for freelancers?”
* “Alternative to Notion?”

Knivik detects these warm leads and alerts businesses.

---

# Target Users

Primary users:

* SaaS founders
* solo entrepreneurs
* agencies
* B2B startups
* marketers

These users want to **find customers in online conversations**.

---

# Core Features

## 1. Multi-Product Tracking

Each user can track multiple products.

Example:

User account

```
User
 ├ Product: AI SEO Tool
 ├ Product: Email Marketing Tool
 └ Product: CRM Software
```

Each product has:

* keywords
* competitors
* leads

---

# 2. Intent Detection

AI detects buying intent in conversations.

Example phrases:

```
looking for tool
recommend software
alternative to
any solution for
frustrated with
```

Intent levels:

```
BUY_NOW
COMPARING
```

---

# 3. Lead Dashboard

Users see leads in a simple dashboard.

Example lead:

```
Platform: Reddit
Post: Looking for CRM software
Intent Score: 92
Keyword: CRM
Link: reddit.com/...
```

Actions:

```
View Post
Copy Reply
Save Lead
```

---

# 4. AI Reply Generator

AI suggests replies to leads.

Example:

Input:

```
Post:
Looking for a CRM for freelancers
```

Output:

```
Hey! I built a CRM designed specifically for freelancers.
It keeps things simple and avoids enterprise complexity.
Happy to share it if you'd like.
```

---

# 5. Alerts

Users receive notifications when new leads appear.

Channels:

* email
* Slack
* dashboard

---

# MVP Scope

First version monitors:

```
Reddit
HackerNews
Twitter
```

---

# Tech Stack

Frontend

```
Next.js
React
Tailwind
Shadcn UI
```

Backend

```
Node.js
Express
PostgreSQL
```

AI

```
Groq API
embeddings
intent classification
```

Infrastructure

```
Vercel (frontend)
Railway (backend)
Supabase (database + auth)
```

---

# System Architecture

```
scrapers
   ↓
data ingestion service
   ↓
AI intent classifier
   ↓
lead scoring engine
   ↓
database
   ↓
dashboard + alerts
```

---

# Database Schema

Users

```
id
email
password
plan
created_at
```

Products

```
id
user_id
name
description
created_at
```

Keywords

```
id
product_id
keyword
```

Leads

```
id
product_id
platform
content
intent_score
url
created_at
```

Replies

```
id
lead_id
generated_reply
created_at
```

---

# Step 1 — Create Project

Repository structure:

```
knivik/
 frontend/
 backend/
 scrapers/
 ai/
 workers/
```

Install packages.

Frontend

```
npm install next react tailwind
```

Backend

```
npm install express cors dotenv pg
```

AI

```
npm install openai
```

---

# Step 2 — Build Reddit Scraper

Use Reddit API.

Search posts containing keywords.

Example:

```
keywords = [
"looking for tool",
"any recommendation",
"alternative to",
"best software"
]
```

Run scraper every:

```
10 minutes
```

Save posts in database.

---

# Step 3 — HackerNews Scraper

Fetch:

```
Ask HN
Show HN
comments
```

Detect conversations asking for tools.

---

# Step 4 — Intent Detection

Use LLM classification.

Prompt:

```
Classify this post.

Categories:
BUY_NOW
COMPARING

Text:
"Looking for an email marketing tool"
```

Output:

```
BUY_NOW
Score: 90
```

---

# Step 5 — Lead Scoring

Score leads using:

```
intent score
keyword match
platform authority
```

Example:

```
BUY_NOW → 90
COMPARING → 75
```

Only store leads above:

```
score ≥ 70
```

---

# Step 6 — Reply Generator

Use AI to generate response.

Prompt:

```
Write a helpful response to this post.

Post:
{post_text}

Goal:
Suggest our product naturally.
Avoid spam.
```

Save generated reply.

---

# Step 7 — Dashboard

Show leads.

Columns:

```
platform
intent score
post content
view post
copy reply
```

Filters:

```
product
platform
intent level
```

---

# Step 8 — Notifications

Send alerts when leads appear.

Example email:

```
New Lead Detected

Platform: Reddit
Post: Looking for CRM software
Score: 91
```

---

# Step 9 — Pricing

Free (Forever)

```
$0
1 product
50 leads
```

Pro

```
$49/month (or custom)
5 products
1000 leads
```


---

# Step 10 — Launch Strategy

Launch on:

* Product Hunt
* IndieHackers
* Reddit
* Twitter

Messaging:

```
Stop searching Reddit for customers.

Knivik finds buyers automatically.
```

---

# Success Metrics

Track:

```
daily leads detected
active users
conversion rate
paid users
```

Target:

```
100 paying users
$5k MRR
```

---

# Future Features

1. let our site go on the post link and comment automaticly no user interaction needed
2. rn our project optomize to find leads for product but we have optimzie it for services too like video editing 
3. use instagram and linkedin and facebook too for lead platform
4. referal portal
5. micro saas tools related to this project
6. add buy now button near start trial 