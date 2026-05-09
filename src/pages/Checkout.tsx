import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle, ShoppingBag, Send, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getImageUrl } from '../utils/urlHelper';

interface CheckoutProps {
  onNavigate: (page: string) => void;
}

export default function Checkout({ onNavigate }: CheckoutProps) {
  const [product, setProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1); // Only for single product
  const [doubt, setDoubt] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for Cart Checkout first
    const savedCart = localStorage.getItem('checkout_cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      if (items && items.length > 0) {
        setCartItems(items);
        setIsCartCheckout(true);
        setLoading(false);
        return;
      }
    }

    // 2. Fallback to single product checkout
    const savedProduct = localStorage.getItem('checkout_product');
    if (savedProduct) {
      const parsed = JSON.parse(savedProduct);
      setProduct(parsed);
      setQuantity(parsed.initialQuantity || 1);
      setIsCartCheckout(false);
    }
    setLoading(false);
  }, []);

  const handlePlaceOrder = () => {
    if (!customerPhone.trim() || !customerLocation.trim()) {
      alert("Please enter your phone number and delivery location.");
      return;
    }

    const phoneNumber = "917845890485";
    let message = `*New Order Request*%0A%0A`;
    message += `*Customer Details:*%0A`;
    message += `Phone: ${customerPhone}%0A`;
    message += `Location: ${customerLocation}%0A%0A`;

    if (isCartCheckout) {
      message += `*Items in Cart:*%0A`;
      cartItems.forEach((item, index) => {
        message += `${index + 1}. ${item.nameKey} (x${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}%0A`;
      });
      const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      message += `%0A*Total Amount:* ₹${total.toFixed(2)}%0A`;
    } else if (product) {
      message += `*Product:* ${product.name}%0A` +
        `*Quantity:* ${quantity}%0A` +
        `*Price:* ₹${(product.price * quantity).toFixed(2)}%0A`;
    }

    message += `%0A*Notes/Doubts:* ${doubt || 'None'}%0A%0A` +
      `Please confirm my order.`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Clear checkout state after placing order
    localStorage.removeItem('checkout_product');
    localStorage.removeItem('checkout_cart');
    
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">Loading...</div>;
  }

  if (!product && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] pt-[70px] flex items-center justify-center p-6">
        <Navbar onNavigate={onNavigate} currentPage="checkout" />
        <div className="text-center bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-secondary/40 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-primary mb-2">Checkout empty</h2>
          <p className="text-secondary/60 mb-8 text-sm">Please select a product or add to cart to checkout.</p>
          <button 
            onClick={() => onNavigate('products')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-secondary transition-all"
          >
            Go to Products
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = isCartCheckout 
    ? cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    : (product ? product.price * quantity : 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] selection:bg-secondary/30 pt-[70px]">
      <Navbar onNavigate={onNavigate} currentPage="checkout" />

      <main className="max-w-[800px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <button 
          onClick={() => onNavigate(isCartCheckout ? 'cart' : `product/${product.id}`)}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-wider">Back to {isCartCheckout ? 'Cart' : 'Product'}</span>
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left side: Images/Items */}
            <div className="w-full md:w-2/5 bg-beige p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
              {isCartCheckout ? (
                cartItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-beige-dark/20">
                    <img src={getImageUrl(item.image)} alt={item.nameKey} className="w-16 h-16 object-contain" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{item.nameKey}</p>
                      <p className="text-xs text-secondary">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={product.name} 
                    className="w-full h-full object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Right side: Form */}
            <div className="flex-1 p-8 md:p-12">
              <div className="mb-8">
                <span className="text-[10px] uppercase tracking-[3px] text-secondary/60 mb-2 block">Confirm Order</span>
                <h1 className="text-2xl md:text-3xl font-serif text-primary mb-2">
                  {isCartCheckout ? 'Cart Checkout' : product.name}
                </h1>
                {isCartCheckout ? (
                   <p className="text-sm text-secondary/70">{cartItems.length} items in your order</p>
                ) : (
                   <p className="text-xl font-serif text-secondary">₹{Number(product.price).toFixed(2)} / unit</p>
                )}
              </div>

              <div className="space-y-6">
                {/* Quantity - Only for single product */}
                {!isCartCheckout && (
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-3 ml-1">Quantity</label>
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-2 w-fit">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center bg-transparent font-bold text-primary focus:outline-none"
                      />
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">Delivery Details</label>
                  <div>
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone Number *"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm mb-3"
                      required
                    />
                  </div>
                  <div>
                    <textarea 
                      value={customerLocation}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                      placeholder="Delivery Address / Location *"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px] text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Doubts/Notes */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-3 ml-1">Any Doubts or Special Requests?</label>
                  <textarea 
                    value={doubt}
                    onChange={(e) => setDoubt(e.target.value)}
                    placeholder="Enter your questions or notes here..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] text-sm"
                  />
                </div>

                {/* Summary */}
                <div className="p-6 bg-beige/30 rounded-2xl border border-beige-dark/20">
                  <div className="flex justify-between items-center text-primary">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-xl font-serif">₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action */}
                <button 
                  onClick={handlePlaceOrder}
                  className="w-full py-5 bg-[#25D366] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#25D366]/20 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  Place Order via WhatsApp
                </button>
                
                <p className="text-[10px] text-center text-secondary/60 mt-4 px-8 leading-relaxed italic">
                  Clicking "Place Order" will open WhatsApp with your order details pre-filled. You can then send the message to finalize your order with our team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
