import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-beige py-16 md:py-20 w-full overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 min-w-0">
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div className="text-2xl md:text-3xl font-serif tracking-[0.3em] font-bold mb-8 md:mb-10 uppercase">
            {t.footer.brand}
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 md:gap-x-12 gap-y-4 text-xs md:text-sm font-light tracking-widest uppercase opacity-70">
            <button onClick={() => onNavigate('home')} className="hover:opacity-100 transition-opacity">
              {t.nav.home}
            </button>
            <button onClick={() => onNavigate('products')} className="hover:opacity-100 transition-opacity">
              {t.nav.product}
            </button>
            <button onClick={() => onNavigate('about')} className="hover:opacity-100 transition-opacity">
              {t.nav.about}
            </button>
            <a href="#" className="hover:opacity-100 transition-opacity">
              {t.footer.sustainability}
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity">
              {t.footer.contact}
            </a>
          </div>
        </div>

        <div className="pt-8 md:pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-[10px] md:text-xs font-light opacity-50">
          <p>
            © 2026 {t.footer.brand}. {t.footer.rights}
          </p>
          <div className="flex gap-6 md:gap-8 items-center">
            <a href="#" className="hover:underline">
              {t.footer.privacy}
            </a>
            <a href="#" className="hover:underline">
              {t.footer.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
