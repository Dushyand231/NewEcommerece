import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import Spinner from '../../components/Spinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (!data) return null;

  const { stats, recentOrders } = data;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Revenue</span>
          <strong>{formatPrice(stats.revenue)}</strong>
        </div>
        <div className="stat-card">
          <span>Orders</span>
          <strong>{stats.orders}</strong>
        </div>
        <div className="stat-card">
          <span>Buyers</span>
          <strong>{stats.buyers}</strong>
        </div>
        <div className="stat-card">
          <span>Products</span>
          <strong>{stats.products}</strong>
        </div>
        <div className="stat-card">
          <span>Customers</span>
          <strong>{stats.users}</strong>
        </div>
      </div>

      <p className="muted">
        {stats.buyers} of {stats.users} customers have placed an order.
      </p>

      <h3>Recent orders</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderNumber}</td>
                <td>{o.user?.name || 'Guest'}</td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{formatPrice(o.totalPrice)}</td>
                <td>
                  <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <Link to="/admin/orders" className="link-more">
          Manage orders → 
        </Link>
      </p>
    </div>
  );
}
