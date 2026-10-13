import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'guestCart';

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
};

const normalizeServerCart = (cart) =>
  (cart?.items || [])
    .filter((i) => i.product)
    .map((i) => ({ product: i.product, quantity: i.quantity }));

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(() => readGuestCart());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isAuthenticated) {
        if (active) setItems(readGuestCart());
        return;
      }
      setLoading(true);
      try {
        const guest = readGuestCart();
        if (guest.length) {
          await api.post('/cart/sync', {
            items: guest.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
          });
          writeGuestCart([]);
        }
        const { data } = await api.get('/cart');
        if (active) setItems(normalizeServerCart(data.cart));
      } catch (e) {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (product, quantity = 1) => {
      if (isAuthenticated) {
        const { data } = await api.post('/cart', { productId: product._id, quantity });
        setItems(normalizeServerCart(data.cart));
      } else {
        setItems((prev) => {
          const existing = prev.find((i) => i.product._id === product._id);
          let next;
          if (existing) {
            next = prev.map((i) =>
              i.product._id === product._id
                ? { ...i, quantity: Math.min(product.stock || 99, i.quantity + quantity) }
                : i
            );
          } else {
            next = [...prev, { product, quantity: Math.min(product.stock || 99, quantity) }];
          }
          writeGuestCart(next);
          return next;
        });
      }
    },
    [isAuthenticated]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (quantity < 1) return;
      if (isAuthenticated) {
        const { data } = await api.put(`/cart/${productId}`, { quantity });
        setItems(normalizeServerCart(data.cart));
      } else {
        setItems((prev) => {
          const next = prev.map((i) => (i.product._id === productId ? { ...i, quantity } : i));
          writeGuestCart(next);
          return next;
        });
      }
    },
    [isAuthenticated]
  );

  const removeItem = useCallback(
    async (productId) => {
      if (isAuthenticated) {
        const { data } = await api.delete(`/cart/${productId}`);
        setItems(normalizeServerCart(data.cart));
      } else {
        setItems((prev) => {
          const next = prev.filter((i) => i.product._id !== productId);
          writeGuestCart(next);
          return next;
        });
      }
    },
    [isAuthenticated]
  );

  const clear = useCallback(async () => {
    if (isAuthenticated) {
      await api.delete('/cart');
    } else {
      writeGuestCart([]);
    }
    setItems([]);
  }, [isAuthenticated]);

  const { count, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, i) => ({
        count: acc.count + i.quantity,
        subtotal: acc.subtotal + i.product.price * i.quantity,
      }),
      { count: 0, subtotal: 0 }
    );
  }, [items]);

  const value = {
    items,
    loading,
    count,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
