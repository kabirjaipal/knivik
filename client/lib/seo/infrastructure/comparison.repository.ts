import { ComparisonData, ComparisonFeature } from "../domain/comparison.model";

export interface IComparisonRepository {
  getByCompetitorSlug(slug: string): ComparisonData | undefined;
  getAllCompetitorSlugs(): string[];
}

export class ComparisonRepository implements IComparisonRepository {
  private static readonly defaultFeatures = (competitorName: string, competitorHasMonitoring: boolean, competitorHasMultiChannel: boolean, competitorHasAutomation: boolean): ComparisonFeature[] => [
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

  private readonly comparisons: Record<string, ComparisonData> = {

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
      features: ComparisonRepository.defaultFeatures("F5Bot", true, false, false),
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
        description: "Syften is a community keyword monitoring tool designed for founders. It is lightweight and covers several platforms, but relies entirely on literal keyword rules. It requires you to configure dozens of manual search combinations, leading to constant manual filtering or missed leads.",
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
      features: ComparisonRepository.defaultFeatures("Syften", true, true, true),
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
      features: ComparisonRepository.defaultFeatures("GummySearch", true, false, false),
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
      features: ComparisonRepository.defaultFeatures("Apollo.io", false, false, true),
      verdict: "If your strategy revolves around large-scale cold emailing using static job titles, Apollo.io is the undisputed database leader. But if you want to identify hot sales opportunities the second someone asks for a recommendation or complains about a competitor on Reddit, HackerNews, or X, Knivik is the ultimate modern lead acquisition scanner.",
      faq: [
        {
          question: "Can I find warm sales leads on Reddit using Apollo.io?",
          answer: "No. Apollo.io is a static contact database. It does not monitor live social channels, discussions, or community posts. Knivik monitors these platforms in real-time to find people actively asking for recommendations."
        },
        {
          question: "How does Knivik compare to cold emailing with Apollo?",
          answer: "Cold emailing typically gets a 1% to 2% response rate. Replying to a live post where someone is actively asking for your product (which Knivik finds and drafts pitches for) gets up to a 30% conversion rate because the buyer intent is hot and immediate."
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
      features: ComparisonRepository.defaultFeatures("Hootsuite", true, true, true),
      verdict: "For general marketing agencies looking to schedule Instagram posts or track corporate brand hashtags across social networks, Hootsuite is a powerful suite. However, for startups, founders, and sales teams looking to convert live discussions on Reddit, HN, and X into qualified customers, Knivik is the clear, intelligent choice.",
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
      features: ComparisonRepository.defaultFeatures("BuzzSumo", true, true, true),
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
    }
  };

  public getByCompetitorSlug(slug: string): ComparisonData | undefined {
    const key = slug.toLowerCase().trim();
    return this.comparisons[key];
  }

  public getAllCompetitorSlugs(): string[] {
    return Object.keys(this.comparisons);
  }
}
