import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

export default function AdminUsers() {
  const toast = useToast();
  const { user: current } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/status`, { isBlocked: !u.isBlocked });
      toast.success(u.isBlocked ? 'User unblocked' : 'User blocked');
      await load();
    } catch (err) {
      toast.error(err.userMessage || 'Update failed');
    }
  };

  return (
    <div>
      <h2>Users</h2>
      {loading ? (
        <Spinner label="Loading users..." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{u.isBlocked ? 'Blocked' : 'Active'}</td>
                  <td>
                    {u.role !== 'admin' && u._id !== current?._id && (
                      <button
                        className={`btn btn-sm ${u.isBlocked ? 'btn-outline' : 'btn-danger'}`}
                        onClick={() => toggleBlock(u)}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
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
