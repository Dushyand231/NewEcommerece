import { useEffect, useState } from 'react';
import api, { resolveImage } from '../../services/api';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

const EMPTY = {
  name: '',
  brand: '',
  category: 'Electronics',
  price: '',
  actualPrice: '',
  stock: '',
  description: '',
  featured: false,
};

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys', 'Other'];

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { limit: 48, sort: 'newest' } });
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setFiles([]);
    setShowForm(true);
  };

  const startEdit = (p) => {
    setForm({
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      price: p.price,
      actualPrice: p.actualPrice || '',
      stock: p.stock,
      description: p.description || '',
      featured: p.featured,
    });
    setEditId(p._id);
    setFiles([]);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('images', f));

      if (editId) await api.put(`/products/${editId}`, fd);
      else await api.post('/products', fd);

      toast.success(editId ? 'Product updated' : 'Product created');
      setShowForm(false);
      setForm(EMPTY);
      setEditId(null);
      setFiles([]);
      await load();
    } catch (err) {
      toast.error(err.userMessage || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      await load();
    } catch (err) {
      toast.error(err.userMessage || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="admin-head">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={startCreate}>
          + Add product
        </button>
      </div>

      {showForm && (
        <form className="card product-form" onSubmit={submit}>
          <h3>{editId ? 'Edit product' : 'New product'}</h3>
          <div className="form-grid">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Brand
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>
            <label>
              MRP (actual price)
              <input
                type="number"
                min="0"
                value={form.actualPrice}
                onChange={(e) => setForm({ ...form, actualPrice: e.target.value })}
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </label>
            <label className="span-2">
              Description
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="span-2">
              Images
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
            </label>
            <label className="checkbox span-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured product
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner label="Loading products..." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img className="table-thumb" src={resolveImage(p.images?.[0])} alt={p.name} />
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>{p.featured ? 'Yes' : '—'}</td>
                  <td className="row-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
