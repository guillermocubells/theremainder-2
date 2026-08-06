import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FooterNewsletterProps {
  /** Layout variant for responsive rendering */
  variant: "mobile" | "tablet" | "desktop";
}

const FooterNewsletter = ({ variant }: FooterNewsletterProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success(t('footer.newsletter.success'));
    setEmail("");
    setIsSubscribing(false);
  };

  const isMobile = variant === "mobile";
  const isDesktop = variant === "desktop";

  return (
    <div className={isMobile ? "mb-8 max-w-sm mx-auto" : undefined}>
      <h4 className={`text-[10px] font-medium uppercase tracking-[0.3em] text-primary-foreground/35 ${isDesktop ? "mb-5" : "mb-4"} ${isMobile ? "text-center" : ""}`}>
        {t('footer.newsletter.title')}
      </h4>
      <p className={`text-[13px] text-primary-foreground/50 ${isDesktop ? "mb-5" : "mb-4"} leading-[1.7] ${isMobile ? "text-center" : ""}`}>
        {t('footer.newsletter.description')}
      </p>
      <form onSubmit={handleNewsletterSubmit} className="space-y-3">
        <Input
          type="email"
          autoComplete="email"
          placeholder={t('footer.newsletter.placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`bg-primary-foreground/[0.03] border-primary-foreground/[0.08] text-primary-foreground text-[13px] placeholder:text-primary-foreground/30 focus:border-moss/40 focus:ring-moss/15 ${isDesktop ? "h-10 rounded-md" : "h-11 rounded-lg"}`}
          required
        />
        <Button
          type="submit"
          disabled={isSubscribing}
          className={`w-full bg-moss/90 hover:bg-moss text-primary-foreground border-0 ${isDesktop ? "h-10 rounded-md" : "h-11 rounded-lg"} text-[13px] font-medium tracking-wide transition-all duration-300`}
        >
          {isSubscribing ? "..." : t('footer.newsletter.subscribe')}
        </Button>
      </form>
    </div>
  );
};

export default FooterNewsletter;
