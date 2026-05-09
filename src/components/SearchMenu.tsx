import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/urlHelper';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface SearchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface Product {
  id: string;
  category: string;
  category_name?: string;
  nameKey: string;
  price: number;
  image: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function SearchMenu({ isOpen, onClose, onNavigate }: SearchMenuProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from local storage
  useEffect(() => {
    const saved = localStorage.getItem('ayurveda_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fetch initial data when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (products.length === 0) {
        fetchData();
      }
    } else {
      setQuery(''); // Reset when closing
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodSnap, catSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(query(collection(db, 'categories'), orderBy('name')))
      ]);
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Product[]);
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Category[]);
    } catch (error) {
      console.error('Error fetching search data from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const term = searchTerm.trim();
    let updated = [term, ...recentSearches.filter(s => s !== term)];
    updated = updated.slice(0, 5); // Keep last 5
    setRecentSearches(updated);
    localStorage.setItem('ayurveda_recent_searches', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      // The filteredProducts logic at the bottom of this component already updates the view natively.
      // We removed the 'onNavigate(products)' call to stay on this search menu.
    }
  };

  const handleProductClick = (id: string) => {
    saveRecentSearch(query);
    onNavigate(`product/${id}`);
    onClose();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('ayurveda_recent_searches', JSON.stringify(updated));
  };

  const trendingSearches = ['Ashwagandha', 'Face Serum', 'Hair Oil', 'Immunity', 'Kumkumadi'];

  // Filter products based on query
  const filteredProducts = products.filter(p => {
    const translatedName = (t.products?.[p.nameKey as keyof typeof t.products] || p.nameKey || '').toLowerCase();
    const translatedCatName = (p.category_name || '').toLowerCase();
    const searchLower = query.toLowerCase();
    
    return translatedName.includes(searchLower) || translatedCatName.includes(searchLower);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex flex-col">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div 
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white shadow-2xl rounded-b-3xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header / Input Area */}
            <div className="border-b border-gray-100 p-4 md:p-6 bg-beige/10">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    onChange={(e) => setQuery(e.target.value)}
                    value={query}
                    placeholder="Search for products, categories, or keywords..."
                    className="w-full pl-12 pr-4 py-4 md:py-5 bg-white border border-gray-200 rounded-2xl text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium placeholder:text-gray-400"
                  />
                  {query && (
                    <button 
                      type="button" 
                      onClick={() => setQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
                <button 
                  onClick={onClose}
                  className="p-3 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-secondary">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm font-medium">Loading catalog...</p>
                  </div>
                ) : query.trim() ? (
                  /* --- Search Results State --- */
                  <div className="animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-serif text-primary">
                        Search Results for "{query}"
                      </h3>
                      <span className="text-sm text-secondary font-medium px-3 py-1 bg-gray-100 rounded-full">
                        {filteredProducts.length} results
                      </span>
                    </div>

                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map(product => (
                          <div 
                            key={product.id} 
                            onClick={() => handleProductClick(product.id)}
                            className="group cursor-pointer"
                          >
                            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 mb-3 relative">
                              <img 
                                src={getImageUrl(product.image)} 
                                alt={t.products[product.nameKey as keyof typeof t.products] || product.nameKey}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">
                              {product.category_name}
                            </span>
                            <h4 className="font-bold text-primary text-sm line-clamp-1 group-hover:text-secondary transition-colors">
                              {t.products[product.nameKey as keyof typeof t.products] || product.nameKey}
                            </h4>
                            <p className="text-primary/70 text-sm mt-1">
                              ₹{parseFloat((product.price || 0).toString()).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-primary">No exact matches found</h4>
                        <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
                          Try searching for different keywords, checking your spelling, or browsing our categories.
                        </p>
                        <button 
                          onClick={() => setQuery('')}
                          className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
                        >
                          Clear Search
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- Pre-Search State --- */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 animate-in fade-in duration-300">
                    
                    {/* Left Column: Recent & Trending */}
                    <div className="md:col-span-4 space-y-8">
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div>
                          <h3 className="flex items-center text-xs font-bold uppercase tracking-widest text-secondary mb-4">
                            <Clock className="w-3.5 h-3.5 mr-2" /> Recent Searches
                          </h3>
                          <div className="space-y-2">
                            {recentSearches.map((term, i) => (
                              <div 
                                key={i}
                                onClick={() => handleQuickSearch(term)}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                              >
                                <span className="text-primary font-medium text-sm">{term}</span>
                                <button 
                                  onClick={(e) => removeRecentSearch(term, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trending Searches */}
                      <div>
                        <h3 className="flex items-center text-xs font-bold uppercase tracking-widest text-secondary mb-4">
                          <TrendingUp className="w-3.5 h-3.5 mr-2" /> Trending Now
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {trendingSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickSearch(term)}
                              className="px-4 py-2 bg-gray-50 border border-gray-100 hover:border-primary/30 rounded-full text-sm font-medium text-primary hover:text-primary transition-all shadow-sm"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Categories & Popular Products */}
                    <div className="md:col-span-8 space-y-10">
                      {/* Popular Categories */}
                      {categories.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-serif text-primary">Top Categories</h3>
                            <button onClick={() => { onNavigate('products'); onClose(); }} className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary flex items-center">
                              View All <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {categories.slice(0, 4).map(cat => (
                              <div 
                                key={cat.id}
                                onClick={() => { handleQuickSearch(cat.name); }}
                                className="group cursor-pointer relative rounded-2xl overflow-hidden aspect-square border border-gray-100"
                              >
                                <img src={getImageUrl(cat.image)} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <span className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm text-center">
                                  {cat.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Popular Products */}
                      {products.length > 0 && (
                        <div>
                          <h3 className="text-lg font-serif text-primary mb-5">Popular Products</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {products.slice(0, 4).map(product => (
                              <div 
                                key={product.id}
                                onClick={() => handleProductClick(product.id)}
                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 cursor-pointer transition-all group lg:min-h-24"
                              >
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                  <img src={getImageUrl(product.image)} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={t.products[product.nameKey as keyof typeof t.products] || product.nameKey} />
                                </div>
                                <div className="flex-1">
                                  <span className="text-[9px] uppercase font-bold text-secondary tracking-widest mb-1 block">
                                    {product.category_name}
                                  </span>
                                  <h4 className="font-bold text-primary text-sm line-clamp-1 group-hover:text-secondary transition-colors">
                                    {t.products[product.nameKey as keyof typeof t.products] || product.nameKey}
                                  </h4>
                                  <p className="font-bold text-primary/80 text-xs mt-1">
                                    ₹{parseFloat((product.price || 0).toString()).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
