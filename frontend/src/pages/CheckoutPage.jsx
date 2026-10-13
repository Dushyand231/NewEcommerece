import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_FEE = 49;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: user?.address?.line1 || '',
    line2: user?.address?.line2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/payments/config')
      .then(({ data }) => setRazorpayEnabled(data.razorpayEnabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items.length, navigate]);

  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', { shippingAddress: form, paymentMethod });
      const order = data.order;

      if (paymentMethod === 'RAZORPAY') {
        const ok = await loadRazorpayScript();
        if (!ok) throw new Error('Unable to load payment gateway');

        const payRes = await api.post('/payments/order', { orderId: order._id });
        const pay = payRes.data;

        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: pay.keyId,
            amount: pay.amount,
            currency: pay.currency,
            name: 'ShopSphere',
            description: `Order ${pay.orderNumber}`,
            order_id: pay.razorpayOrderId,
            prefill: { name: form.fullName, contact: form.phone, email: user?.email },
            handler: async (response) => {
              try {
                await api.post('/payments/verify', {
                  orderId: order._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          });
          rzp.open();
        });
      }

      await clear();
      toast.success('Order placed successfully!');
      navigate(`/account/orders/${order._id}`);
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section checkout-page">
      <h1 className="section-title">Checkout</h1>
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-form">
          <h3>Delivery details</h3>
          <div className="form-grid">
            <label>
              Full name
              <input name="fullName" value={form.fullName} onChange={handleChange} required />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label className="span-2">
              Address line 1
              <input name="line1" value={form.line1} onChange={handleChange} required />
            </label>
            <label className="span-2">
              Address line 2 (optional)
              <input name="line2" value={form.line2} onChange={handleChange} />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              State
              <input name="state" value={form.state} onChange={handleChange} required />
            </label>
            <label>
              Postal code
              <input name="postalCode" value={form.postalCode} onChange={handleChange} required />
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={handleChange} required />
            </label>
          </div>

          <h3>Payment method</h3>
          <div className="payment-options">
            <label className={paymentMethod === 'COD' ? 'selected' : ''}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              Cash on Delivery
            </label>
            <label className={paymentMethod === 'RAZORPAY' ? 'selected' : ''}>
              <input
                type="radio"
                name="payment"
                disabled={!razorpayEnabled}
                checked={paymentMethod === 'RAZORPAY'}
                onChange={() => setPaymentMethod('RAZORPAY')}
              />
              Pay online {razorpayEnabled ? '(Razorpay)' : '(unavailable)'}
            </label>
          </div>
        </div>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          {items.map(({ product, quantity }) => (
            <div key={product._id} className="summary-row">
              <span>
                {product.name} × {quantity}
              </span>
              <span>{formatPrice(product.price * quantity)}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </aside>
      </form>
    </div>
  );
}
