import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from './store';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState([]);

  useEffect(() => {
    const saved = storage.get('cp_session');
    if (saved) setUser(saved);
  }, []);

  function login(userData) {
    setUser(userData);
    storage.set('cp_session', userData);
  }

  function logout() {
    setUser(null);
    storage.remove('cp_session');
  }

  function showToast(msg, type = 'info') {
    const id = Date.now();
    setToast(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToast(prev => prev.filter(t => t.id !== id)), 3500);
  }

  return (
    <AppContext.Provider value={{ user, login, logout, showToast, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
