import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    experience: 'non',
    role: 'operateur'
  });
  const [passeportFile, setPasseportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Veuillez sélectionner un fichier PDF');
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('Le fichier est trop volumineux. Taille maximale: 5MB');
        e.target.value = null;
        return;
      }
      setPasseportFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passeportFile) {
      setError('Veuillez télécharger votre passeport en PDF');
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      formDataToSend.append('passeportFile', passeportFile);

      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'envoi du formulaire');
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-container">
        <h2>Inscription</h2>
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Votre demande d'inscription a été envoyée avec succès. Un administrateur vous contactera bientôt.
          </div>
        )}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="nom">Nom</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prenom">Prénom</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telephone">Numéro WhatsApp</label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="passeportFile">Passeport (PDF)</label>
            <input
              type="file"
              id="passeportFile"
              name="passeportFile"
              onChange={handleFileChange}
              accept=".pdf"
              required
            />
            <small className="file-info">
              Format accepté: PDF. Taille maximale: 5MB
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="experience">Expérience de travail</label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
            >
              <option value="non">Non</option>
              <option value="oui">Oui</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">Rôle</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="operateur">Opérateur</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="submit-button">Envoyer la demande</button>
          <button type="button" className="back-button" onClick={() => navigate('/')}>
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register; 