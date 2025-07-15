import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Récupérer tous les utilisateurs
      const response = await fetch('/api/users');
      const users = await response.json();
      
      // Chercher l'utilisateur
      const user = users.find(u => u.username === login.trim());
      
      if (user && user.role === role) {
        // Vérifier le mot de passe avec l'API backend
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: login.trim(),
            password: password,
            role: role
          })
        });

        if (loginResponse.ok) {
          // Connexion réussie
          localStorage.setItem('username', user.username);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userId', user._id);
          
          if (role === 'operator') {
            navigate('/operateur-bienvenue');
          } else if (role === 'admin') {
            navigate('/admin');
          }
        } else {
          const errorData = await loginResponse.json();
          setError(errorData.error || 'Login ou mot de passe incorrect');
        }
      } else {
        setError('Login ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-modal">
        <div className="login-brand-title">
          Bienvenue sur <span className="login-brand-main">C-<span className="login-brand-accent">INNOVATECH</span> SOLUTIONS</span>
        </div>
        <h2>Se connecter</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="input-row">
            <div>
              <label>Se connecter</label>
              <input type="text" value={login} onChange={e => setLogin(e.target.value)} required autoComplete="username" />
            </div>
            <div>
              <label>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
          </div>
          <div className="role-row">
            <label>Se connecter en tant que :</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="role-select">
              <option value="operator">Opérateur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="send-btn" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Envoyer'}
          </button>
        </form>
        <div className="login-links">
          <Link to="/register" className="link-button">Inscrivez-vous</Link> | <button className="link-button" type="button" onClick={() => alert('Fonctionnalité à venir')}>Mot de passe oublié ?</button>
        </div>
      </div>
    </div>
  );
}

export default Login;

