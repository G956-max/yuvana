import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import About from './pages/About';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, role, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    // Only redirect if we are on the initial 'home' page (at startup)
    // or if the user is trying to access the login page while already logged in
    // and we want to move them away (though we might want to allow it now).
    // Let's make it so it only redirects automatically on mount if authenticated.
    if (user && !loading && currentPage === 'home') {
      if (role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('home');
      }
    }
  }, [user, role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderPage = () => {
    // Pages accessible without login
    const isPublicPage = ['home', 'login'].includes(currentPage);

    if (!user && !isPublicPage) {
      return (
        <LanguageProvider>
          <Login onLogin={(role) => {
            if (role === 'admin') {
              setCurrentPage('admin');
            } else {
              setCurrentPage('home');
            }
          }} />
        </LanguageProvider>
      );
    }

    // Admin route protection
    if (currentPage === 'admin') {
      if (role === 'admin') {
        return <AdminDashboard onNavigate={handleNavigate} />;
      } else {
        // Fallback if user tries to access admin without role
        setCurrentPage('home');
        return <Home onNavigate={handleNavigate} />;
      }
    }

    if (currentPage.startsWith('product/')) {
      const id = currentPage.split('/')[1];
      return <ProductDetail id={id} onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'products':
        return <ProductPage onNavigate={handleNavigate} />;
      case 'about':
        return <About onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
      case 'cart':
        return <CartPage onNavigate={handleNavigate} />;
      case 'checkout':
        return <Checkout onNavigate={handleNavigate} />;
      case 'login':
        return (
          <Login onLogin={(role) => {
            if (role === 'admin') {
              setCurrentPage('admin');
            } else {
              setCurrentPage('home');
            }
          }} />
        );
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <LanguageProvider>
      <CartProvider>
        <WishlistProvider>
          <main>
            {renderPage()}
          </main>
          <Toaster position="bottom-right" richColors />
        </WishlistProvider>
      </CartProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
