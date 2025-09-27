"use client";
import React, { useState } from 'react';
// 1. Import Firebase auth and the function to sign in
import { auth } from '@/firebase'; // Adjust the path if needed
import { signInWithEmailAndPassword } from 'firebase/auth';
// Optional: If you use React Router for navigation
// import { useNavigate } from 'react-router-dom';

// Define the shape of our form data
interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  // const navigate = useNavigate(); // Hook for navigation
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 2. Use the Firebase function to sign the user in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log('User signed in:', userCredential.user);
      alert('Login successful! Welcome back. 👋');
      
      // 3. Redirect to the dashboard or home page after login
      // navigate('/dashboard');

    } catch (err: any) {
      // Handle common Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error("Firebase login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Styles (re-used from signup for consistency) ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif'},
    formWrapper: { padding: '40px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', width: '100%', maxWidth: '420px', boxSizing: 'border-box'},
    header: { marginBottom: '24px', textAlign: 'center', fontSize: '28px', color: '#333'},
    inputGroup: { marginBottom: '20px'},
    label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555'},
    input: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px'},
    button: { width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 },
    signupLink: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#555'},
    link: { color: '#007bff', textDecoration: 'none', fontWeight: '600'},
    error: { color: 'red', textAlign: 'center', marginBottom: '10px' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h2 style={styles.header}>Welcome Back! 👋</h2>
        <form onSubmit={handleSubmit}>
          {/* --- Email --- */}
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email Address</label>
            <input
              type="email" id="email" name="email" value={formData.email}
              onChange={handleChange} required style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          {/* --- Password --- */}
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password" id="password" name="password" value={formData.password}
              onChange={handleChange} required style={styles.input}
              placeholder="Enter your password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p style={styles.signupLink}>
          Don't have an account? <a href="/signup" style={styles.link}>Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;