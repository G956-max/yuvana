import { useState } from 'react';
import { Search, User, ShoppingBag, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import SearchMenu from './SearchMenu';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const { cartCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <SearchMenu 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={onNavigate} 
      />
      <nav 
        className={`fixed top-[0px] left-0 w-full h-[70px] z-[1000] transition-all flex items-center ${
          currentPage === 'products' || currentPage.startsWith('product/')
            ? '' // using inline styles for perfection
            : 'shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-b border-beige-dark'
        }`}
        style={
          currentPage === 'products' || currentPage.startsWith('product/') 
          ? { border: 'none', boxShadow: 'none', margin: 0, padding: 0, backgroundColor: '#ffffff' } 
          : { backgroundColor: '#ffffff' }
        }
      >
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 flex items-center justify-between relative h-full">
        {/* Left: Logo */}
        <div 
          className="text-base md:text-xl font-serif tracking-[0.15em] md:tracking-[0.2em] text-primary font-bold whitespace-nowrap cursor-pointer transition-all hover:opacity-80"
          onClick={() => { onNavigate('home'); setIsMenuOpen(false); }}
        >
          YUVANA
        </div>
        
        {/* Center: Menu items (Perfect Center with 3D animation) */}
        <div className="hidden md:flex items-center gap-4 text-[11px] font-bold tracking-[0.15em] uppercase absolute left-1/2 -translate-x-1/2">
          {[
            { id: 'home', label: t.nav.home },
            { id: 'products', label: t.nav.product },
            { id: 'about', label: t.nav.about }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)} 
              className={`px-5 py-2.5 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                currentPage === item.id 
                ? 'bg-[#1A3626] text-white shadow-[0_5px_15px_rgba(26,54,38,0.3)]' 
                : 'bg-[#f2f5f3] text-[#1A3626] hover:bg-[#1A3626] hover:text-white hover:shadow-[0_10px_20px_-5px_rgba(26,54,38,0.4)] hover:-translate-y-1 active:scale-95 active:translate-y-0'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: Icons with 3D animation */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <button 
            onClick={toggleLanguage}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center gap-1 bg-[#f2f5f3] text-[#1A3626] hover:bg-[#1A3626] hover:text-white hover:shadow-[0_10px_20px_-5px_rgba(26,54,38,0.4)] transition-all duration-300"
            title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5 hidden lg:block" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase">{language}</span>
          </button>
          
          <button 
            onClick={() => setIsSearchOpen(true)}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isSearchOpen 
              ? 'bg-[#1A3626] text-[#C49A45]' 
              : 'bg-[#f2f5f3] text-[#1A3626] hover:bg-[#1A3626] hover:text-[#C49A45]'
            }`}
          >
            <Search className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>

          <button 
            onClick={() => onNavigate('profile')}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              currentPage === 'profile' 
              ? 'bg-[#1A3626] text-[#C49A45]' 
              : 'bg-[#f2f5f3] text-[#1A3626] hover:bg-[#1A3626] hover:text-[#C49A45]'
            }`}
          >
            <User className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>

          <button 
            onClick={() => onNavigate('cart')}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center relative transition-all duration-300 ${
              currentPage === 'cart' 
              ? 'bg-[#1A3626] text-[#C49A45]' 
              : 'bg-[#f2f5f3] text-[#1A3626] hover:bg-[#1A3626] hover:text-[#C49A45]'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5 md:w-5 md:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C49A45] text-white text-[9px] flex items-center justify-center rounded-full font-bold border border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 md:hidden rounded-xl flex items-center justify-center bg-[#f2f5f3] text-[#1A3626] active:scale-90 transition-all font-bold"
          >
            {isMenuOpen ? <X className="w-5 h-5 transition-all rotate-90" /> : <Menu className="w-5 h-5 transition-all" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 top-[70px] bg-white/95 backdrop-blur-xl z-[900] transition-all duration-500 md:hidden flex flex-col items-center justify-start pt-10 px-6 overflow-hidden ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center gap-6 w-full max-w-[300px]">
          {[
            { id: 'home', label: t.nav.home },
            { id: 'products', label: t.nav.product },
            { id: 'about', label: t.nav.about }
          ].map((item, index) => (
            <button 
              key={item.id}
              onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }} 
              className={`w-full py-4 rounded-2xl text-base font-bold tracking-[0.1em] uppercase transition-all duration-500 flex items-center justify-center gap-3 ${
                currentPage === item.id 
                ? 'bg-[#1A3626] text-white shadow-lg shadow-[#1A3626]/20 scale-105' 
                : 'bg-[#f2f5f3] text-[#1A3626] active:scale-95'
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item.label}
            </button>
          ))}
          
          <div className="mt-10 pt-10 border-t border-beige-dark w-full flex flex-col items-center gap-4">
            <p className="text-[10px] uppercase tracking-[2px] text-secondary/60">Traditional Wisdom • Modern Living</p>
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-beige-dark flex items-center justify-center opacity-50"></div>
               <div className="w-8 h-8 rounded-full bg-beige-dark flex items-center justify-center opacity-50"></div>
               <div className="w-8 h-8 rounded-full bg-beige-dark flex items-center justify-center opacity-50"></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
