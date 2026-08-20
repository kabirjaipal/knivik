import { Metadata } from "next";
import { ComparisonData, ComparisonFeature } from "./types";
import { constructPageMetadata } from "./metadata";

const defaultFeatures = (
  _competitorName: string,
  competitorHasMonitoring: boolean,
  competitorHasMultiChannel: boolean,
  competitorHasAutomation: boolean
): ComparisonFeature[] => [
  {
    name: "Semantic Intent Analysis",
    category: "AI & Intent Analysis",
    knivikHas: true,
    competitorHas: false,
    description: "Uses advanced natural language models to identify genuine buyers, recommendation requests, and competitor frustrations, rather than flat keyword scraping."
  },
  {
    name: "AI-Powered Reply Angles",
    category: "Outreach & Automation",
    knivikHas: true,
    competitorHas: false,
    description: "Dynamically crafts high-conversion, contextual responses for each lead to help you jump into social conversations immediately with high value."
  },
  {
    name: "Real-Time Tracking Speed",
    category: "Monitoring Speed & Scope",
    knivikHas: true,
    competitorHas: competitorHasMonitoring,
    description: "Monitors and scores active online threads within seconds, ensuring you land in the conversation before your competitors even see it."
  },
  {
    name: "Cross-Platform Coverage",
    category: "Monitoring Speed & Scope",
    knivikHas: true,
    competitorHas: competitorHasMultiChannel,
    description: "Scans active discussion nodes across Reddit, HackerNews, and X (Twitter) simultaneously from a unified, high-performance interface."
  },
  {
    name: "Automatic Intent Classification",
    category: "AI & Intent Analysis",
    knivikHas: true,
    competitorHas: false,
    description: "Automatically tags and filters leads into actionable categories like 'Buy Now', 'Competitor Frustration', and 'Semantic Discovery'."
  },
  {
    name: "Zapier, Slack & Webhook Integrations",
    category: "Outreach & Automation",
    knivikHas: true,
    competitorHas: competitorHasAutomation,
    description: "Allows exporting and routing discovered leads immediately into your CRM, Slack channels, or custom workflows for automated outreach."
  }
];

export const comparisons: Record<string, ComparisonData> = {
  brand24: {
    competitor: {
      slug: "brand24",
      name: "Brand24",
      tagline: "Premium Media & Reputation Monitoring",
      description: "Brand24 is a well-established media monitoring platform that tracks keyword mentions across social media, blogs, forums, and news sites. It is great for PR teams and marketing managers looking for broad brand sentiment and public relations analysis, but lacks native lead pipelines, dynamic AI outreach reply drafting, and targeted intent filtering for direct sales outreach.",
      rating: 4.6,
      pricing: "Starts at $79/mo (can scale up quickly)",
      platforms: ["Reddit", "HackerNews", "X (Twitter)", "Facebook", "Instagram", "Blogs", "News"],
      pros: [
        "Extremely comprehensive media monitoring across web and social channels",
        "Advanced sentiment analysis and broad web reach metrics",
        "Excellent visual reporting dashboards, PDF exports, and Slack integrations"
      ],
      limitations: [
        "Does not evaluate high-intent B2B purchasing signals natively, causing heavy alert noise",
        "Lacks automatic, context-aware AI response generators to engage prospects instantly",
        "No dedicated CRM sales pipeline layout to move leads through status stages",
        "Expensive pricing tiers built primarily for PR agency budgets rather than startups"
      ]
    },
    keyDifferences: [
      "Brand24 is built for PR and brand managers; Knivik is built for sales teams, agencies, and founders looking to acquire leads.",
      "Brand24 tracks broad brand sentiment; Knivik scores specific buying intent levels (e.g., BUY_NOW, COMPARING) to identify active sales opportunities.",
      "Knivik automatically drafts context-rich, helpful reply recommendations; Brand24 leaves outreach entirely up to you.",
      "Brand24 starts at $79/mo; Knivik offers a fully functional free tier and affordable startup/agency plans."
    ],
    features: defaultFeatures("Brand24", true, true, true),
    verdict: "Brand24 is a top-tier platform for PR professionals and agencies looking to monitor brand sentiment, track brand mentions, and manage reputation across the entire web. However, for B2B founders, agencies, freelancers, and sales teams trying to turn discussions on Reddit, HN, and X into qualified customers, Brand24 is too broad and noisy. Knivik acts as a focused AI SDR that discovers, scores, and initiates the outreach loop for you.",
    faq: [
      {
        question: "Is Brand24 built for direct sales outreach?",
        answer: "No. Brand24 is designed for public relations, brand reputation management, and monitoring general sentiment. It doesn't classify intent levels (like whether someone is looking to buy) or help you craft pitches. Knivik is built specifically to find and convert warm sales leads."
      },
      {
        question: "Can Knivik track as many sources as Brand24?",
        answer: "Brand24 covers a wider variety of web pages, blogs, and traditional news sources for PR tracking. Knivik focuses heavily on high-conversion community channels—Reddit, HackerNews, and X (Twitter)—where buyers actively ask for recommendations."
      }
    ]
  },
  f5bot: {
    competitor: {
      slug: "f5bot",
      name: "F5Bot",
      tagline: "Basic Free Keyword Scraper",
      description: "F5Bot is a popular, free service that emails you when your keywords are mentioned on Reddit or HackerNews. While it is lightweight and great for hobby projects, it has zero intelligence—flooding your inbox with every single literal keyword match, leaving all the analysis work to you.",
      rating: 3.8,
      pricing: "Free",
      platforms: ["Reddit", "HackerNews"],
      pros: [
        "Completely free to use forever",
        "Very fast notification emails",
        "Extremely simple, clean interface"
      ],
      limitations: [
        "Provides raw keyword scraping without semantic or context filtering",
        "Limited to email notifications; lacks an interactive dashboard for lead management",
        "No support for X (Twitter) or broader web tracking",
        "Does not generate custom AI reply angles to engage prospects"
      ]
    },
    keyDifferences: [
      "F5Bot is a basic notification script; Knivik is an advanced AI sales engine with a comprehensive tracking dashboard.",
      "F5Bot sends you every mention, causing massive alert fatigue; Knivik filters posts semantically so you only see active opportunities.",
      "Knivik includes robust lead pipelines, AI reply angles, and multi-channel support; F5Bot only sends text emails."
    ],
    features: defaultFeatures("F5Bot", true, false, false),
    verdict: "F5Bot is a fantastic tool for hobbyists who want a free, simple trigger for specific words on Reddit. But if you are running a real business and need to discover, qualify, prioritize, and respond to sales opportunities with high-precision AI, Knivik is the necessary upgrade.",
    faq: [
      {
        question: "Why should I pay for Knivik when F5Bot is free?",
        answer: "While F5Bot is great for basic alerts, it has no filtering. If your keyword is 'email', you will receive thousands of alerts a day. Knivik uses AI to determine if the poster is actually looking for an email tool, scores the lead, organizes it in a dashboard, and helps you draft the perfect reply."
      },
      {
        question: "Does F5Bot support Twitter?",
        answer: "No, F5Bot only monitors Reddit and HackerNews comments."
      }
    ]
  },
  syften: {
    competitor: {
      slug: "syften",
      name: "Syften",
      tagline: "Keyword Alerts for Communities",
      description: "Syften is a community keyword monitoring tool designed for founders and agencies. It is lightweight and covers several platforms, but relies entirely on literal keyword rules. It requires you to configure dozens of manual search combinations, leading to constant manual filtering or missed leads.",
      rating: 4.2,
      pricing: "Starts at $29/mo (very low limits)",
      platforms: ["Reddit", "HackerNews", "IndieHackers", "X (Twitter)"],
      pros: [
        "Monitors developer communities like HackerNews and IndieHackers",
        "Clean desktop/email notifications",
        "Simple setup process"
      ],
      limitations: [
        "Relies strictly on exact keyword matching, requiring manual refinement to avoid noise",
        "Does not offer AI-assisted reply drafting or context-level categorization",
        "Operates primarily as an alert router rather than a collaborative sales pipeline",
        "Pricing increases quickly based on query caps"
      ]
    },
    keyDifferences: [
      "Syften is a rules-based keyword monitor; Knivik is an AI social intelligence engine that interprets human intent.",
      "Syften leaves the entire outreach process to you; Knivik uses AI to write value-focused reply recommendations on the spot.",
      "Knivik tracks and scores leads dynamically in a collaborative dashboard; Syften acts primarily as an alert router."
    ],
    features: defaultFeatures("Syften", true, true, true),
    verdict: "Syften is a capable tool for tracking conversations using exact phrases. However, in the age of AI, manually parsing lists of literal keyword alerts is highly inefficient. Knivik replaces manual sorting with a smart, automated lead qualification pipeline that saves hours daily.",
    faq: [
      {
        question: "How does Knivik's pricing compare to Syften?",
        answer: "Syften starts at $29/mo but quickly limits how many keywords you can track. Knivik provides advanced AI semantic matching and pipeline tracking, giving you substantially better value for your budget."
      },
      {
        question: "Does Syften provide AI reply drafting?",
        answer: "No. Syften only flags the mention. Knivik automatically analyzes the post and generates a suggested 'reply angle' to help you respond with value in seconds."
      }
    ]
  },
  gummysearch: {
    competitor: {
      slug: "gummysearch",
      name: "GummySearch",
      tagline: "Reddit Research & Community Analysis",
      description: "GummySearch is a highly rated audience research tool designed specifically for Reddit. It is outstanding for analyzing subreddits, finding popular topics, and doing community research, but it is not built to act as a real-time sales pipeline or automated multi-channel lead engine.",
      rating: 4.4,
      pricing: "Starts at $29/mo",
      platforms: ["Reddit"],
      pros: [
        "Incredible toolkit for analyzing Reddit trends and keywords",
        "Excellent for content ideas and product discovery",
        "Clean, easy-to-use search interface"
      ],
      limitations: [
        "Exclusively focuses on Reddit, leaving out HackerNews, Twitter, and the public web",
        "Built as a market research and audience analytics tool, not a real-time lead pipeline",
        "Does not feature native AI response suggestion capabilities",
        "No automated webhook or CRM sync integrations for automated workflows"
      ]
    },
    keyDifferences: [
      "GummySearch is a Reddit research and discovery platform; Knivik is an automated cross-platform lead acquisition pipeline.",
      "GummySearch focuses on manual exploration of Reddit; Knivik automates real-time tracking across Reddit, HN, and Twitter simultaneously.",
      "Knivik features built-in AI reply angles and robust webhook integrations; GummySearch is focused on audience analytics."
    ],
    features: defaultFeatures("GummySearch", true, false, false),
    verdict: "GummySearch is a fantastic tool for audience research, finding product ideas, and understanding specific subreddits. But if you want to turn organic social discussions across Reddit, HackerNews, and Twitter into automated, qualified B2B leads routed straight into your CRM, Knivik is the engine you need.",
    faq: [
      {
        question: "Does GummySearch monitor platforms other than Reddit?",
        answer: "No, GummySearch is exclusively built for Reddit. Knivik monitors Reddit, HackerNews, and X (Twitter) in real-time."
      },
      {
        question: "Is Knivik built for market research?",
        answer: "While you can use Knivik for research, it is primarily optimized for sales pipeline automation. It finds, grades, and helps you respond to warm leads in real time."
      }
    ]
  },
  apollo: {
    competitor: {
      slug: "apollo",
      name: "Apollo.io",
      tagline: "Cold B2B Contact Database",
      description: "Apollo.io is a massive B2B sales intelligence database designed for broad cold email campaigns and static prospect list generation. While it excels at offering contact databases, email addresses, and phone numbers, it does not scan live social conversations in real-time, making it impossible to capture immediate, warm buyer intent on platforms like Reddit, HackerNews, and X (Twitter).",
      rating: 4.8,
      pricing: "Starts at $49/mo (strict credits)",
      platforms: ["Static B2B Contact Database", "Email Sequences"],
      pros: [
        "Extremely large database of B2B email addresses and phone numbers",
        "Built-in cold email sequence automation tools",
        "Strong CRM data enrichment and list matching integrations"
      ],
      limitations: [
        "Does not monitor live Reddit, HackerNews, or X conversations for conversational intent",
        "Relies entirely on cold email outreach, which experiences very low response rates",
        "Imposes strict monthly credits that limit prospect exporting and contact lookups",
        "Does not generate custom, contextual AI reply pitches for social discussion threads"
      ]
    },
    keyDifferences: [
      "Apollo.io provides a static contact database; Knivik is a real-time AI social conversation monitoring engine.",
      "Apollo.io specializes in cold outreach templates; Knivik uses deep semantic models to draft high-conversion, contextual replies for live threads.",
      "Knivik tracks and scores active buying discussions in seconds; Apollo.io relies on outdated profile data compiled months ago."
    ],
    features: defaultFeatures("Apollo.io", false, false, true),
    verdict: "If your strategy revolves around large-scale cold emailing using static job titles, Apollo.io is the undisputed database leader. But if you want to identify hot sales opportunities the second someone asks for a recommendation or complains about a competitor on Reddit, HackerNews, or X, Knivik is the ultimate modern lead acquisition scanner.",
    faq: [
      {
        question: "Can I find warm sales leads on Reddit using Apollo.io?",
        answer: "No. Apollo.io is a static contact database. It does not monitor live social channels, discussions, or community posts. Knivik monitors these platforms in real-time to find people actively asking for recommendations."
      },
      {
        question: "How does Knivik compare to cold emailing with Apollo?",
        answer: "Cold emailing typically gets a 1% to 2% response rate. Replying to a live post where someone is actively asking for your product or service (which Knivik finds and drafts pitches for) gets up to a 30% conversion rate because the buyer intent is hot and immediate."
      }
    ]
  },
  hootsuite: {
    competitor: {
      slug: "hootsuite",
      name: "Hootsuite",
      tagline: "General Social Media Management",
      description: "Hootsuite is one of the world's most famous social media management platforms, built for scheduling posts and tracking broad brand hashtags. However, it lacks native AI intent-filtering and B2B sales pipelines, leaving users sorting through high-volume noise instead of automatically finding warm sales leads.",
      rating: 4.1,
      pricing: "Starts at $99/mo (expensive legacy tier)",
      platforms: ["X (Twitter)", "Facebook", "Instagram", "LinkedIn", "TikTok"],
      pros: [
        "Excellent multi-channel social media post scheduling and queueing",
        "Unified inbox for customer support queries across networks",
        "Comprehensive social media analytics and agency reporting tools"
      ],
      limitations: [
        "Extremely expensive entry pricing starting at $99/mo for startups",
        "No semantic AI models to score or filter buying intent in real-time",
        "Does not support HackerNews, IndieHackers, or specialized developer communities",
        "Does not generate custom, contextual AI response templates to engage prospects"
      ]
    },
    keyDifferences: [
      "Hootsuite is a general brand scheduling suite; Knivik is an active B2B conversational lead finder.",
      "Hootsuite tracks literal keyword match streams; Knivik evaluates natural language semantics to find active buyers.",
      "Knivik has a completely free plan ($0); Hootsuite's starting pricing is highly restrictive for startups."
    ],
    features: defaultFeatures("Hootsuite", true, true, true),
    verdict: "For general marketing agencies looking to schedule Instagram posts or track corporate brand hashtags across social networks, Hootsuite is a powerful suite. However, for startups, founders, agencies, freelancers, and sales teams looking to convert live discussions on Reddit, HN, and X into qualified customers, Knivik is the clear, intelligent choice.",
    faq: [
      {
        question: "Can I track HackerNews mentions with Hootsuite?",
        answer: "No, Hootsuite does not support HackerNews or IndieHackers tracking. Knivik monitors HackerNews, Reddit, and X Twitter simultaneously."
      },
      {
        question: "Why should I use Knivik instead of Hootsuite for finding leads?",
        answer: "Hootsuite only streams matches of exact keywords, causing massive notification spam. Knivik's AI acts as a digital SDR, filtering out the noise to only alert you when a post represents an active buying opportunity."
      }
    ]
  },
  buzzsumo: {
    competitor: {
      slug: "buzzsumo",
      name: "BuzzSumo",
      tagline: "Content Marketing & PR Tracker",
      description: "BuzzSumo is a high-performance content research and monitoring tool built for tracking trending articles, influencer feeds, and brand keywords. While excellent for content marketers and PR agencies, it is not equipped to identify direct customer acquisition leads or automate sales outreach pipelines.",
      rating: 4.5,
      pricing: "Starts at $199/mo (pro-marketer budget)",
      platforms: ["Web", "Blogs", "X (Twitter)", "YouTube", "Reddit"],
      pros: [
        "Unmatched database for trending article discovery and content ideation",
        "Powerful influencer analysis and outreach filtration lists",
        "Strong historical sharing and backlink tracking metrics"
      ],
      limitations: [
        "Extremely expensive starting pricing ($199/mo) built for agency budgets",
        "Focuses on broad content performance and keyword listening rather than sales intent",
        "Lacks native AI-scoring or real-time sales pipeline management",
        "No automated Webhook or CRM pipelines for automated social selling workflows"
      ]
    },
    keyDifferences: [
      "BuzzSumo is engineered for content marketers and PR; Knivik is designed for active B2B social sales outreach.",
      "BuzzSumo measures content sharing statistics; Knivik interprets buying signals and drafts outreach reply pitches.",
      "Knivik offers a highly affordable startup-friendly starting cost compared to BuzzSumo's enterprise tiers."
    ],
    features: defaultFeatures("BuzzSumo", true, true, true),
    verdict: "If you are a content marketer looking to find trending topics or research article performance, BuzzSumo is incredibly valuable. But if your goal is generating new, active pipelines by finding buyers complaining about competitors or asking for tool recommendations, Knivik is the modern, automated sales engine you need.",
    faq: [
      {
        question: "Does BuzzSumo offer real-time B2B lead generation?",
        answer: "No. BuzzSumo tracks trending articles, links, and content shares. It does not identify sales opportunities or B2B buying signals on developer forums."
      },
      {
        question: "Does BuzzSumo integrate with Slack and CRMs for lead routing?",
        answer: "No, BuzzSumo lacks native CRM sales routing and automated workflow webhooks. Knivik allows routing leads instantly to Slack, Discord, or custom pipelines."
      }
    ]
  },
  clay: {
    competitor: {
      slug: "clay",
      name: "Clay",
      tagline: "AI Lead Enrichment & Data Orchestration",
      description: "Clay is a powerful data enrichment and scraping platform that aggregates 50+ data providers. It is excellent for building custom enrichment lists and using AI agents to scrape individual LinkedIn pages or company websites. However, Clay does not offer real-time conversational social listening (monitoring Reddit, HackerNews, or X for active buyer intent), meaning you cannot capture warm leads at the exact moment they express intent.",
      rating: 4.8,
      pricing: "Starts at $149/mo (credit-based)",
      platforms: ["Static Data Sources", "LinkedIn", "Web Scraping"],
      pros: [
        "Combines 50+ data vendors into a single spreadsheet interface",
        "Advanced AI agents for reading websites and personalizing pitches",
        "Extremely customizable data workflows and integrations"
      ],
      limitations: [
        "Does not monitor live conversational intent on Reddit, HackerNews, or X",
        "Requires significant manual workflow configuration and logic setup",
        "Credit consumption model can become extremely expensive at scale",
        "Optimized for cold outreach enrichment rather than active warm social selling"
      ]
    },
    keyDifferences: [
      "Clay is a static list enrichment tool; Knivik is a real-time conversational intent monitoring engine.",
      "Clay requires writing complex API chains and scraper recipes; Knivik works out-of-the-box as an autonomous digital SDR.",
      "Knivik tracks and alerts you to live buyer discussions within seconds; Clay relies on crawling static web databases and profiles.",
      "Knivik offers a generous free starting tier; Clay's entry price is high and consumption-based."
    ],
    features: defaultFeatures("Clay", false, false, true),
    verdict: "Clay is the gold standard for data enrichment if you already have a list of companies or LinkedIn profiles and want to find emails or personalized angles. However, if you want to discover warm sales leads in real-time when people are actively asking for tool recommendations or complaining about competitors on Reddit, HackerNews, or X, Knivik is the specialized AI lead finder you need.",
    faq: [
      {
        question: "Can Clay monitor Reddit and HackerNews for real-time buyer intent?",
        answer: "No. Clay is designed to enrich existing lists of companies or people using static data providers and web scraping. It is not built to monitor live, active conversation streams for buying signals. Knivik monitors these channels 24/7 in real-time."
      },
      {
        question: "How does Knivik's pricing compare to Clay?",
        answer: "Clay is credit-heavy and starts at $149/mo, which can scale up rapidly. Knivik is free to start, and its Pro tier is fixed-price and highly affordable for startups."
      }
    ]
  },
  instantly: {
    competitor: {
      slug: "instantly",
      name: "Instantly",
      tagline: "B2B Contact Database & Cold Email Sequencer",
      description: "Instantly (specifically Instantly B2B Lead Finder) is an outreach-first platform providing a database of 450M+ cold business contacts coupled with email warmup and sending automation. While it features an AI lookalike client builder, it relies on static directory lookups. It cannot scan live social discussions or forum comments, meaning you miss out on high-intent prospects searching for immediate recommendations.",
      rating: 4.7,
      pricing: "Starts at $47/mo",
      platforms: ["Static Contact Directory", "Cold Email Sequences"],
      pros: [
        "Massive database of 450 million business contacts",
        "Native unlimited email account warm-up and inbox rotation",
        "Clean interface specialized for high-volume outreach sequences"
      ],
      limitations: [
        "Does not track real-time social conversations or forum discussions",
        "Outreach is limited to cold email channels, which have low response rates",
        "AI features are restricted to writing help and company lookalike matching",
        "Data can occasionally be stale compared to live social profiles"
      ]
    },
    keyDifferences: [
      "Instantly provides a static contact directory for cold email lists; Knivik is a real-time conversational social lead scanner.",
      "Instantly focuses on mass email distribution; Knivik drafts high-context, helpful responses for public threads.",
      "Knivik targets warm buyers who are actively searching for solutions right now; Instantly targets cold leads based on static job titles."
    ],
    features: defaultFeatures("Instantly", false, false, true),
    verdict: "Instantly is the perfect utility for running high-volume cold email campaigns using broad contact criteria. However, if you want to bypass the low response rates of cold emails by connecting with buyers who are actively asking for recommendations on Reddit, HN, or X, Knivik is the superior real-time intent lead finder.",
    faq: [
      {
        question: "Can I use Instantly to find prospects on Reddit?",
        answer: "No, Instantly does not crawl or monitor social platforms like Reddit or HackerNews for buying signals. Knivik scans these platforms continuously and extracts high-intent leads."
      },
      {
        question: "How does response rate compare between Knivik and Instantly?",
        answer: "Instantly relies on cold outreach which typically gets 1-3% response rates. Knivik identifies hot public threads where the poster has already expressed intent, leading to response rates of up to 30% when engaging with relevant value."
      }
    ]
  },
  cognism: {
    competitor: {
      slug: "cognism",
      name: "Cognism",
      tagline: "GDPR-Compliant Contact Directory & Intent Data",
      description: "Cognism is an enterprise B2B sales intelligence platform providing phone-verified mobile numbers and global contact directories. While it integrates third-party intent data from Bombora to track which organizations are researching specific B2B topics, it operates at a corporate account level. It cannot track or surface actual individual discussions, questions, or recommendations on community platforms in real-time.",
      rating: 4.6,
      pricing: "Custom Enterprise Pricing",
      platforms: ["Enterprise Contact Database", "Account-Level Intent"],
      pros: [
        "Highly accurate, phone-verified mobile numbers for direct calling",
        "Strict European compliance with fully GDPR-aligned database records",
        "Bombora buyer intent integration at the organization level"
      ],
      limitations: [
        "Extremely expensive enterprise licensing models with no free/startup trial",
        "Does not track live public social posts, comments, or recommendations",
        "Intent data is limited to account-level topic lookup (no individual context)",
        "Does not suggest custom, AI-crafted replies for outreach"
      ]
    },
    keyDifferences: [
      "Cognism is a corporate contact directory and phone list; Knivik is a real-time conversational social lead finder.",
      "Cognism intent data (Bombora) only flags that an organization is browsing topics; Knivik reveals the exact post, query, and context of the buyer.",
      "Cognism is built for enterprise sales development representatives making cold calls; Knivik is designed for startups, founders, agencies, freelancers, and modern SDRs doing warm social selling."
    ],
    features: defaultFeatures("Cognism", true, false, false),
    verdict: "Cognism is a top-tier B2B database for enterprise sales teams targeting Europe via cold calling and compliant direct dials. For startup founders, agencies, freelancers, builders, and indie hackers looking to identify and convert high-intent buyers on active online threads (Reddit, HackerNews, X), Knivik is the much more precise and accessible AI lead finder.",
    faq: [
      {
        question: "Does Cognism track Reddit and X (Twitter) mentions?",
        answer: "No, Cognism does not scan live social media channels or developer forums for discussions. Its database is populated with corporate job profiles and phone numbers."
      },
      {
        question: "Who is Cognism best suited for compared to Knivik?",
        answer: "Cognism is suited for enterprise outbound sales teams focused on cold calling. Knivik is optimized for startups and growth teams looking to engage with warm prospects on active social threads."
      }
    ]
  },
  mention: {
    competitor: {
      slug: "mention",
      name: "Mention",
      tagline: "Real-Time Web and Social Media Monitoring",
      description: "Mention is a well-known social media listening and brand tracking tool. It allows companies to monitor brand name mentions, keywords, and competitor activity across social networks, forums, blogs, and news sites. While it provides excellent web monitoring and sentiment analysis for PR and marketing teams, it lacks direct buyer intent classification, automated AI outreach replies, and CRM pipeline tracking to convert those mentions into active sales.",
      rating: 4.3,
      pricing: "Starts at $41/mo (billed annually)",
      platforms: ["Reddit", "HackerNews", "X (Twitter)", "Facebook", "Instagram", "Blogs", "News", "Forums"],
      pros: [
        "Broad real-time monitoring across diverse social networks and websites",
        "Robust sentiment analysis, keyword filtering, and automated reporting",
        "User-friendly interface with team collaboration and alert sharing features"
      ],
      limitations: [
        "Heavy noise from keyword scraping without B2B buying intent filtering",
        "No native AI outreach generation to craft immediate replies for leads",
        "Lacks CRM pipeline features to manage and track lead statuses",
        "Does not offer automated multi-tier fallback scrapers"
      ]
    },
    keyDifferences: [
      "Mention is a PR-focused social listening tool; Knivik is an AI-powered sales lead acquisition system.",
      "Mention triggers notifications for every single keyword mention, leading to alert fatigue; Knivik evaluates context to score buying intent (e.g. BUY_NOW, INTERESTED).",
      "Knivik includes custom AI-crafted outreach recommendations based on post content; Mention only shows you the post and expects you to write the message.",
      "Knivik offers a generous free-tier, whereas Mention requires paid plans to unlock essential filters."
    ],
    features: defaultFeatures("Mention", true, true, true),
    verdict: "Mention is a great fit for brands and marketing teams looking to monitor general brand sentiment, track PR campaigns, and follow industry trends across a wide range of social media. However, for sales teams, startups, agencies, and builders searching for active prospects asking for solutions on Reddit, HackerNews, or Twitter, Mention offers too much noise and no outreach assistance. Knivik acts as a focused AI sales development representative that cuts through the noise and helps you close leads.",
    faq: [
      {
        question: "Can Mention help me generate reply drafts?",
        answer: "No. Mention only reports where your keywords were found. It does not provide any AI assistance to write DMs, replies, or personalized pitches. Knivik automatically generates value-first response copies for every lead."
      },
      {
        question: "Is Mention suitable for startups looking for customers?",
        answer: "It can be, but you will waste a lot of time sorting through non-sales mentions (such as news reports or general chat). Knivik uses semantic analysis to filter out non-leads, saving you hours of manual vetting."
      }
    ]
  },
  awario: {
    competitor: {
      slug: "awario",
      name: "Awario",
      tagline: "Affordable Social Listening & Brand Monitoring Tool",
      description: "Awario is an affordable social media monitoring tool designed for small businesses and solopreneurs to track keywords across social networks, blogs, and news. It boasts a 'leads' feature that attempts basic query matching to find prospects. However, it relies heavily on literal keyword matching without semantic understanding, meaning it misses high-intent conversations that don't use the exact keywords, and floods you with irrelevant results.",
      rating: 4.1,
      pricing: "Starts at $29/mo (billed annually)",
      platforms: ["Reddit", "HackerNews", "X (Twitter)", "Facebook", "Instagram", "Blogs", "News", "Forums"],
      pros: [
        "Very affordable entry-level pricing for small businesses",
        "Tracks a large volume of sources including blogs and forums",
        "Includes a 'Leads' module for basic keyword-based prospect tracking"
      ],
      limitations: [
        "Keyword-based prospect detection leads to high rates of false positives",
        "No context-aware AI reply writer or outreach recommendation engine",
        "Lacks lead management CRM tracking to move candidates through a sales pipeline"
      ]
    },
    keyDifferences: [
      "Awario leads feature uses basic keyword query pairs; Knivik utilizes deep LLM semantic filters to score buying intent (e.g., BUY_NOW, FRUSTRATED_COMPETING).",
      "Knivik drafts personalized outreach replies in seconds using local value templates; Awario leaves you to manually write and send every outreach response.",
      "Awario is built primarily for general brand tracking; Knivik is engineered specifically to find and track qualified B2B customer leads.",
      "Knivik offers a 100% free-forever starting tier; Awario's cheapest plans require a monthly paid subscription."
    ],
    features: defaultFeatures("Awario", true, true, true),
    verdict: "Awario is a budget-friendly option for brand tracking, PR monitoring, and simple social listening. While it has a built-in 'leads' tool, it lacks the semantic intelligence needed to filter out irrelevant posts, and does not help you draft warm-outreach reply recommendations. For developers, agency owners, and startup founders who need highly accurate intent filtering and instant AI reply drafts to reach buyers, Knivik is the superior sales pipeline companion.",
    faq: [
      {
        question: "How does Awario's 'leads' feature differ from Knivik?",
        answer: "Awario's leads module works by matching simple keyword combinations (like 'looking for' + 'recommendation'). This results in high noise and missed opportunities. Knivik uses semantic AI models that understand context, finding posts where people express intent even without using your exact keywords."
      },
      {
        question: "Does Awario generate outreach reply templates?",
        answer: "No. Awario identifies mentions but does not draft outreach responses. Knivik automatically creates tailored outreach messages based on the lead's post context and your product's value proposition."
      }
    ]
  }
};

export function getComparison(slug: string): ComparisonData | undefined {
  const key = slug.toLowerCase().trim();
  return comparisons[key];
}

export function getAllCompetitorSlugs(): string[] {
  return Object.keys(comparisons);
}

export function generateComparisonMetadata(slug: string): Metadata {
  const data = getComparison(slug);
  
  if (!data) {
    return constructPageMetadata({
      title: "Alternative Comparison",
      description: "Compare Knivik to other social listening and lead generation tools.",
      path: `/alternatives/${slug}`,
      noIndex: true,
    });
  }

  const competitor = data.competitor;
  return constructPageMetadata({
    title: `Best ${competitor.name} Alternative in 2026 (Why Switch?)`,
    description: `Compare ${competitor.name} vs Knivik. Discover why startup founders, agencies, freelancers, and sales teams are switching to Knivik for AI-powered B2B lead generation for products and services.`,
    path: `/alternatives/${competitor.slug}`,
    keywords: [
      `${competitor.name} alternative`,
      `alternative to ${competitor.name}`,
      `${competitor.name} vs Knivik`,
      `best ${competitor.name} alternatives`,
      "Reddit monitoring tool",
      "AI lead finder",
      "social selling",
      "semantic search engine"
    ]
  });
}

export function generateComparisonFAQSchema(data: ComparisonData): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faq.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}

import { SchemaService } from "./schema";

export function generateComparisonBreadcrumbsSchema(data: ComparisonData): Record<string, any> {
  return SchemaService.generateBreadcrumbsSchema([
    { name: "Home", item: "/" },
    { name: "Alternatives", item: "/alternatives" },
    { name: `${data.competitor.name} Alternative`, item: `/alternatives/${data.competitor.slug}` },
  ]);
}

// Backward compatibility class wrapper
export class ComparisonService {
  public static getComparison(slug: string): ComparisonData | undefined {
    return getComparison(slug);
  }

  public static getAllSlugs(): string[] {
    return getAllCompetitorSlugs();
  }

  public static generateMetadata(slug: string): Metadata {
    return generateComparisonMetadata(slug);
  }

  public static generateFAQSchema(data: ComparisonData): Record<string, any> {
    return generateComparisonFAQSchema(data);
  }

  public static generateBreadcrumbsSchema(data: ComparisonData): Record<string, any> {
    return generateComparisonBreadcrumbsSchema(data);
  }
}
