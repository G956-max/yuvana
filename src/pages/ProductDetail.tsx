import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { getImageUrl } from '../utils/urlHelper';
import { doc, getDoc, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';


interface ProductDetailProps {
  id: string;
  onNavigate: (page: string) => void;
}

interface ProductData {
  id: string;
  category: string;
  category_name?: string;
  nameKey: string;
  name_ta?: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  description_ta?: string;
  images: string[];
  image?: string;
  variants: { name: string; options: string[] }[];
  details: { title: string; content: string }[];
}

export default function ProductDetail({ id, onNavigate }: ProductDetailProps) {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mainImage, setMainImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      try {
        // Fetch current product from Firestore
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = { id: productSnap.id, ...(productSnap.data() as any) } as ProductData;
          
          // ensure images array exists
          if (!data.images || data.images.length === 0) {
            data.images = [data.image || ''];
          }
          
          setProductData(data);
          setMainImage(data.images[0]);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0].options[0]);
          } else {
            data.variants = [];
          }

          if (!data.details) {
            data.details = [];
          }

          // Fetch related products (same category, excluding current)
          const relatedQuery = query(
            collection(db, 'products'),
            where('category', '==', data.category),
            limit(5)
          );
          const relatedSnap = await getDocs(relatedQuery);
          const relatedData = relatedSnap.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
            .filter(item => item.id !== id)
            .slice(0, 4);
          setRelatedProducts(relatedData);
        } else {
          setProductData(null);
        }
      } catch (error) {
        console.error("Error fetching product detail from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndRelated();
    window.scrollTo(0, 0);
    setQuantity(1);
  }, [id]);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-[70px] flex items-center justify-center p-6">
        <Navbar onNavigate={onNavigate} currentPage={`product/${id}`} />
        <div className="flex flex-col items-center gap-6 text-center animate-pulse">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse rounded-full"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-serif text-primary">Nurturing your wellness...</p>
            <p className="text-xs uppercase tracking-[3px] text-secondary/60">Traditional Wisdom • Modern Science</p>
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-[70px] flex items-center justify-center p-6">
        <Navbar onNavigate={onNavigate} currentPage={`product/${id}`} />
        <div className="text-center bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 max-w-sm w-full">
          <div className="w-20 h-20 bg-beige rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-secondary/40" />
          </div>
          <h2 className="text-2xl font-serif text-primary mb-2">Product not found</h2>
          <p className="text-secondary/60 mb-8 text-sm">This essence seems to have returned to nature. Try exploring our other collections.</p>
          <button 
            onClick={() => onNavigate('products')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10 active:scale-95"
          >
            Explore Collection
          </button>
        </div>
      </div>
    );
  }

  const productName = language === 'ta' && productData.name_ta ? productData.name_ta : (t.products[productData.nameKey as keyof typeof t.products] || productData.nameKey);
  const categoryName = productData.category_name || (t.categories[productData.category as keyof typeof t.categories] || productData.category);

  return (
    <div className="min-h-screen bg-[#f5f5f5] selection:bg-secondary/30 pt-[70px]">
      <Navbar onNavigate={onNavigate} currentPage={`product/${id}`} />

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs font-semibold text-secondary/60 uppercase tracking-wider mb-6 sm:mb-8">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors whitespace-nowrap">{t.nav.home}</button>
          <span className="opacity-40">/</span>
          <button onClick={() => onNavigate('products')} className="hover:text-primary transition-colors whitespace-nowrap">{categoryName}</button>
          <span className="opacity-40">/</span>
          <span className="text-primary truncate max-w-[150px] sm:max-w-none">{productName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-24">
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <motion.div 
              layoutId={`product-image-${id}`}
              className="aspect-square rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 relative"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={getImageUrl(mainImage)}
                  alt={productName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <button 
                onClick={() => {
                  if (isInWishlist(productData.id)) {
                    removeFromWishlist(productData.id);
                  } else {
                    addToWishlist({
                      id: productData.id,
                      nameKey: productData.nameKey,
                      price: `₹${Number(productData.price).toFixed(2)}`,
                      image: productData.images[0]
                    });
                  }
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-secondary hover:text-red-500 hover:bg-white transition-all shadow-sm"
              >
                <Heart className={`w-5 h-5 ${isInWishlist(productData.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {productData.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all relative ${
                    mainImage === img 
                      ? 'border-primary shadow-md scale-105 opacity-100 ring-2 ring-primary ring-offset-2 z-10' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={getImageUrl(img)} alt={`${productName} thumbnail ${idx + 1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h1 className="text-3xl md:text-5xl font-serif text-primary mb-3 md:mb-4 leading-tight">
              {productName}
            </h1>
            
            <div className="flex items-center flex-wrap gap-4 mb-6">
              <span className="text-2xl md:text-3xl font-serif text-primary">₹{Number(productData.price).toFixed(2)}</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span className="text-xs sm:text-sm font-bold text-primary">{productData.rating || 4.5}</span>
                <span className="text-[10px] sm:text-xs text-secondary/60">({productData.reviews || 0} reviews)</span>
              </div>
            </div>

            <p className="text-secondary font-light leading-relaxed mb-8">
              {language === 'ta' && productData.description_ta ? productData.description_ta : productData.description}
            </p>

            {/* Variants */}
            {(productData.variants || []).map((variant, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">{variant.name}</h3>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {variant.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariant(opt)}
                        className={`px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 ${
                          selectedVariant === opt 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-white text-primary border border-gray-200 hover:border-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
              </div>
            ))}

            {/* Quantity & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-2 sm:w-32 shrink-0">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 flex items-center justify-center text-secondary hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium text-primary w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 flex items-center justify-center text-secondary hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-1 gap-4">
                <button 
                  onClick={() => {
                    addToCart({
                      id: productData.id,
                      nameKey: productData.nameKey,
                      price: productData.price,
                      image: productData.images[0],
                      quantity: quantity,
                      variant: selectedVariant
                    });
                  }}
                  className="flex-1 py-4 bg-white text-primary border-2 border-primary rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem('checkout_product', JSON.stringify({
                      id: productData.id,
                      name: productName,
                      price: productData.price,
                      image: productData.images[0],
                      initialQuantity: quantity
                    }));
                    onNavigate('checkout');
                  }}
                  className="flex-1 py-4 bg-secondary text-white rounded-2xl font-bold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Accordion Details */}
            <div className="border-t border-gray-200">
              {(productData.details || []).map((detail, idx) => (
                <div key={idx} className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full py-5 flex items-center justify-between text-left focus:outline-none group"
                  >
                    <span className="font-serif text-lg text-primary group-hover:text-secondary transition-colors">{detail.title}</span>
                    <span className="text-secondary transition-transform duration-300">
                      {expandedSection === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSection === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-secondary font-light leading-relaxed">
                          {detail.content}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="border-t border-gray-200 pt-16 mb-16">
          <h2 className="text-3xl font-serif text-primary mb-8 text-center">{t.products.youMightAlsoLike}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 min-w-0">
            {relatedProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                onClick={() => {
                  onNavigate(`product/${product.id}`);
                  window.scrollTo(0, 0);
                }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-gray-100 cursor-pointer"
              >
                <div className="aspect-square overflow-hidden bg-white relative">
                    <img 
                      src={getImageUrl(product.image)} 
                      alt={t.products[product.nameKey as keyof typeof t.products] || product.nameKey} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                </div>
                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-widest text-secondary/60 mb-1">
                    {product.category_name || (t.categories[product.category as keyof typeof t.categories] || product.category)}
                  </p>
                  <h3 className="text-lg font-serif text-primary mb-2 truncate">
                    {language === 'ta' && product.name_ta ? product.name_ta : (t.products[product.nameKey as keyof typeof t.products] || product.nameKey)}
                  </h3>
                  <span className="font-medium text-primary">₹{Number(product.price).toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
