import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PROJECT_NAME } from "@/lib/constants"

const faqs = [
  {
    question: "How does the AI intent scoring work?",
    answer: "Our proprietary AI model analyzes the context, sentiment, and phrasing of every post. It filters out complaints or general discussions, outputting a 0-100 score where 90+ means the user is actively asking to buy a solution right now."
  },
  {
    question: "Which platforms do you currently support?",
    answer: "We currently monitor Reddit and HackerNews in real-time. Twitter/X and Discord integrations are currently in development for our Growth tier customers."
  },
  {
    question: "Do I have to write the replies myself?",
    answer: `${PROJECT_NAME} generates a highly customized, non-spammy draft reply based on your product's USPs and the context of the user's post. You can optionally edit it, then just click 'copy' or 'reply' to post it natively.`
  },
  {
    question: "Will social networks ban my account for this?",
    answer: `No. ${PROJECT_NAME} is a listening tool. We do not automate the actual posting of comments (which is what triggers bot bans). We find the leads, and you reply as a human, ensuring your accounts remain completely safe and authentic.`
  }
];

export function FAQ() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about the product and how it works.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
