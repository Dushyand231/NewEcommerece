import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import Spinner from '../../components/Spinner';

const statusClass = (status) => `status status-${status.toLowerCase()}`;

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/my-orders')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading orders..." />;

  return (
    <div>
      <h2>My orders</h2>
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <Link to={`/account/orders/${o._id}`} key={o._id} className="order-row card">
              <div>
                <strong>{o.orderNumber}</strong>
                <span className="muted"> {formatDate(o.createdAt)}</span>
              </div>
              <span className={statusClass(o.status)}>{o.status}</span>
              <span className="muted">{o.items.length} item(s)</span>
              <strong>{formatPrice(o.totalPrice)}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
