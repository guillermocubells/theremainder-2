import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import { CurrencySelector } from "../CurrencySelector";

const FooterLegal = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Quote - hidden on mobile for cleaner experience */}
      <div className="hidden sm:block max-w-xl mx-auto text-center mb-8">
        <blockquote className="text-sm font-light italic text-primary-foreground/35 leading-[1.9] tracking-wide">
          <span className="block">
            "{t('footer.quote').split('—')[0].trim()}"
          </span>
          <span className="block mt-2 text-primary-foreground/25">
            — {t('footer.quoteBreak')}
          </span>
        </blockquote>
      </div>

      {/* Final divider */}
      <div className="border-t border-primary-foreground/[0.06] pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] tracking-wide text-primary-foreground/30">
          <div className="flex items-center gap-2">
            <span className="font-medium">&copy; {new Date().getFullYear()} The Remainder</span>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher variant="footer" />
            <div className="h-4 w-px bg-primary-foreground/10" />
            <CurrencySelector />
            <span className="text-primary-foreground/25">
              {t('footer.rights')}
            </span>
          </div>
          <span className="lg:hidden text-primary-foreground/25">
            {t('footer.rights')}
          </span>
        </div>
      </div>
    </>
  );
};

export default FooterLegal;
