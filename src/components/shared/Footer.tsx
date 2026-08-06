import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { CurrencySelector } from "./CurrencySelector";
import FooterNewsletter from "./footer/FooterNewsletter";
import FooterLinks from "./footer/FooterLinks";
import FooterSocial from "./footer/FooterSocial";
import FooterLegal from "./footer/FooterLegal";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-primary text-primary-foreground overflow-hidden">
      {/* Organic textured overlay - botanical/volcanic feel */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px'
        }}
      />

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />

      <section className="py-10 sm:py-20 px-4 relative z-10">
        <div className="container mx-auto">
          {/* ==================== MOBILE (< md) ==================== */}
          <div className="block md:hidden">
            {/* Brand */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold tracking-tight text-primary-foreground mb-1.5">
                The Remainder
              </h3>
              <p className="text-[10px] uppercase tracking-[0.35em] text-primary-foreground/40 font-medium">
                {t('footer.tagline')}
              </p>
            </div>

            <FooterNewsletter variant="mobile" />
            <FooterLinks variant="mobile" />

            {/* Social & Language */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <FooterSocial variant="mobile" />
              <div className="h-6 w-px bg-primary-foreground/10" />
              <LanguageSwitcher variant="footer" />
              <div className="h-6 w-px bg-primary-foreground/10" />
              <CurrencySelector />
            </div>
          </div>

          {/* ==================== TABLET (md to lg) ==================== */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-2 gap-10 mb-10">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-primary-foreground mb-1.5">
                  The Remainder
                </h3>
                <p className="text-[10px] uppercase tracking-[0.35em] text-primary-foreground/40 font-medium mb-6">
                  {t('footer.tagline')}
                </p>
                <FooterSocial variant="tablet" />
              </div>
              <FooterNewsletter variant="tablet" />
            </div>

            <div className="grid grid-cols-2 gap-10 mb-10">
              <FooterLinks variant="tablet" />
            </div>

            <div className="flex items-center justify-center gap-3 mb-8">
              <LanguageSwitcher variant="footer" />
              <div className="h-5 w-px bg-primary-foreground/10" />
              <CurrencySelector />
            </div>
          </div>

          {/* ==================== DESKTOP (lg+) ==================== */}
          <div className="hidden lg:grid grid-cols-4 gap-10 mb-10">
            <div>
              <div className="mb-5">
                <h3 className="text-xl font-semibold tracking-tight text-primary-foreground mb-1.5">
                  The Remainder
                </h3>
                <p className="text-[10px] uppercase tracking-[0.35em] text-primary-foreground/40 font-medium">
                  {t('footer.tagline')}
                </p>
              </div>
              <FooterSocial variant="desktop" />
            </div>

            <FooterLinks variant="desktop" />

            <FooterNewsletter variant="desktop" />
          </div>

          <FooterLegal />
        </div>
      </section>
    </footer>
  );
};

export default Footer;
