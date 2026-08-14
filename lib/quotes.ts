export interface Quote {
  text: string;
  author: string;
  role: string;
  initials: string;
}

export const QUOTES: Quote[] = [
  {
    text: "The aim of marketing is to know and understand the customer so well the product or service fits him and sells itself.",
    author: "Peter Drucker",
    role: "Management Consultant & Educator",
    initials: "PD",
  },
  {
    text: "Get closer than ever to your customers. So close that you tell them what they need well before they realize it themselves.",
    author: "Steve Jobs",
    role: "Co-founder, Apple Inc.",
    initials: "SJ",
  },
  {
    text: "Approach each customer with the idea of helping him or her solve a problem or achieve a goal, not of selling a product or service.",
    author: "Brian Tracy",
    role: "Motivational Speaker & Author",
    initials: "BT",
  },
  {
    text: "You are out of business if you don't have a prospect.",
    author: "Zig Ziglar",
    role: "Author & Sales Expert",
    initials: "ZZ",
  },
  {
    text: "The lead generation process starts by finding out where your target market lives on the web.",
    author: "Wayne Davis",
    role: "Business Strategist & Author",
    initials: "WD",
  },
  {
    text: "Make a customer, not a sale.",
    author: "Katherine Barchetti",
    role: "Retail Pioneer & Author",
    initials: "KB",
  }
];
