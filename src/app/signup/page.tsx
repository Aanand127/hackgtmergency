"use client";
import React, { useState } from 'react';
// 1. Import Firebase auth and the function to create a user
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';

// Define the shape of our form data
interface SignUpFormData {
  email: string;
  password:string;
  confirmPassword: string;
}

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  // Add state for loading and error messages
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // 2. Make the submit handler async
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Reset error on new submission

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // 3. Use the Firebase function to create the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // The user is created and signed in
      const user = userCredential.user;
      console.log('Successfully created user:', user);
      alert(`Account created successfully for ${user.email}! 🎉`);
      // You can redirect the user here, e.g., to a dashboard
      // history.push('/dashboard');

    } catch (err: any) {
      // 4. Handle Firebase errors
      setError(err.message);
      console.error("Firebase auth error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Styles (unchanged from previous example) ---
  const styles: { [key: string]: React.CSSProperties } = { /* ...styles from previous answer... */
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif'},
    formWrapper: { padding: '40px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', width: '100%', maxWidth: '420px', boxSizing: 'border-box'},
    header: { marginBottom: '24px', textAlign: 'center', fontSize: '28px', color: '#333'},
    inputGroup: { marginBottom: '20px'},
    label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555'},
    input: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px'},
    button: { width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 },
    loginLink: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#555'},
    link: { color: '#007bff', textDecoration: 'none', fontWeight: '600'},
    error: { color: 'red', textAlign: 'center', marginBottom: '10px' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h2 style={styles.header}>Create Your Account ✨</h2>
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
              onChange={handleChange} required minLength={6} style={styles.input}
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* --- Confirm Password --- */}
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
            <input
              type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} required style={styles.input}
              placeholder="Re-enter your password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p style={styles.loginLink}>
          Already have an account? <a href="/login" style={styles.link}>Log In</a>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;