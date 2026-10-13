import { NavLink, Outlet } from 'react-router-dom';

export default function AccountLayout() {
  return (
    <div className="container section account-layout">
      <aside className="account-nav">
        <h3>My account</h3>
        <NavLink to="/account/profile">Profile</NavLink>
        <NavLink to="/account/orders">Orders</NavLink>
      </aside>
      <section className="account-content">
        <Outlet />
      </section>
    </div>
  );
}
