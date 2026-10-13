import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', { params: { status: filter } });
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      toast.success('Order updated');
      await load();
    } catch (err) {
      toast.error(err.userMessage || 'Update failed');
    }
  };

  return (
    <div>
      <div className="admin-head">
        <h2>Orders</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner label="Loading orders..." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.orderNumber}</td>
                  <td>
                    {o.user?.name}
                    <br />
                    <span className="muted">{o.user?.email}</span>
                  </td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{formatPrice(o.totalPrice)}</td>
                  <td>{o.paymentMethod}</td>
                  <td>
                    <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
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
