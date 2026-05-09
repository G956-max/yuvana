import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, Edit2, Trash2, X, Database, Loader2, LayoutGrid, Package, Image as ImageIcon, MonitorPause, Pencil, Languages, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import ImageCropEditor from '../components/ImageCropEditor';
import { getImageUrl } from '../utils/urlHelper';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFile } from '../lib/storage';

interface Banner {
  id: string;
  image: string;
  title: string;
  title_ta?: string;
  subtitle: string;
  subtitle_ta?: string;
  link: string;
  active: boolean;
  order: number;
}

interface Category {
  id: string;
  name: string;
  name_ta?: string;
  image: string;
}

interface Product {
  id: string;
  category: string;
  category_name?: string;
  nameKey: string;
  name_ta?: string;
  price: number;
  description: string;
  description_ta?: string;
  image: string;
  rating?: number;
  reviews?: number;
}

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'banners'>('products');
  
  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Banners State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  // Shared Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Image editor state
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [editorAspect, setEditorAspect] = useState<number>(1); // 1 = square, 16/9 = banner

  const [productFormData, setProductFormData] = useState({
    nameKey: '',
    name_ta: '',
    category: '',
    price: '',
    description: '',
    description_ta: '',
    image: '',
    imageUrl: '',
    rating: '5.0',
    reviews: '0'
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    name_ta: '',
    image: '',
    imageUrl: ''
  });

  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    title_ta: '',
    subtitle: '',
    subtitle_ta: '',
    link: 'products',
    active: true,
    order: '0',
    image: '',
    imageUrl: ''
  });

  const handleTranslate = async (text: string, fieldName: string, type: 'product' | 'category' | 'banner') => {
    if (!text.trim()) {
      toast.error('Please enter English text first.');
      return;
    }

    setTranslating(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ta&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0]) {
        const tamilText = data[0].map((segment: any) => segment[0]).join('');
        
        if (type === 'product') {
          setProductFormData(prev => ({ ...prev, [fieldName]: tamilText }));
        } else if (type === 'category') {
          setCategoryFormData(prev => ({ ...prev, [fieldName]: tamilText }));
        } else if (type === 'banner') {
          setBannerFormData(prev => ({ ...prev, [fieldName]: tamilText }));
        }
        
        toast.success('Translated to Tamil!');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products from Firestore:', error);
      toast.error('Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(data);
      if (data.length > 0 && !productFormData.category) {
        setProductFormData(prev => ({ ...prev, category: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories from Firestore:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const q = query(collection(db, 'banners'), orderBy('order'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners from Firestore:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBanners();
  }, []);

  // --- Product Functions ---
  const openProductForm = (product?: Product) => {
    setImageFile(null);
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        nameKey: product.nameKey || '',
        name_ta: product.name_ta || '',
        category: product.category || (categories[0]?.id || ''),
        price: product.price ? product.price.toString() : '',
        description: product.description || '',
        description_ta: product.description_ta || '',
        image: product.image || '',
        imageUrl: product.image?.startsWith('http') ? product.image : '',
        rating: product.rating ? product.rating.toString() : '5.0',
        reviews: product.reviews ? product.reviews.toString() : '0'
      });
    } else {
      setEditingProduct(null);
      setProductFormData({ 
        nameKey: '', 
        name_ta: '',
        category: categories[0]?.id || '', 
        price: '', 
        description: '', 
        description_ta: '',
        image: '', 
        imageUrl: '',
        rating: '5.0', 
        reviews: '0' 
      });
    }
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = productFormData.image;
      
      // 1. Handle direct URL or image upload (URL takes precedence)
      if (productFormData.imageUrl && productFormData.imageUrl.trim() !== '') {
        finalImageUrl = productFormData.imageUrl.trim();
      } else if (imageFile) {
        finalImageUrl = await uploadFile(imageFile, 'products');
      }

      if (!finalImageUrl) {
        toast.error('Please select a product image or provide a URL.');
        setUploading(false);
        return;
      }

      const productData = {
        nameKey: productFormData.nameKey,
        name_ta: productFormData.name_ta,
        category: productFormData.category,
        price: parseFloat(productFormData.price) || 0,
        description: productFormData.description,
        description_ta: productFormData.description_ta,
        image: finalImageUrl,
        imageUrl: productFormData.imageUrl, // Also store the direct URL if provided
        images: [finalImageUrl], // Default to single image array
        variants: [], // Initial empty variants
        details: [], // Initial empty details
        rating: parseFloat(productFormData.rating) || 5.0,
        reviews: parseInt(productFormData.reviews) || 0,
        category_name: categories.find(c => c.id === productFormData.category)?.name || '',
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productData,
          updatedAt: serverTimestamp()
        });
        toast.success('Product updated!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
        toast.success('Product added!');
      }
      setIsProductFormOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product.');
    } finally {
      setUploading(false);
    }
  };

  const handleProductDelete = async (id: string) => {
    if (window.confirm('Delete product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Deleted');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete from Firestore');
      }
    }
  };

  // --- Category Functions ---
  const openCategoryForm = (category?: Category) => {
    setImageFile(null);
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ 
        name: category.name, 
        name_ta: category.name_ta || '', 
        image: category.image,
        imageUrl: category.image?.startsWith('http') ? category.image : ''
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', name_ta: '', image: '', imageUrl: '' });
    }
    setIsCategoryFormOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = categoryFormData.image;
      if (categoryFormData.imageUrl) {
        finalImageUrl = categoryFormData.imageUrl;
      } else if (imageFile) {
        finalImageUrl = await uploadFile(imageFile, 'categories');
      }

      const categoryData = {
        ...categoryFormData,
        image: finalImageUrl
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          ...categoryData,
          updatedAt: serverTimestamp()
        });
        toast.success('Category updated!');
      } else {
        if (!imageFile && !categoryFormData.imageUrl) {
          toast.error('Please select a category image or provide a URL.');
          setUploading(false);
          return;
        }
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp()
        });
        toast.success('Category added!');
      }
      setIsCategoryFormOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category.');
    } finally {
      setUploading(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (window.confirm('Delete category? This will delete all products in it!')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('Deleted');
        fetchCategories();
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  // --- Banner Functions ---
  const openBannerForm = (banner?: Banner) => {
    setImageFile(null);
    if (banner) {
      setEditingBanner(banner);
      setBannerFormData({
        title: banner.title,
        title_ta: banner.title_ta || '',
        subtitle: banner.subtitle,
        subtitle_ta: banner.subtitle_ta || '',
        link: banner.link,
        active: banner.active,
        order: banner.order.toString(),
        image: banner.image || '',
        imageUrl: banner.image?.startsWith('http') ? banner.image : ''
      });
    } else {
      setEditingBanner(null);
      setBannerFormData({ 
        title: '', 
        title_ta: '', 
        subtitle: '', 
        subtitle_ta: '', 
        link: 'products', 
        active: true, 
        order: '0', 
        image: '',
        imageUrl: '' 
      });
    }
    setIsBannerFormOpen(true);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = bannerFormData.image;
      
      // Handle direct URL or image upload (URL takes precedence)
      if (bannerFormData.imageUrl && bannerFormData.imageUrl.trim() !== '') {
        finalImageUrl = bannerFormData.imageUrl.trim();
      } else if (imageFile) {
        finalImageUrl = await uploadFile(imageFile, 'banners');
      }

      if (!finalImageUrl) {
        toast.error('Please select a banner image or provide a URL.');
        setUploading(false);
        return;
      }

      const bannerData = {
        title: bannerFormData.title,
        title_ta: bannerFormData.title_ta,
        subtitle: bannerFormData.subtitle,
        subtitle_ta: bannerFormData.subtitle_ta,
        link: bannerFormData.link,
        active: bannerFormData.active,
        order: parseInt(bannerFormData.order) || 0,
        image: finalImageUrl,
        imageUrl: bannerFormData.imageUrl
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), {
          ...bannerData,
          updatedAt: serverTimestamp()
        });
        toast.success('Banner updated!');
      } else {
        await addDoc(collection(db, 'banners'), {
          ...bannerData,
          createdAt: serverTimestamp()
        });
        toast.success('Banner added!');
      }
      setIsBannerFormOpen(false);
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      toast.error(error.message || 'Failed to save banner.');
    } finally {
      setUploading(false);
    }
  };

  const handleBannerDelete = async (id: string) => {
    if (window.confirm('Delete banner?')) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        toast.success('Deleted');
        fetchBanners();
      } catch (error) {
        toast.error('Failed to delete banner');
      }
    }
  };

  return (
    <React.Fragment>
    <div className="min-h-screen bg-[#f1f3f6] pt-24 pb-12 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary">Admin Dashboard</h1>
            <p className="text-secondary mt-2">Manage your stores products, categories and banners.</p>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-xl shadow-sm border border-red-100 font-medium hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-secondary hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" /> Products
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-secondary hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-5 h-5" /> Categories
          </button>
          <button 
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'banners' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-secondary hover:bg-gray-50'}`}
          >
            <MonitorPause className="w-5 h-5" /> Banners
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-primary">Products Inventory</h2>
                <p className="text-sm text-secondary mt-1">Total {products.length} products found.</p>
              </div>
              <button onClick={() => openProductForm()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 transition-all font-medium">
                <Plus className="w-5 h-5" /> Add New Product
              </button>
            </div>
            <div className="p-6 md:p-8">
              {productsLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : products.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary">No products found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-semibold text-left">
                        <th className="pb-4 pl-4 min-w-[200px]">Product</th>
                        <th className="pb-4 min-w-[120px]">Category</th>
                        <th className="pb-4 min-w-[100px]">Price</th>
                        <th className="pb-4 text-right pr-4 min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-4">
                              <img src={getImageUrl(p.image)} className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-white" />
                              <span className="font-medium text-primary">{p.nameKey}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {p.category_name}
                            </span>
                          </td>
                          <td className="py-4 font-semibold text-primary">₹{parseFloat(p.price.toString()).toFixed(2)}</td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openProductForm(p)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-primary hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleProductDelete(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-primary">Category Management</h2>
                <p className="text-sm text-secondary mt-1">Total {categories.length} categories found.</p>
              </div>
              <button onClick={() => openCategoryForm()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 transition-all font-medium">
                <Plus className="w-5 h-5" /> Add New Category
              </button>
            </div>
            <div className="p-6 md:p-8">
              {categoriesLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((c) => (
                    <div key={c.id} className="group relative bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                          <img src={getImageUrl(c.image)} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-primary">{c.name}</h3>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openCategoryForm(c)} className="p-1.5 bg-white shadow-sm rounded-lg text-gray-600 hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleCategoryDelete(c.id)} className="p-1.5 bg-white shadow-sm rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-primary">Hero Banners</h2>
                <p className="text-sm text-secondary mt-1">Total {banners.length} banners found.</p>
              </div>
              <button onClick={() => openBannerForm()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 transition-all font-medium">
                <Plus className="w-5 h-5" /> Add New Banner
              </button>
            </div>
            <div className="p-6 md:p-8">
              {bannersLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {banners.map((b) => (
                    <div key={b.id} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                      <div className="aspect-video bg-white">
                        <img src={getImageUrl(b.image)} className="w-full h-full object-contain" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-primary">{b.title || 'Untitled Banner'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${b.active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                            {b.active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary line-clamp-2 mb-4">{b.subtitle}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-medium">Order: {b.order}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openBannerForm(b)} className="p-2 bg-white shadow-sm rounded-lg text-gray-600 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleBannerDelete(b.id)} className="p-2 bg-white shadow-sm rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        <AnimatePresence>
          {isProductFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductFormOpen(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-xl z-10 overflow-hidden border border-white/20">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-xl font-bold text-primary">{editingProduct ? 'Update Product' : 'Add New Product'}</h3>
                  <button onClick={() => setIsProductFormOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-primary transition-all shadow-sm"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  <form onSubmit={handleProductSubmit} className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Product Name (English)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(productFormData.nameKey, 'name_ta', 'product')}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-all border border-primary/10"
                        >
                          <Languages className="w-3 h-3" /> Translate Name
                        </button>
                      </div>
                      <input type="text" required value={productFormData.nameKey} onChange={(e) => setProductFormData({...productFormData, nameKey: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name (Tamil)</label>
                      <input type="text" value={productFormData.name_ta} onChange={(e) => setProductFormData({...productFormData, name_ta: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="ஆயுர்வேத தயாரிப்பு..." />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                        <select required value={productFormData.category} onChange={(e) => setProductFormData({...productFormData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none capitalize">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price ($)</label>
                        <input type="number" step="0.01" required value={productFormData.price} onChange={(e) => setProductFormData({...productFormData, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Product Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => { if (e.target.files?.[0]) { setEditorAspect(1); setPendingImageFile(e.target.files[0]); e.target.value = ''; } }}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                      />
                      <div className="mt-4">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Direct Image URL</label>
                        <input 
                          type="text" 
                          value={productFormData.imageUrl} 
                          onChange={(e) => setProductFormData({...productFormData, imageUrl: e.target.value})} 
                          className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" 
                          placeholder="https://example.com/image.jpg" 
                        />
                      </div>
                      {(imageFile || productFormData.image || productFormData.imageUrl) && (
                        <div className="mt-3 aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative group">
                          <img src={productFormData.imageUrl ? productFormData.imageUrl : (imageFile ? URL.createObjectURL(imageFile) : getImageUrl(productFormData.image))} className="w-full h-full object-contain" />
                          {imageFile && (
                            <button
                              type="button"
                              onClick={() => { setEditorAspect(1); setPendingImageFile(imageFile); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm gap-2"
                            >
                              <Pencil className="w-4 h-4" /> Re-edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Description (English)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(productFormData.description, 'description_ta', 'product')}
                          disabled={translating}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-full transition-all border border-primary/10 group"
                        >
                          {translating ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Languages className="w-3 h-3 group-hover:scale-110 transition-transform" />
                          )}
                          {translating ? 'Translating...' : 'Translate to Tamil'}
                        </button>
                      </div>
                      <textarea required rows={4} value={productFormData.description} onChange={(e) => setProductFormData({...productFormData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none focus:ring-2 focus:ring-primary/20" placeholder="Enter English description..." />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Tamil)</label>
                      <textarea rows={4} value={productFormData.description_ta} onChange={(e) => setProductFormData({...productFormData, description_ta: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none focus:ring-2 focus:ring-primary/20" placeholder="தமிழ் விளக்கம் இங்கே..." />
                    </div>
                  </form>
                </div>
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                  <button onClick={() => setIsProductFormOpen(false)} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancel</button>
                  <button onClick={handleProductSubmit} disabled={uploading} className="px-6 py-2.5 font-bold text-white bg-primary rounded-xl shadow-md disabled:opacity-70">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Save' : 'Create')}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Category Form Modal */}
        <AnimatePresence>
          {isCategoryFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryFormOpen(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-xl font-bold text-primary">{editingCategory ? 'Update Category' : 'Add New Category'}</h3>
                  <button onClick={() => setIsCategoryFormOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-primary transition-all shadow-sm"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8">
                  <form onSubmit={handleCategorySubmit} className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Category Name (English)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(categoryFormData.name, 'name_ta', 'category')}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10"
                        >
                          <Languages className="w-3 h-3" /> Translate
                        </button>
                      </div>
                      <input type="text" required value={categoryFormData.name} onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name (Tamil)</label>
                      <input type="text" value={categoryFormData.name_ta} onChange={(e) => setCategoryFormData({...categoryFormData, name_ta: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="வகைப் பெயர்..." />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Category Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => { if (e.target.files?.[0]) { setEditorAspect(1); setPendingImageFile(e.target.files[0]); e.target.value = ''; } }}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white"
                      />
                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Direct Image URL</label>
                        <input 
                          type="text" 
                          value={categoryFormData.imageUrl} 
                          onChange={(e) => setCategoryFormData({...categoryFormData, imageUrl: e.target.value})} 
                          className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 outline-none" 
                          placeholder="https://example.com/image.jpg" 
                        />
                      </div>
                      {(imageFile || categoryFormData.image || categoryFormData.imageUrl) && (
                        <div className="mt-3 aspect-square w-32 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 relative group">
                          <img src={categoryFormData.imageUrl ? categoryFormData.imageUrl : (imageFile ? URL.createObjectURL(imageFile) : getImageUrl(categoryFormData.image))} className="w-full h-full object-contain" />
                          {imageFile && (
                            <button
                              type="button"
                              onClick={() => { setEditorAspect(1); setPendingImageFile(imageFile); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs gap-1"
                            >
                              <Pencil className="w-3 h-3" /> Re-edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                  <button onClick={() => setIsCategoryFormOpen(false)} className="px-6 py-2.5 font-bold text-gray-500 rounded-xl">Cancel</button>
                  <button onClick={handleCategorySubmit} disabled={uploading} className="px-6 py-2.5 font-bold text-white bg-primary rounded-xl shadow-md">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Banner Form Modal */}
        <AnimatePresence>
          {isBannerFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBannerFormOpen(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-xl z-10 overflow-hidden border border-white/20">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-xl font-bold text-primary">{editingBanner ? 'Update Banner' : 'Add New Banner'}</h3>
                  <button onClick={() => setIsBannerFormOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-primary transition-all shadow-sm"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  <form onSubmit={handleBannerSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banner Title</label>
                      <input type="text" value={bannerFormData.title} onChange={(e) => setBannerFormData({...bannerFormData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtitle / Description</label>
                      <textarea rows={2} value={bannerFormData.subtitle} onChange={(e) => setBannerFormData({...bannerFormData, subtitle: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link / Page</label>
                        <select value={bannerFormData.link} onChange={(e) => setBannerFormData({...bannerFormData, link: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none">
                          <option value="products">All Products</option>
                          <option value="home">Home</option>
                          <option value="about">About Us</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                        <input type="number" required value={bannerFormData.order} onChange={(e) => setBannerFormData({...bannerFormData, order: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Banner Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => { if (e.target.files?.[0]) { setEditorAspect(16 / 9); setPendingImageFile(e.target.files[0]); e.target.value = ''; } }}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white"
                      />
                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Direct Image URL</label>
                        <input 
                          type="text" 
                          value={bannerFormData.imageUrl} 
                          onChange={(e) => setBannerFormData({...bannerFormData, imageUrl: e.target.value})} 
                          className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 outline-none" 
                          placeholder="https://example.com/image.jpg" 
                        />
                      </div>
                      {(imageFile || bannerFormData.image || bannerFormData.imageUrl) && (
                        <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative group">
                          <img src={bannerFormData.imageUrl ? bannerFormData.imageUrl : (imageFile ? URL.createObjectURL(imageFile) : getImageUrl(bannerFormData.image))} className="w-full h-full object-contain" />
                          {imageFile && (
                            <button
                              type="button"
                              onClick={() => { setEditorAspect(16 / 9); setPendingImageFile(imageFile); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm gap-2"
                            >
                              <Pencil className="w-4 h-4" /> Re-edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="activeBanner" checked={bannerFormData.active} onChange={(e) => setBannerFormData({...bannerFormData, active: e.target.checked})} className="w-5 h-5 rounded-md accent-primary" />
                      <label htmlFor="activeBanner" className="text-sm font-semibold text-gray-700">Display this banner on homepage</label>
                    </div>
                  </form>
                </div>
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                  <button onClick={() => setIsBannerFormOpen(false)} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancel</button>
                  <button onClick={handleBannerSubmit} disabled={uploading} className="px-6 py-2.5 font-bold text-white bg-primary rounded-xl shadow-md disabled:opacity-70">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* Image Crop / Resize Editor — renders above all modals */}
    {pendingImageFile && (
      <ImageCropEditor
        imageFile={pendingImageFile}
        aspectRatio={editorAspect}
        onConfirm={(editedFile) => {
          setImageFile(editedFile);
          setPendingImageFile(null);
        }}
        onCancel={() => setPendingImageFile(null)}
      />
    )}
    </React.Fragment>
  );
}
