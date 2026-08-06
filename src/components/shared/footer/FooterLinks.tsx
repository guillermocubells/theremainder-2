import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface FooterLinksProps {
  /** Layout variant for responsive rendering */
  variant: "mobile" | "tablet" | "desktop";
}

const navigationLinks = [
  { key: 'contact', href: '/contact' },
  { key: 'shipping', href: '/envios-y-entregas' },
  { key: 'referrals', href: '/programa-referidos' },
  { key: 'faq', href: '/faq' },
];

const legalLinks = [
  { key: 'termsOfSale', href: '/condiciones-venta' },
  { key: 'privacyPolicy', href: '/privacy' },
];

const FooterLinks = ({ variant }: FooterLinksProps) => {
  const { t } = useTranslation();

  const isMobile = variant === "mobile";
  const isDesktop = variant === "desktop";

  const linkClass = isDesktop
    ? "text-[13px] text-primary-foreground/55 hover:text-primary-foreground/80 transition-colors duration-300 leading-relaxed"
    : isMobile
      ? "text-[13px] text-primary-foreground/55 hover:text-primary-foreground/80 transition-colors duration-300"
      : "text-[13px] text-primary-foreground/55 hover:text-primary-foreground/80 transition-colors duration-300 inline-block py-0.5";

  const headingClass = `text-[10px] font-medium uppercase tracking-[0.3em] text-primary-foreground/35 ${isDesktop ? "mb-5" : "mb-4"}`;
  const listClass = isDesktop ? "space-y-3" : "space-y-2.5";

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Navigation */}
        <div className="text-left">
          <h4 className={headingClass}>
            {t('footer.navigation.title')}
          </h4>
          <ul className={listClass}>
            {navigationLinks.map((link) => (
              <li key={link.key}>
                <Link to={link.href} className={linkClass}>
                  {t(`footer.navigation.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="text-left">
          <h4 className={headingClass}>
            {t('footer.legal.title')}
          </h4>
          <ul className={listClass}>
            {legalLinks.map((link) => (
              <li key={link.key}>
                <Link to={link.href} className={linkClass}>
                  {t(`footer.legal.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Tablet and Desktop share same structure (two separate columns)
  return (
    <>
      {/* Navigation */}
      <div>
        <h4 className={headingClass}>
          {t('footer.navigation.title')}
        </h4>
        <ul className={listClass}>
          {navigationLinks.map((link) => (
            <li key={link.key}>
              <Link to={link.href} className={linkClass}>
                {t(`footer.navigation.${link.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal */}
      <div>
        <h4 className={headingClass}>
          {t('footer.legal.title')}
        </h4>
        <ul className={listClass}>
          {legalLinks.map((link) => (
            <li key={link.key}>
              <Link to={link.href} className={linkClass}>
                {t(`footer.legal.${link.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default FooterLinks;
