import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operateur');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const VALID_LOGIN = 'operateur';
  const VALID_PASSWORD = 'call123';
  const ADMIN_LOGIN = 'admin';
  const ADMIN_PASSWORD = 'admin123';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'operateur' && login.trim() === VALID_LOGIN && password === VALID_PASSWORD) {
      setError('');
      navigate('/operateur');
    } else if (role === 'admin' && login.trim() === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      setError('');
      navigate('/admin');
    } else {
      setError('Login ou mot de passe incorrect');
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
              <option value="operateur">Opérateur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="send-btn" type="submit">Envoyer</button>
        </form>
        <div className="login-links">
          <Link to="/register" className="link-button">Inscrivez-vous</Link> | <button className="link-button" type="button" onClick={() => alert('Fonctionnalité à venir')}>Mot de passe oublié ?</button>
        </div>
      </div>
    </div>
  );
}

export default Login;

