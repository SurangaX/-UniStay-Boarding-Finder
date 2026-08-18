import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        // Default to the first student for testing
        const student = data.find(u => u.role === 'student');
        if (student) setUser(student);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users', err);
        setLoading(false);
      });
  }, []);

  const loginAs = (role) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) setUser(targetUser);
  };

  return (
    <AuthContext.Provider value={{ user, users, loginAs, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
