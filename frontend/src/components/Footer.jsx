import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>ShopSphere</h4>
          <p className="muted">Everything you love, delivered.</p>
        </div>
        <div>
          <h5>Shop</h5>
          <Link to="/shop">All products</Link>
          <Link to="/shop?category=Electronics">Electronics</Link>
          <Link to="/shop?category=Fashion">Fashion</Link>
        </div>
        <div>
          <h5>Account</h5>
          <Link to="/account/orders">My orders</Link>
          <Link to="/account/profile">Profile</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h5>Support</h5>
          <p className="muted">support@shopsphere.com</p>
          <p className="muted">Mon-Sat, 9am - 6pm</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} ShopSphere. All rights reserved.</div>
    </footer>
  );
}
