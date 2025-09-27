import React, { createContext, useContext, useEffect, useState } from 'react';
// CORRECT: Import your initialized auth instance from your local config file.
import { auth } from './firebase'; 
import { onAuthStateChanged, User } from 'firebase/auth';

// Define the shape of the context value
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

// Custom hook to easily use the auth context in any component
export const useAuth = () => {
  return useContext(AuthContext);
};

// The provider component that will wrap your entire app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Stop loading once we know the auth state
    });

    // Cleanup: unsubscribe from the listener when the component unmounts
    return unsubscribe;
  }, []); // Empty dependency array means this runs once on mount

  const value = {
    currentUser,
    loading,
  };

  // Render children only when not loading to prevent showing a logged-out state briefly
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};