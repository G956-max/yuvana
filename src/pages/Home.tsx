import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, Leaf, ShieldCheck, Sparkles, Award, ShoppingBag, Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import axios from 'axios';
import { getImageUrl } from '../utils/urlHelper';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: string;
  name: string;
  image: string;
}

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  active: boolean;
}

const features = [
  { icon: Leaf, titleKey: 'natural', descKey: 'naturalDesc' },
  { icon: ShieldCheck, titleKey: 'chemicalFree', descKey: 'chemicalFreeDesc' },
  { icon: Sparkles, titleKey: 'traditional', descKey: 'traditionalDesc' },
  { icon: Award, titleKey: 'quality', descKey: 'qualityDesc' },
];

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const handleAuthAction = (action: () => void) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    action();
  };

  const nextBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const fetchData = async () => {
      try {
        // Fetch Banners - Fetch all and filter/sort in-memory to avoid Firestore index errors
        const bannersSnapshot = await getDocs(collection(db, 'banners'));
        const bannersData = bannersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        const activeBanners = bannersData
          .filter(b => b.active === true)
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          
        setBanners(activeBanners);

        // Fetch Categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(categoriesData);

        // Fetch Featured Products (first 4)
        const productsQuery = query(collection(db, 'products'), limit(4));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);

      } catch (error) {
        console.error('Failed to fetch data from Firestore:', error);
        // Fallback dummy categories
        const dummyCategories: Category[] = [
          { id: '1', name: 'Face Care', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400' },
          { id: '2', name: 'Hair Care', image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=400' },
          { id: '3', name: 'Body Care', image: 'https://images.unsplash.com/photo-1608248593842-8d7d8e6121fe?auto=format&fit=crop&q=80&w=400' },
          { id: '4', name: 'Wellness', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400' }
        ];
        setCategories(dummyCategories);
      } finally {
        setLoadingProducts(false);
        setLoadingCategories(false);
        setLoadingBanners(false);
      }
    };
    fetchData();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [banners, nextBanner]);

  return (
    <div className="min-h-screen bg-beige selection:bg-secondary/30 overflow-x-hidden pt-[70px]">
      <Navbar onNavigate={onNavigate} currentPage="home" />

      {/* Hero Section - Dynamic Slider */}
      <section className="relative h-[65vh] md:h-[75vh] w-full max-w-full flex items-center justify-center overflow-hidden select-none mt-0 pt-0 bg-gray-100">
        <AnimatePresence mode="wait">
          {banners.length > 0 ? (
            <motion.div
              key={banners[currentBannerIndex].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
                <motion.img 
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 6, ease: "easeOut" }}
                  src={getImageUrl(banners[currentBannerIndex].image)} 
                  alt={banners[currentBannerIndex].title} 
                  className="w-full h-full object-cover object-center pointer-events-none block"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-beige/90 via-beige/40 to-transparent pointer-events-none left-0 right-0" />
              </div>

              <div className="relative z-10 w-full h-full max-w-[1200px] mx-auto px-10 flex items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="max-w-[600px] flex flex-col gap-4 md:gap-6"
                >
                  <div>
                    <span className="text-[10px] md:text-sm font-bold tracking-[0.3em] text-secondary uppercase mb-2 block">
                      Ayurveda Editions Premium
                    </span>
                    <h1 className="text-3xl md:text-6xl font-serif text-primary leading-tight">
                      {language === 'ta' && banners[currentBannerIndex].title_ta ? banners[currentBannerIndex].title_ta : banners[currentBannerIndex].title}
                    </h1>
                  </div>
                  
                  <p className="text-sm md:text-lg text-primary/80 font-light leading-relaxed">
                    {language === 'ta' && banners[currentBannerIndex].subtitle_ta ? banners[currentBannerIndex].subtitle_ta : banners[currentBannerIndex].subtitle}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate(banners[currentBannerIndex].link || 'products')}
                    className="w-fit px-8 py-3.5 md:py-4 bg-primary text-beige rounded-2xl font-bold flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                  >
                    Explore Offer
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // Fallback Static Hero if no banners are added
            <motion.div 
              key="static-fallback"
              className="absolute inset-0 w-full h-full"
            >
              <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
                <img 
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=2000" 
                  alt="Default background" 
                  className="w-full h-full object-cover object-center pointer-events-none block"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-beige/80 via-beige/30 to-transparent pointer-events-none left-0 right-0" />
              </div>
              <div className="relative z-10 w-full h-full max-w-[1200px] mx-auto px-10 flex items-center">
                <div className="max-w-[500px]">
                  <h1 className="text-4xl md:text-6xl font-serif text-primary leading-tight mb-6 italic">
                    {t.hero.title1} {t.hero.title2}
                  </h1>
                  <button onClick={() => onNavigate('products')} className="px-8 py-4 bg-primary text-beige rounded-2xl font-bold flex items-center gap-3">
                    Explore Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slider Controls */}
        {banners.length > 1 && (
          <>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBannerIndex(i)}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${currentBannerIndex === i ? 'bg-primary w-8' : 'bg-primary/30'}`}
                />
              ))}
            </div>
            <button onClick={prevBanner} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-primary border border-white/30 hover:bg-white hover:shadow-xl transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextBanner} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-primary border border-white/30 hover:bg-white hover:shadow-xl transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>

      {/* Categories Section - Full Width, Grid Layout, Aspect Ratio */}
      <section className="py-[60px] md:py-[80px] bg-beige-dark/30 w-full overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-10 min-w-0">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">{t.products.ourCollection}</h2>
            <div className="w-16 h-px bg-secondary mx-auto mb-4" />
            <p className="text-secondary italic font-light text-sm md:text-base">Curated collections for your holistic journey</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-8 min-w-0">
            {loadingCategories ? (
              <div className="col-span-full py-10 flex justify-center text-secondary">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-full py-10 flex justify-center text-secondary">
                No categories found. Add some from the Admin Dashboard!
              </div>
            ) : categories.map((cat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -8 }}
                onClick={() => onNavigate('products')}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 shadow-md bg-white">
                  <img 
                    src={getImageUrl(cat.image)} 
                    alt={cat.name} 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-center font-serif text-lg md:text-xl text-primary group-hover:text-secondary transition-colors">
                  {language === 'ta' && cat.name_ta ? cat.name_ta : (t.categories[cat.name.toLowerCase() as keyof typeof t.categories] || cat.name)}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section - Consistent Spacing */}
      <section className="py-[60px] md:py-[80px] bg-white w-full overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-10 min-w-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">{t.products.bestsellers}</h2>
              <p className="text-secondary font-light max-w-md text-sm md:text-base">
                Handcrafted essentials for your daily ritual, made with organic ingredients sourced from the heart of nature.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('products')}
              className="text-sm font-semibold text-primary border-b border-primary pb-1 hover:text-secondary hover:border-secondary transition-all w-fit"
            >
              {t.products.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8 min-w-0">
            {loadingProducts ? (
              <div className="col-span-full py-10 flex justify-center text-secondary">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-full py-10 flex justify-center text-secondary">
                No products found. Add some from the Admin Dashboard!
              </div>
            ) : products.map((product) => {
              const productName = language === 'ta' && product.name_ta ? product.name_ta : (t.products[product.nameKey as keyof typeof t.products] || product.nameKey);
              return (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => onNavigate(`product/${product.id}`)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-5 bg-beige shadow-sm">
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={productName} 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAuthAction(() => {
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id);
                        } else {
                          addToWishlist({
                            id: product.id,
                            nameKey: product.nameKey,
                            price: typeof product.price === 'string' ? product.price : `₹${product.price.toFixed(2)}`,
                            image: product.image
                          });
                        }
                      });
                    }}
                    className="absolute top-3 right-3 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAuthAction(() => {
                        addToCart({
                          id: product.id,
                          nameKey: product.nameKey,
                          price: typeof product.price === 'string' ? parseFloat(product.price.replace('₹', '').replace('$', '')) : product.price,
                          image: product.image
                        });
                      });
                    }}
                    className="absolute bottom-3 right-3 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-1">
                  <h3 className="font-serif text-base md:text-lg text-primary">{productName}</h3>
                  <span className="text-secondary font-medium text-sm md:text-base">
                    {typeof product.price === 'string' ? product.price : `₹${product.price.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthAction(() => {
                      addToCart({
                        id: product.id,
                        nameKey: product.nameKey,
                        price: typeof product.price === 'string' ? parseFloat(product.price.replace('₹', '').replace('$', '')) : product.price,
                        image: product.image
                      });
                    });
                  }}
                  className="w-full py-3 border border-beige-dark rounded-xl text-xs md:text-sm font-medium hover:bg-primary hover:text-white transition-all"
                >
                  {t.products.addToCart}
                </button>
              </motion.div>
            )})}
          </div>
        </div>
      </section>

      {/* Feature Section - Consistent Spacing */}
      <section className="py-[60px] md:py-[80px] bg-beige-dark/20 border-y border-beige-dark/50 w-full overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-10 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 min-w-0">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="font-serif text-base md:text-lg text-primary mb-2">{t.features[feature.titleKey as keyof typeof t.features]}</h4>
                <p className="text-xs md:text-sm text-secondary font-light">{t.features[feature.descKey as keyof typeof t.features]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section - Full Height/Width */}
      <section className="relative py-32 md:py-48 flex items-center justify-center overflow-hidden w-full">
        <div className="absolute inset-0 z-0 left-0 right-0">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000" 
            alt="Forest background" 
            className="w-full h-full object-cover object-center block"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] left-0 right-0" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-10 text-center min-w-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="glass p-8 md:p-20 rounded-[2rem] md:rounded-[4rem]"
          >
            <h2 className="text-2xl md:text-5xl font-serif text-white leading-relaxed mb-6 md:mb-8 italic">
              “Healing is not just the absence of disease, but a state of complete harmony.”
            </h2>
            <div className="w-10 md:w-12 h-px bg-white/50 mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
