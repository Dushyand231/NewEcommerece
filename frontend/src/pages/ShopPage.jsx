import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
];

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const category = params.get('category') || 'All';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  const updateParam = (key, value, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, c] = await Promise.all([
          api.get('/products', {
            params: { search, category, sort, page, minPrice, maxPrice, limit: 12 },
          }),
          api.get('/products/categories'),
        ]);
        setProducts(p.data.products);
        setPages(p.data.pages);
        setTotal(p.data.total);
        setCategories(c.data.categories);
      } catch (e) {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, category, sort, page, minPrice, maxPrice]);

  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => setMinInput(minPrice), [minPrice]);
  useEffect(() => setMaxInput(maxPrice), [maxPrice]);

  const applyFilters = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput) next.set('search', searchInput);
    else next.delete('search');
    if (minInput) next.set('minPrice', minInput);
    else next.delete('minPrice');
    if (maxInput) next.set('maxPrice', maxInput);
    else next.delete('maxPrice');
    next.delete('page');
    setParams(next);
  };

  return (
    <div className="container section shop-page">
      <aside className="filters">
        <h3>Filters</h3>
        <form onSubmit={applyFilters}>
          <label>
            Search
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Keyword" />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => updateParam('category', e.target.value === 'All' ? '' : e.target.value)}>
              <option value="All">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="price-row">
            <label>
              Min
              <input type="number" min="0" value={minInput} onChange={(e) => setMinInput(e.target.value)} />
            </label>
            <label>
              Max
              <input type="number" min="0" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Apply
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => {
              setSearchInput('');
              setMinInput('');
              setMaxInput('');
              setParams(new URLSearchParams());
            }}
          >
            Clear all
          </button>
        </form>
      </aside>

      <section className="shop-results">
        <div className="shop-toolbar">
          <span className="muted">{total} products</span>
          <label className="sort-label">
            Sort
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <Spinner label="Loading products..." />
        ) : products.length === 0 ? (
          <p className="empty-state">No products match your filters.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                onClick={() => updateParam('page', String(i + 1), false)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
