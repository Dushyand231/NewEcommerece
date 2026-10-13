import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="container section admin-layout">
      <aside className="admin-nav">
        <h3>Admin</h3>
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
