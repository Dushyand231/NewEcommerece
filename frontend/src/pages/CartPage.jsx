import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { resolveImage } from '../services/api';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, count, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section empty-cart">
        <h2>Your cart is empty</h2>
        <p className="muted">Add some products to get started.</p>
        <Link to="/shop" className="btn btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container section cart-page">
      <h1 className="section-title">Shopping cart ({count})</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map(({ product, quantity }) => (
            <div key={product._id} className="cart-item">
              <img src={resolveImage(product.images?.[0])} alt={product.name} />
              <div className="cart-item-info">
                <Link to={`/product/${product._id}`}>{product.name}</Link>
                <span className="muted">{formatPrice(product.price)}</span>
              </div>
              <div className="qty-control">
                <button onClick={() => updateQuantity(product._id, quantity - 1)}>−</button>
                <span>{quantity}</span>
                <button
                  onClick={() => updateQuantity(product._id, Math.min(product.stock || 99, quantity + 1))}
                >
                  +
                </button>
              </div>
              <strong className="cart-line-total">{formatPrice(product.price * quantity)}</strong>
              <button className="btn-remove" onClick={() => removeItem(product._id)} aria-label="Remove">
                ✕
              </button>
            </div>
          ))}
          <button className="btn btn-ghost" onClick={clear}>
            Clear cart
          </button>
        </div>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="muted">Delivery fee calculated at checkout.</p>
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate(isAuthenticated ? '/checkout' : '/login')}
          >
            {isAuthenticated ? 'Proceed to checkout' : 'Login to checkout'}
          </button>
        </aside>
      </div>
    </div>
  );
}
