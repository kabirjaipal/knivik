"use client";

import { useState } from "react";
import { FaInstagram, FaTwitter } from "react-icons/fa";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactMethods = [
    {
      icon: FaTwitter,
      iconColor: "text-sky-400",
      title: "Twitter / X",
      description: "Best for quick questions and daily updates. Follow us for the latest AI news.",
      link: "https://x.com/knivikai",
      linkText: "@knivikai →",
      linkColor: "text-sky-400",
      isExternal: true,
    },
    {
      icon: FaInstagram,
      iconColor: "text-pink-500",
      title: "Instagram",
      description: "Best for behind the scenes and feature previews. Reach out via direct message.",
      link: "https://instagram.com/knivikai",
      linkText: "@knivikai →",
      linkColor: "text-pink-500",
      isExternal: true,
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      toast.success(data.message || "Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl text-center">
      <div className="space-y-4 mb-16">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Get in touch.</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Need help? Have a feature request? Or just want to talk about lead generation? Fill out the form or reach out directly via our socials.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 text-left max-w-5xl mx-auto items-stretch">
        {/* Left Column - Socials */}
        <div className="md:col-span-2">
          <div className="p-8 rounded-3xl bg-card border border-border/40 shadow-sm flex flex-col justify-center h-full space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Direct Support</h2>
              <p className="text-sm text-muted-foreground mt-1">Ping us on socials for quick discussions.</p>
            </div>

            <div className="space-y-4">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div key={index} className="p-5 rounded-2xl bg-muted/20 border border-border/30 hover:border-primary/40 transition-colors flex items-start gap-4">
                    <Icon className={`w-7 h-7 ${method.iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <h3 className="text-base font-bold text-foreground">{method.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2 leading-relaxed">{method.description}</p>
                      <a 
                        href={method.link} 
                        target={method.isExternal ? "_blank" : undefined}
                        className={`${method.linkColor} text-xs font-bold hover:underline`}
                      >
                        {method.linkText}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Contact Form */}
        <div className="md:col-span-3">
          <div className="p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Send a Message</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll get back to you as soon as possible.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Name</label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                <Input
                  id="subject"
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
                <Textarea
                  id="message"
                  placeholder="Write your message here..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="resize-none"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
