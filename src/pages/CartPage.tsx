import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/urlHelper';

interface CartPageProps {
  onNavigate: (page: string) => void;
}

export default function CartPage({ onNavigate }: CartPageProps) {
  const { t } = useLanguage();
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping for now
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-[#f5f5f5] selection:bg-secondary/30 pt-[70px]">
      <Navbar onNavigate={onNavigate} currentPage="cart" />

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <h1 className="text-4xl font-serif text-primary mb-10">{t.cart.title}</h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-beige rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-serif text-primary mb-4">{t.cart.empty}</h2>
            <button
              onClick={() => onNavigate('products')}
              className="px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary transition-colors font-medium"
            >
              {t.cart.continueShopping}
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Cart Items */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              {cartItems.map((item) => (
                <motion.div
                  key={`${item.id}-${item.variant}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex flex-row gap-4 sm:gap-6 items-center"
                >
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-beige flex-shrink-0 cursor-pointer" onClick={() => onNavigate(`product/${item.id}`)}>
                    <img src={getImageUrl(item.image)} alt={t.products[item.nameKey as keyof typeof t.products] || item.nameKey} className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between h-full min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-1 sm:mb-2 gap-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-xl font-serif text-primary cursor-pointer hover:text-secondary transition-colors truncate" onClick={() => onNavigate(`product/${item.id}`)}>
                          {t.products[item.nameKey as keyof typeof t.products] || item.nameKey}
                        </h3>
                        {item.variant && (
                          <p className="text-[11px] sm:text-sm text-secondary/60 font-medium">{item.variant}</p>
                        )}
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-primary whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 sm:mt-auto">
                      <div className="flex items-center gap-2 sm:gap-4 bg-[#f5f5f5] rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variant)}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all text-primary active:scale-90"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <span className="w-3 sm:w-4 text-center text-xs sm:text-sm font-bold text-primary">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all text-primary active:scale-90"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id, item.variant)}
                        className="w-8 h-8 sm:w-auto flex items-center justify-center sm:gap-2 text-secondary/60 hover:text-red-500 transition-colors text-[11px] sm:text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.cart.remove}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-[100px]">
                <h2 className="text-2xl font-serif text-primary mb-6">Order Summary</h2>
                
                <div className="flex flex-col gap-4 mb-6 text-primary">
                  <div className="flex justify-between">
                    <span className="text-secondary/80">{t.cart.subtotal}</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary/80">{t.cart.shipping}</span>
                    <span className="font-medium text-secondary">{t.cart.free}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-6 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">{t.cart.total}</span>
                    <span className="text-2xl font-serif text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (cartItems.length > 0) {
                      localStorage.setItem('checkout_cart', JSON.stringify(cartItems));
                      localStorage.removeItem('checkout_product'); // Clear single product if any
                      onNavigate('checkout');
                    }
                  }}
                  className="w-full py-4 bg-primary text-white rounded-full hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2 group"
                >
                  {t.cart.checkout}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
