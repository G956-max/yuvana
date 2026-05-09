import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Package, Heart, Settings, LogOut, ChevronRight, Edit2, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle, ShoppingBag, LogIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/urlHelper';

interface ProfileProps {
  onNavigate: (page: string) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
  const { t } = useLanguage();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist' | 'settings'>('profile');

  // Profile Form State
  const defaultProfile = JSON.parse(localStorage.getItem('yuvana_user_profile') || '{}');
  const [profileData, setProfileData] = useState({
    name: defaultProfile.name || '',
    phone: defaultProfile.phone || '',
    location: defaultProfile.location || ''
  });
  
  const [editForm, setEditForm] = useState(profileData);

  const handleSaveProfile = () => {
    setProfileData(editForm);
    localStorage.setItem('yuvana_user_profile', JSON.stringify(editForm));
    setActiveTab('profile');
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('home');
  };

  const menuItems = [
    { id: 'profile', icon: User, label: t.profile.myProfile },
    { id: 'orders', icon: Package, label: t.profile.myOrders },
    { id: 'wishlist', icon: Heart, label: t.profile.wishlist },
    { id: 'settings', icon: Settings, label: t.profile.accountSettings },
  ];

  const orders = [
    { id: '#ORD-2026-001', date: 'Mar 15, 2026', total: '₹45.00', status: 'delivered', items: 'Brahmi Hair Oil, Saffron Face Serum', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=200' },
    { id: '#ORD-2026-002', date: 'Mar 28, 2026', total: '₹22.50', status: 'pending', items: 'Ashwagandha Tablets', img: 'https://images.unsplash.com/photo-1615485245453-4f70ac6329ca?auto=format&fit=crop&q=80&w=200' },
    { id: '#ORD-2026-003', date: 'Feb 10, 2026', total: '₹18.00', status: 'cancelled', items: 'Rose Water Mist', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'pending': return <Clock className="w-3 h-3 mr-1" />;
      case 'cancelled': return <XCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] selection:bg-secondary/30 pt-[70px]">
      <Navbar onNavigate={onNavigate} currentPage="profile" />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-[280px] shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-[100px]">
              {/* User Info */}
              <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xl font-serif font-bold uppercase">
                  {(user?.email?.[0] || user?.username?.[0] || 'U')}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-serif text-primary text-lg truncate">
                    {profileData.name || user?.username || user?.email?.split('@')[0] || t.profile.guestUser || 'Guest User'}
                  </h3>
                  <p className="text-xs text-secondary font-light truncate">{user?.email || (user?.username ? 'Administrator' : t.profile.notLoggedIn || 'Not logged in')}</p>
                </div>
              </div>

              {/* Menu */}
              <div className="p-4 flex flex-col gap-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-primary/70 hover:bg-beige hover:text-primary'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="p-4 border-t border-gray-100">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.profile.logout}
                  </button>
                ) : (
                  <button 
                    onClick={() => onNavigate('login')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-primary bg-beige/50 hover:bg-beige transition-colors shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    {t.login?.signIn || 'Sign In'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8 min-h-[600px]"
            >
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-serif text-primary mb-2">{t.profile.myProfile}</h2>
                    <p className="text-secondary text-sm font-light">{t.profile.manageInfo}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-secondary shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-secondary/60 uppercase tracking-wider mb-1">{t.profile.fullName}</p>
                        <p className="text-primary font-medium truncate">{profileData.name || user?.username || user?.email?.split('@')[0] || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-secondary shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-secondary/60 uppercase tracking-wider mb-1">{t.profile.email}</p>
                        <p className="text-primary font-medium truncate">{user?.email || (user?.username ? 'admin@ayurveda.com' : '—')}</p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-secondary shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary/60 uppercase tracking-wider mb-1">{t.profile.phone}</p>
                        <p className="text-primary font-medium">{profileData.phone || '—'}</p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-secondary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary/60 uppercase tracking-wider mb-1">{t.profile.location}</p>
                        <p className="text-primary font-medium">{profileData.location || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="px-6 py-3 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t.profile.editProfile}
                    </button>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-serif text-primary mb-2">{t.profile.myOrders}</h2>
                  </div>

                  <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-gray-100 hover:border-beige-dark transition-colors group cursor-pointer">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                          <img src={getImageUrl(order.img)} alt="Product" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <h4 className="text-primary font-medium truncate mb-1">{order.items}</h4>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-secondary/70">
                            <span>{order.date}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="font-medium text-primary">{order.total}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
                          <span className="text-xs font-medium text-secondary/50">{t.profile.orderId}: {order.id}</span>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {t.profile[order.status as keyof typeof t.profile]}
                          </div>
                        </div>

                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-50 items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors shrink-0">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-serif text-primary">{t.profile.wishlist}</h2>
                    {wishlistItems.length > 0 && (
                      <button 
                        onClick={() => wishlistItems.forEach(item => removeFromWishlist(item.id))}
                        className="text-sm text-secondary hover:text-red-500 transition-colors underline underline-offset-4"
                      >
                        {t.profile.clearAll}
                      </button>
                    )}
                  </div>

                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-secondary font-light">Your wishlist is empty.</p>
                      <button 
                        onClick={() => onNavigate('products')}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm hover:bg-secondary transition-colors"
                      >
                        Explore Products
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                          <div className="aspect-square bg-gray-50 relative overflow-hidden cursor-pointer" onClick={() => onNavigate(`product/${item.id}`)}>
                            <img src={getImageUrl(item.image)} alt={t.products[item.nameKey as keyof typeof t.products]} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWishlist(item.id);
                              }}
                              className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-50 transition-colors z-10"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                          <div className="p-5">
                            <h3 className="font-serif text-primary text-lg mb-2 truncate">{t.products[item.nameKey as keyof typeof t.products]}</h3>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-primary">{item.price}</span>
                              <button 
                                onClick={() => {
                                  addToCart({
                                    id: item.id,
                                    nameKey: item.nameKey,
                                    price: typeof item.price === 'string' ? parseFloat(item.price.replace('₹', '').replace('$', '')) : item.price,
                                    image: item.image
                                  });
                                }}
                                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-serif text-primary mb-2">{t.profile.accountSettings}</h2>
                  </div>

                  <div className="max-w-xl space-y-10">
                    {/* Edit Profile Form */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-serif text-primary border-b border-gray-100 pb-2">{t.profile.editProfile}</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-secondary/70 mb-1.5 ml-1">{t.profile.name}</label>
                          <input 
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            placeholder={user?.username || user?.email?.split('@')[0] || 'Enter your name'}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/30 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary/70 mb-1.5 ml-1">{t.profile.email}</label>
                          <input 
                            type="email" 
                            defaultValue={user?.email || ''}
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-secondary/50 cursor-not-allowed text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary/70 mb-1.5 ml-1">{t.profile.phone}</label>
                          <input 
                            type="tel" 
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/30 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary/70 mb-1.5 ml-1">{t.profile.location}</label>
                          <textarea 
                            value={editForm.location}
                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                            placeholder="Enter your delivery address / location"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/30 transition-all text-sm min-h-[80px]"
                          />
                        </div>
                        <button 
                          onClick={handleSaveProfile}
                          className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          {t.profile.saveChanges}
                        </button>
                      </div>
                    </div>

                    {/* Change Password Form */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-serif text-primary border-b border-gray-100 pb-2">{t.profile.changePassword}</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-secondary/70 mb-1.5 ml-1">{t.profile.currentPassword}</label>
                          <input 
                            type="password" 
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/30 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary/70 mb-1.5 ml-1">{t.profile.newPassword}</label>
                          <input 
                            type="password" 
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/30 transition-all text-sm"
                          />
                        </div>
                        <button className="px-6 py-3 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors">
                          {t.profile.updatePassword}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
