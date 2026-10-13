import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [f, t, c] = await Promise.all([
          api.get('/products', { params: { featured: 'true', limit: 8 } }),
          api.get('/products', { params: { sort: 'rating', limit: 8 } }),
          api.get('/products/categories'),
        ]);
        setFeatured(f.data.products);
        setTrending(t.data.products);
        setCategories(c.data.categories);
      } catch (e) {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">New season, new deals</span>
            <h1>Shop smarter with ShopSphere</h1>
            <p>
              Discover curated electronics, fashion, home essentials and more — with fast delivery
              and secure checkout.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary">
                Start shopping
              </Link>
              <Link to="/shop?sort=rating" className="btn btn-outline">
                Top rated
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <img src="https://picsum.photos/seed/shopspherehero/800/600" alt="Shopping" />
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Shop by category</h2>
        <div className="category-grid">
          {categories.map((c) => (
            <button key={c} className="category-chip" onClick={() => navigate(`/shop?category=${c}`)}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <Spinner label="Loading products..." />
      ) : (
        <>
          <section className="container section">
            <div className="section-head">
              <h2 className="section-title">Featured</h2>
              <Link to="/shop" className="link-more">
                View all
              </Link>
            </div>
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>

          <section className="container section">
            <div className="section-head">
              <h2 className="section-title">Top rated</h2>
              <Link to="/shop?sort=rating" className="link-more">
                View all
              </Link>
            </div>
            <div className="product-grid">
              {trending.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
