import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Star, X, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { getImageUrl } from '../utils/urlHelper';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';


interface Category {
  id: string;
  name: string;
  name_ta?: string;
  image: string;
}

interface Product {
  id: string;
  category: string;
  nameKey: string;
  name_ta?: string;
  price: number;
  rating: number;
  image: string;
  images?: string[];
  description?: string;
  description_ta?: string;
}

interface ProductPageProps {
  onNavigate: (page: string) => void;
}

export default function ProductPage({ onNavigate }: ProductPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Categories
        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Category[];
        
        // Add "All" virtual category
        const allCategory: Category = { 
          id: 'all', 
          name: 'All', 
          image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=200' 
        };
        setCategories([allCategory, ...categoriesData]);

        // Fetch Products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Product[];
        setProducts(productsData);

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        // Fallback dummy categories
        const allCategory: Category = { 
          id: 'all', 
          name: 'All', 
          image: 'https://cdn-icons-png.flaticon.com/512/3502/3502601.png' 
        };
        const dummyCategories: Category[] = [
          { id: '1', name: 'Face Care', image: 'https://cdn-icons-png.flaticon.com/512/3144/3144983.png' },
          { id: '2', name: 'Hair Care', image: 'https://cdn-icons-png.flaticon.com/512/3144/3144990.png' },
          { id: '3', name: 'Body Care', image: 'https://cdn-icons-png.flaticon.com/512/4146/4146781.png' },
          { id: '4', name: 'Wellness', image: 'https://cdn-icons-png.flaticon.com/512/2965/2965611.png' }
        ];
        setCategories([allCategory, ...dummyCategories]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // product.category is the ID (ForeignKey), ensure it's not null before string check
      const productCatId = product.category ? product.category.toString() : '';
      const selectedCatId = selectedCategory ? selectedCategory.toString() : 'all';
      
      const matchesCategory = selectedCatId === 'all' || productCatId === selectedCatId;
      
      const productName = (language === 'ta' && product.name_ta ? product.name_ta : (t.products[product.nameKey as keyof typeof t.products] || product.nameKey || '')).toLowerCase();
      const productDescKey = `desc_${product.nameKey}` as keyof typeof t.products;
      const productDesc = (language === 'ta' && product.description_ta ? product.description_ta : (t.products[productDescKey] || product.description || '')).toLowerCase();
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = productName.includes(searchLower) || productDesc.includes(searchLower);
                            
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, t, products]);

  return (
    <div style={{ display: 'block', margin: 0, padding: 0, minHeight: '100vh', backgroundColor: '#f1f3f6' }}>
      
      {/* --- STRICTLY UNIFIED NAV PARENT WRAPPER --- */}
      <div 
        className="fixed top-0 left-0 w-full z-[1000]"
        style={{ margin: 0, padding: 0, gap: 0, display: 'block', backgroundColor: '#ffffff', border: 'none' }}
      >
        <Navbar onNavigate={onNavigate} currentPage="products" />
        
        {/* Category Bar - Forces underneath absolute Navbar by starting at 70px natively in block */}
        <div style={{ margin: 0, padding: 0, marginTop: '70px', border: 'none', boxShadow: 'none', backgroundColor: '#ffffff', display: 'block' }}>
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 m-0 p-0">
            <div className="flex items-center gap-6 md:gap-10 overflow-x-auto no-scrollbar m-0 p-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="relative flex flex-col items-center flex-shrink-0 group m-0 p-2 transition-transform hover:-translate-y-1 min-w-[80px]"
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center m-0 p-2.5 overflow-hidden rounded-full border-2 transition-all duration-300 bg-white ${String(selectedCategory) === String(cat.id) ? 'border-[#1A3626] shadow-md scale-105' : 'border-gray-300 group-hover:border-[#1A3626] group-hover:shadow-sm'}`}>
                    <img 
                      src={getImageUrl(cat.image)} 
                      alt={cat.name} 
                      className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className={`text-[10px] md:text-xs text-center whitespace-nowrap transition-colors mt-2 ${String(selectedCategory) === String(cat.id) ? 'text-[#1A3626] font-bold' : 'text-gray-600 font-medium group-hover:text-[#1A3626]'}`}>
                    {cat.id === 'all' ? t.products.allProducts : (language === 'ta' && cat.name_ta ? cat.name_ta : (t.categories[cat.name.toLowerCase() as keyof typeof t.categories] || cat.name))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Region - offset for the combined header */}
      <div className="selection:bg-secondary/30 overflow-x-hidden pt-[180px]">

      {/* Space cleared for Product List Section directly below the offset header */}
      {/* Product List Section */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-secondary font-medium animte-pulse">Nurturing your wellness...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-primary">
            {selectedCategory === 'all' 
              ? t.products.allProducts 
              : (language === 'ta' && categories.find(c => String(c.id) === String(selectedCategory))?.name_ta 
                  ? categories.find(c => String(c.id) === String(selectedCategory))?.name_ta 
                  : (categories.find(c => String(c.id) === String(selectedCategory))?.name || selectedCategory))
            }
            <span className="ml-2 text-sm font-sans text-secondary font-normal">({filteredProducts.length} {t.products.items})</span>
          </h2>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <span>{t.products.sortBy}:</span>
            <select className="bg-transparent border-none focus:ring-0 font-bold text-primary cursor-pointer">
              <option>{t.products.popularity}</option>
              <option>{t.products.priceLowHigh}</option>
              <option>{t.products.priceHighLow}</option>
              <option>{t.products.newestFirst}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                onClick={() => onNavigate(`product/${product.id}`)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-beige-dark/30 cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={language === 'ta' && product.name_ta ? product.name_ta : (t.products[product.nameKey as keyof typeof t.products] || product.nameKey)} 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-sm">
                    <span className="text-[10px] font-bold text-primary">{product.rating}</span>
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isInWishlist(product.id)) {
                        removeFromWishlist(product.id);
                      } else {
                        addToWishlist({
                          id: product.id,
                          nameKey: product.nameKey,
                          price: `₹${Number(product.price).toFixed(2)}`,
                          image: product.image
                        });
                      }
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </motion.button>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-primary mb-1 line-clamp-1">{language === 'ta' && product.name_ta ? product.name_ta : (t.products[product.nameKey as keyof typeof t.products] || product.nameKey)}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-primary">₹{Number(product.price).toFixed(2)}</span>
                    <span className="text-xs text-secondary line-through">₹{(Number(product.price) * 1.2).toFixed(2)}</span>
                    <span className="text-xs text-green-600 font-bold">20% off</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({
                        id: product.id,
                        nameKey: product.nameKey,
                        price: product.price,
                        image: product.image
                      });
                    }}
                    className="w-full py-2.5 bg-primary text-beige rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t.products.addToCart}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-beige-dark/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-secondary/30" />
                </div>
                <h3 className="text-xl font-serif text-primary mb-2">{t.products.noProducts}</h3>
                <p className="text-secondary font-light">{t.products.adjustSearch}</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="mt-6 text-primary font-bold border-b border-primary pb-1 hover:text-secondary hover:border-secondary transition-all"
                >
                  {t.products.clearFilters}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer - Same as Home */}
      <Footer onNavigate={onNavigate} />
    </div>
    </div>
  );
}
