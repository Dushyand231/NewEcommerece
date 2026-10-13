import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { resolveImage } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
    } catch (e) {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const { data } = await api.post(`/orders/${id}/cancel`);
      setOrder(data.order);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.userMessage || 'Could not cancel order');
    }
  };

  if (loading) return <Spinner label="Loading order..." />;
  if (!order) return null;

  const canCancel = !['Shipped', 'Delivered', 'Cancelled'].includes(order.status);

  return (
    <div className="order-detail">
      <div className="order-detail-head">
        <h2>Order {order.orderNumber}</h2>
        <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
      </div>
      <p className="muted">Placed on {formatDate(order.createdAt)}</p>

      <div className="card">
        <h3>Items</h3>
        {order.items.map((item) => (
          <div key={item.product} className="order-item">
            <img src={resolveImage(item.image)} alt={item.name} />
            <span>{item.name}</span>
            <span className="muted">× {item.quantity}</span>
            <strong>{formatPrice(item.price * item.quantity)}</strong>
          </div>
        ))}
      </div>

      <div className="order-columns">
        <div className="card">
          <h3>Shipping address</h3>
          <p>
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
            <br />
            {order.shippingAddress.phone}
          </p>
        </div>
        <div className="card">
          <h3>Payment</h3>
          <p>
            Method: <strong>{order.paymentMethod}</strong>
            <br />
            Status: <strong>{order.paymentStatus}</strong>
          </p>
          <div className="summary-row">
            <span>Items</span>
            <span>{formatPrice(order.itemsPrice)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatPrice(order.totalPrice)}</strong>
          </div>
        </div>
      </div>

      {canCancel && (
        <button className="btn btn-danger" onClick={cancel}>
          Cancel order
        </button>
      )}
    </div>
  );
}
