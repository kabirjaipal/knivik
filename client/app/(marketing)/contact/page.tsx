import { Metadata } from "next";
import { FaInstagram, FaTwitter } from "react-icons/fa";
import { MetadataService } from "@/lib/seo/application/metadata.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Contact Us",
  description: "Have questions about Knivik? Get in touch with our team for support or business inquiries. We're here to help you find your next customer.",
  path: "/contact",
});

export default function Contact() {
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

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">Get in touch.</h1>
      <p className="text-base sm:text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
        Need help? Have a feature request? Or just want to talk about lead generation? We're here.
      </p>

      <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          return (
            <div key={index} className="p-8 rounded-3xl bg-muted/30 border border-border/40 hover:border-primary/40 transition-colors group">
              <Icon className={`w-10 h-10 ${method.iconColor} mb-6`} />
              <h2 className="text-2xl font-bold mb-2">{method.title}</h2>
              <p className="text-muted-foreground mb-6">{method.description}</p>
              <a 
                href={method.link} 
                target={method.isExternal ? "_blank" : undefined}
                className={`${method.linkColor} font-bold hover:underline`}
              >
                {method.linkText}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
