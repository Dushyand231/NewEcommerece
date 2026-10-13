import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: user?.address?.line1 || '',
    line2: user?.address?.line2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name: profile.name,
        phone: profile.phone,
        address: {
          line1: profile.line1,
          line2: profile.line2,
          city: profile.city,
          state: profile.state,
          postalCode: profile.postalCode,
          country: profile.country,
        },
      });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.userMessage || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', passwords);
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.userMessage || 'Could not change password');
    }
  };

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      <form className="card" onSubmit={saveProfile}>
        <div className="form-grid">
          <label>
            Name
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </label>
          <label>
            Email
            <input value={user?.email || ''} disabled />
          </label>
          <label>
            Phone
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </label>
          <label className="span-2">
            Address line 1
            <input value={profile.line1} onChange={(e) => setProfile({ ...profile, line1: e.target.value })} />
          </label>
          <label className="span-2">
            Address line 2
            <input value={profile.line2} onChange={(e) => setProfile({ ...profile, line2: e.target.value })} />
          </label>
          <label>
            City
            <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          </label>
          <label>
            State
            <input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
          </label>
          <label>
            Postal code
            <input value={profile.postalCode} onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })} />
          </label>
          <label>
            Country
            <input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
          </label>
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <form className="card" onSubmit={changePassword}>
        <h3>Change password</h3>
        <div className="form-grid">
          <label>
            Current password
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </label>
        </div>
        <button className="btn btn-dark">Update password</button>
      </form>
    </div>
  );
}
