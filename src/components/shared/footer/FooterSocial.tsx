import { Instagram, Mail, MessageCircle } from "lucide-react";
import { STORE_CONTACT, STORE_BRAND } from "@/config/store";

interface FooterSocialProps {
  /** Layout variant for responsive rendering */
  variant: "mobile" | "tablet" | "desktop";
}

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/theremainderpl/', label: 'Instagram' },
  { icon: MessageCircle, href: `https://wa.me/${STORE_CONTACT.whatsappNumber}?text=${encodeURIComponent(`Hola, tengo una consulta sobre ${STORE_BRAND.name}`)}`, label: 'WhatsApp' },
  { icon: Mail, href: 'mailto:guillermocubells@gmail.com?subject=Consulta%20desde%20The%20Remainder', label: 'Email' },
];

const FooterSocial = ({ variant }: FooterSocialProps) => {
  if (variant === "desktop") {
    return (
      <div className="flex items-center gap-2.5 mt-6">
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="w-8 h-8 rounded-full bg-primary-foreground/[0.03] hover:bg-primary-foreground/[0.08] border border-primary-foreground/[0.06] hover:border-primary-foreground/[0.12] flex items-center justify-center transition-all duration-300 ease-out group"
          >
            <social.icon className="h-3.5 w-3.5 text-primary-foreground/40 group-hover:text-primary-foreground/60 transition-colors duration-300" />
          </a>
        ))}
      </div>
    );
  }

  // Mobile and Tablet share the same social icon style
  return (
    <div className="flex items-center gap-3">
      {socialLinks.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className="w-10 h-10 rounded-full bg-primary-foreground/[0.05] hover:bg-primary-foreground/[0.1] border border-primary-foreground/[0.08] flex items-center justify-center transition-all duration-300 group"
        >
          <social.icon className="h-4 w-4 text-primary-foreground/50 group-hover:text-primary-foreground/70 transition-colors duration-300" />
        </a>
      ))}
    </div>
  );
};

export default FooterSocial;
