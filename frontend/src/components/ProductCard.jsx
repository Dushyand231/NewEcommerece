import { Link } from 'react-router-dom';
import { formatPrice, discountPercent } from '../utils/format';
import { resolveImage } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const off = discountPercent(product.price, product.actualPrice);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.userMessage || 'Could not add to cart');
    }
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="product-media">
        <img src={resolveImage(product.images?.[0])} alt={product.name} loading="lazy" />
        {off > 0 && <span className="badge-discount">-{off}%</span>}
        {product.stock === 0 && <span className="badge-out">Out of stock</span>}
      </div>
      <div className="product-body">
        <span className="product-brand">{product.brand || product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          {'★'.repeat(Math.round(product.rating || 0))}
          <span className="muted">({product.numReviews || 0})</span>
        </div>
        <div className="product-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.actualPrice > product.price && (
            <span className="price-strike">{formatPrice(product.actualPrice)}</span>
          )}
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={handleAdd}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Unavailable' : 'Add to cart'}
        </button>
      </div>
    </Link>
  );
}
