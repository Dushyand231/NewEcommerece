import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <button className="nav-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          ☰
        </button>
        <Link to="/" className="brand">
          Shop<span>Sphere</span>
        </Link>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/shop" onClick={() => setMenuOpen(false)}>
            Shop
          </NavLink>
        </nav>

        <form className="nav-search" onSubmit={submitSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" aria-label="Search">
            Search
          </button>
        </form>

        <div className="nav-actions">
          <Link to="/cart" className="cart-link">
            Cart
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="account-menu">
              <button className="account-btn" onClick={() => setAccountOpen((v) => !v)}>
                {user?.name?.split(' ')[0] || 'Account'} ▾
              </button>
              {accountOpen && (
                <div className="account-dropdown" onMouseLeave={() => setAccountOpen(false)}>
                  <Link to="/account/profile" onClick={() => setAccountOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/account/orders" onClick={() => setAccountOpen(false)}>
                    My orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setAccountOpen(false)}>
                      Admin dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
