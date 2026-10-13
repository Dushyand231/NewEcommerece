import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { resolveImage } from '../services/api';
import { formatPrice, discountPercent, formatDate } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    const { data } = await api.get(`/reviews/product/${id}`);
    setReviews(data.reviews);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        await loadReviews();
      } catch (e) {
        toast.error('Product not found');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdd = async () => {
    try {
      await addItem(product, qty);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.userMessage || 'Could not add to cart');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please login to write a review');
      return navigate('/login');
    }
    setSubmitting(true);
    try {
      await api.post(`/reviews/product/${id}`, { rating: Number(rating), comment });
      toast.success('Review submitted');
      setComment('');
      setRating(5);
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      await loadReviews();
    } catch (err) {
      toast.error(err.userMessage || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading product..." />;
  if (!product) return null;

  const off = discountPercent(product.price, product.actualPrice);
  const alreadyReviewed = reviews.some((r) => r.user === user?._id);

  return (
    <div className="container section product-detail">
      <div className="product-gallery">
        <div className="gallery-main">
          <img src={resolveImage(product.images?.[activeImage])} alt={product.name} />
        </div>
        {product.images?.length > 1 && (
          <div className="gallery-thumbs">
            {product.images.map((img, i) => (
              <button
                key={i}
                className={i === activeImage ? 'active' : ''}
                onClick={() => setActiveImage(i)}
              >
                <img src={resolveImage(img)} alt={`${product.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-info">
        <span className="product-brand">{product.brand || product.category}</span>
        <h1>{product.name}</h1>
        <div className="product-rating">
          {'★'.repeat(Math.round(product.rating || 0))}
          <span className="muted">
            {product.rating || 0} ({product.numReviews || 0} reviews)
          </span>
        </div>
        <div className="product-price large">
          <strong>{formatPrice(product.price)}</strong>
          {product.actualPrice > product.price && (
            <>
              <span className="price-strike">{formatPrice(product.actualPrice)}</span>
              <span className="badge-discount">-{off}%</span>
            </>
          )}
        </div>
        <p className="product-desc">{product.description}</p>

        <p className={product.stock > 0 ? 'in-stock' : 'out-stock'}>
          {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
        </p>

        {product.stock > 0 && (
          <div className="add-row">
            <div className="qty-control">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>
              Add to cart
            </button>
            <button
              className="btn btn-dark"
              onClick={async () => {
                await handleAdd();
                navigate('/cart');
              }}
            >
              Buy now
            </button>
          </div>
        )}
      </div>

      <section className="reviews">
        <h2 className="section-title">Customer reviews</h2>
        <div className="review-form-wrap">
          <h3>Write a review</h3>
          {isAuthenticated && alreadyReviewed ? (
            <p className="muted">You have already reviewed this product.</p>
          ) : (
            <form onSubmit={submitReview} className="review-form">
              <label>
                Rating
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} star{r > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Comment
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="3"
                  placeholder="Share your experience"
                  required
                />
              </label>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          )}
        </div>

        <div className="review-list">
          {reviews.length === 0 ? (
            <p className="muted">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="review-item">
                <div className="review-head">
                  <strong>{r.name}</strong>
                  <span className="muted">{formatDate(r.createdAt)}</span>
                </div>
                <div className="product-rating">{'★'.repeat(r.rating)}</div>
                <p>{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
