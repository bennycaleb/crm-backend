import React, { useEffect, useState } from 'react';
import { API_URL } from '../apiConfig';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
      setError('');
    } catch (e) {
      setError('Erreur lors du chargement des utilisateurs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(user => user._id !== id));
      } else if (res.status === 404) {
        alert("L'utilisateur n'existe plus ou a déjà été supprimé.");
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (e) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Nouveau mot de passe pour cet utilisateur :');
    if (!newPassword) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      if (res.ok) {
        alert('Mot de passe réinitialisé avec succès !');
      } else {
        alert('Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (e) {
      alert('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Connecté': return 'green';
      case 'Hors ligne': return 'red';
      case 'Pause': return 'orange';
      case 'Formation': return 'blue';
      default: return 'gray';
    }
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'purple' : 'blue';
  };

  if (loading) return <div>Chargement des utilisateurs...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestion des Utilisateurs</h2>
      <button onClick={fetchUsers} style={{ marginBottom: '20px', padding: '10px 20px' }}>
        Actualiser
      </button>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Utilisateur</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Nom</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Prénom</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Rôle</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Statut</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Téléphone</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Temps par statut</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Appel en cours</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(user => user.username).map(user => (
              <tr key={user._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <strong>{user.username}</strong>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {user.nom || '-'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {user.prenom || '-'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    backgroundColor: getRoleColor(user.role), 
                    color: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    backgroundColor: getStatusColor(user.operatorStatus), 
                    color: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {user.operatorStatus || 'Hors ligne'}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {user.email || '-'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {user.telephone || '-'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {user.statusTimes ? (
                    <div style={{fontSize:'13px', lineHeight:'1.3'}}>
                      <div><b>Connecté</b><br /><span style={{fontSize:'11px', color:'#888'}}>{user.statusTimes?.Connecté || 0} s</span></div>
                      <div><b>Hors ligne</b><br /><span style={{fontSize:'11px', color:'#888'}}>{user.statusTimes?.['Hors ligne'] || 0} s</span></div>
                      <div><b>Pause</b><br /><span style={{fontSize:'11px', color:'#888'}}>{user.statusTimes?.Pause || 0} s</span></div>
                      <div><b>Formation</b><br /><span style={{fontSize:'11px', color:'#888'}}>{user.statusTimes?.Formation || 0} s</span></div>
                    </div>
                  ) : (
                    <span style={{color:'#888'}}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {user.currentCall && user.currentCall.client ? (
                    <span style={{color:'#1976d2', fontWeight:600}}>En appel avec {user.currentCall.client}</span>
                  ) : (
                    <span style={{color:'#888'}}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => handleDelete(user._id)}
                    style={{ 
                      backgroundColor: 'red', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Supprimer
                  </button>
                  {(user.role === 'operator' || user.role === 'admin') && (
                    <button
                      onClick={() => handleResetPassword(user._id)}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: 8
                      }}
                    >
                      Réinitialiser mot de passe
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '20px', color: '#666' }}>
        Total: {users.length} utilisateur(s)
      </div>
    </div>
  );
}

export default AdminUsers; 