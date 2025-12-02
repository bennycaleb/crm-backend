import React, { useState, useEffect } from 'react';
import { API_URL } from '../apiConfig';
import { FaPhone, FaClock, FaCheckCircle, FaTimesCircle, FaRedo, FaUser, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const OperatorLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('nouveau');

  useEffect(() => {
    const init = async () => {
      await fetchUserInfo();
      // Attendre un peu pour que currentUser soit mis à jour
      setTimeout(() => {
        fetchLeads();
      }, 500);
    };
    init();
    
    // Rafraîchissement automatique toutes les 10 secondes
    // Cela signifie que la liste des leads se met à jour automatiquement
    // pour afficher les nouveaux leads sans avoir à cliquer sur "Actualiser"
    // Exemple : Si un nouveau client remplit le formulaire sur la landing page,
    // son lead apparaîtra automatiquement dans cette liste après maximum 10 secondes
    const interval = setInterval(fetchLeads, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  // Réessayer de charger les leads quand currentUser change
  useEffect(() => {
    if (currentUser?._id) {
      fetchLeads();
    }
  }, [currentUser?._id]);

  const fetchUserInfo = async () => {
    try {
      const username = localStorage.getItem('username');
      if (!username) {
        console.warn('⚠️ Pas de username dans localStorage');
        return;
      }
      
      console.log('🔍 Recherche utilisateur avec username:', username);
      const response = await fetch(`${API_URL}/api/users`);
      const users = await response.json();
      console.log('📊 Utilisateurs récupérés:', users.length);
      
      const user = users.find(u => u.username === username);
      if (user) {
        console.log('✅ Utilisateur trouvé:', { id: user._id, username: user.username, role: user.role });
        setCurrentUser(user);
        return user; // Retourner l'utilisateur pour utilisation immédiate
      } else {
        console.warn('⚠️ Utilisateur non trouvé avec username:', username);
      }
    } catch (err) {
      console.error('❌ Erreur récupération utilisateur:', err);
    }
    return null;
  };

  const fetchLeads = async () => {
    try {
      // Si pas d'utilisateur, essayer de le récupérer d'abord
      let user = currentUser;
      if (!user?._id) {
        console.log('⏳ Utilisateur non chargé, récupération en cours...');
        user = await fetchUserInfo();
        if (!user?._id) {
          console.warn('⚠️ Impossible de récupérer l\'utilisateur, nouvelle tentative dans 1 seconde...');
          setTimeout(() => fetchLeads(), 1000);
          return;
        }
        // Mettre à jour currentUser si on vient de le récupérer
        setCurrentUser(user);
      }

      setLoading(true);
      console.log('🔍 Récupération des leads pour opérateur:', user._id);
      console.log('🌐 URL:', `${API_URL}/api/channels/operator/${user._id}/orders?status=external_pending`);
      
      const response = await fetch(`${API_URL}/api/channels/operator/${user._id}/orders?status=external_pending`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📥 Réponse API complète:', result);
      console.log('📊 Nombre de leads reçus:', result.data?.length || 0);
      
      // Filtrer selon le statut
      let filteredLeads = result.data || [];
      console.log('📊 Leads avant filtre:', filteredLeads.length);
      
      if (filterStatus !== 'tous') {
        filteredLeads = filteredLeads.filter(lead => lead.leadStatus === filterStatus);
        console.log('📊 Leads après filtre:', filteredLeads.length);
      }
      
      setLeads(filteredLeads);
      setError(null);
      
      if (filteredLeads.length === 0 && result.data?.length > 0) {
        console.log('ℹ️ Des leads existent mais sont filtrés par le statut:', filterStatus);
      }
    } catch (err) {
      console.error('❌ Erreur fetchLeads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (lead) => {
    // Afficher les infos du client dans l'interface
    setSelectedLead(lead);
    
    // Nettoyer le numéro de téléphone
    const phoneNumber = lead.clientPhone.replace(/\D/g, ''); // Enlève tout sauf les chiffres
    
    // Format du numéro pour l'appel : +33XXXXXXXXX (ajouter l'indicatif si nécessaire)
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      // Si le numéro commence par 0, remplacer par +33
      formattedNumber = '+33' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('+')) {
      // Si pas d'indicatif, ajouter +33
      formattedNumber = '+33' + phoneNumber;
    }
    
    // Essayer d'abord d'initier l'appel via l'API Ringover
    try {
      const response = await fetch(`${API_URL}/api/ringover/initiate-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          userId: currentUser?._id || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Appel initié via API Ringover');
        // Mettre à jour le statut du lead
        updateLeadStatus(lead._id, 'en_appel');
        return;
      } else {
        console.warn('⚠️ Impossible d\'initier l\'appel via API, fallback sur protocole');
      }
    } catch (apiError) {
      console.warn('⚠️ Erreur API Ringover, fallback sur protocole:', apiError);
    }
    
    // Fallback : Utiliser tel: pour ouvrir l'app téléphone
    // Sur Safari mobile, ringover:// ne fonctionne pas, donc on utilise directement tel:
    try {
      // Détecter si on est sur mobile Safari
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);
      
      if (isMobile || isSafari) {
        // Sur mobile ou Safari, utiliser directement tel: (ouvre l'app téléphone)
        // L'opérateur pourra ensuite utiliser Ringover depuis l'app téléphone
        const telUrl = `tel:${formattedNumber}`;
        window.location.href = telUrl;
        console.log('✅ Ouverture de l\'app téléphone avec:', telUrl);
        console.log('ℹ️ Utilisez Ringover depuis l\'app téléphone pour appeler');
      } else {
        // Sur desktop (non-Safari), essayer ringover://
        const ringoverUrl = `ringover://call/${formattedNumber}`;
        window.location.href = ringoverUrl;
        console.log('✅ Tentative d\'ouverture de Ringover sur desktop');
      }
    } catch (e) {
      console.error('❌ Erreur lors de l\'ouverture:', e);
      // Dernier fallback : utiliser tel:
      const telUrl = `tel:${formattedNumber}`;
      window.location.href = telUrl;
    }
    
    // Mettre à jour le statut du lead
    updateLeadStatus(lead._id, 'en_appel');
  };

  const updateLeadStatus = async (leadId, newStatus, notes = '') => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadStatus: newStatus,
          leadNotes: notes,
          assignedOperator: currentUser?._id,
          lastCallAttempt: newStatus === 'en_appel' ? new Date() : null,
          history: [{
            date: new Date().toISOString().split('T')[0],
            action: `Statut changé: ${newStatus}`,
            utilisateur: currentUser?.username || 'Opérateur'
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      fetchLeads();
      if (newStatus !== 'en_appel') {
        setSelectedLead(null);
      }
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      nouveau: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800' },
      en_appel: { label: 'En appel', color: 'bg-green-100 text-green-800' },
      rappel: { label: 'Rappel', color: 'bg-yellow-100 text-yellow-800' },
      traité: { label: 'Traité', color: 'bg-gray-100 text-gray-800' },
      refusé: { label: 'Refusé', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.nouveau;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'nouveau':
        return <FaClock className="text-blue-500" />;
      case 'en_appel':
        return <FaPhone className="text-green-500" />;
      case 'rappel':
        return <FaRedo className="text-yellow-500" />;
      case 'traité':
        return <FaCheckCircle className="text-gray-500" />;
      case 'refusé':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de vos leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
        <button
          onClick={fetchLeads}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mes Leads</h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="en_appel">En appel</option>
            <option value="rappel">Rappel</option>
            <option value="traité">Traité</option>
            <option value="refusé">Refusé</option>
          </select>
        </div>
        <p className="text-sm text-gray-600">
          {leads.length} lead{leads.length > 1 ? 's' : ''} disponible{leads.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Panel d'informations client (quand un lead est sélectionné pour appel) */}
      {selectedLead && (
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900 flex items-center">
              <FaUser className="mr-2" />
              Informations Client - Appel en cours
            </h3>
            <button
              onClick={() => setSelectedLead(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Nom complet</p>
              <p className="text-lg font-semibold text-gray-900">{selectedLead.clientName}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaPhone className="mr-2" />
                Téléphone
              </p>
              <p className="text-lg font-semibold text-gray-900">{formatPhoneNumber(selectedLead.clientPhone)}</p>
            </div>
            
            {selectedLead.email && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaEnvelope className="mr-2" />
                  Email
                </p>
                <p className="text-lg font-semibold text-gray-900">{selectedLead.email}</p>
              </div>
            )}
            
            {selectedLead.address && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  Adresse
                </p>
                <p className="text-lg font-semibold text-gray-900">{selectedLead.address}</p>
              </div>
            )}
            
            <div className="bg-white rounded-lg p-4 md:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Produit(s) demandé(s)</p>
              <div className="space-y-2">
                {selectedLead.products && selectedLead.products.length > 0 ? (
                  selectedLead.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-900">{product.name}</span>
                      {product.quantity > 1 && (
                        <span className="text-gray-600">x{product.quantity}</span>
                      )}
                      {product.price > 0 && (
                        <span className="text-gray-600">{product.price} €</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Aucun produit spécifié</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => updateLeadStatus(selectedLead._id, 'traité', 'Client contacté avec succès')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <FaCheckCircle className="mr-2" />
              Marquer comme traité
            </button>
            <button
              onClick={() => {
                const notes = prompt('Note pour le rappel:');
                if (notes) {
                  updateLeadStatus(selectedLead._id, 'rappel', notes);
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
            >
              <FaRedo className="mr-2" />
              Programmer un rappel
            </button>
            <button
              onClick={() => {
                const reason = prompt('Raison du refus:');
                if (reason) {
                  updateLeadStatus(selectedLead._id, 'refusé', reason);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            >
              <FaTimesCircle className="mr-2" />
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* Liste des leads */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaUser className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">Aucun lead disponible</p>
          <p className="text-sm text-gray-500 mt-2">
            Les nouveaux leads de vos canaux apparaîtront ici automatiquement
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const clientNameParts = lead.clientName ? lead.clientName.split(' ') : ['', ''];
            const nom = clientNameParts[0] || '';
            const prenom = clientNameParts.slice(1).join(' ') || '';
            
            return (
              <div
                key={lead._id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                  lead.leadStatus === 'nouveau' ? 'border-blue-500' :
                  lead.leadStatus === 'en_appel' ? 'border-green-500' :
                  lead.leadStatus === 'rappel' ? 'border-yellow-500' :
                  lead.leadStatus === 'traité' ? 'border-gray-500' :
                  'border-red-500'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(lead.leadStatus)}
                    {getStatusBadge(lead.leadStatus)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(lead.createdAt)}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Client</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {prenom} {nom}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Téléphone</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatPhoneNumber(lead.clientPhone)}
                  </p>
                </div>

                {lead.email && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900">{lead.email}</p>
                  </div>
                )}

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Produit</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lead.products && lead.products.length > 0
                      ? lead.products.map(p => p.name).join(', ')
                      : 'Non spécifié'}
                  </p>
                </div>

                {lead.leadNotes && (
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-xs font-medium text-gray-700">Notes</p>
                    <p className="text-xs text-gray-600">{lead.leadNotes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {lead.leadStatus !== 'en_appel' && (
                    <button
                      onClick={() => handleCall(lead)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center text-sm font-medium"
                    >
                      <FaPhone className="mr-2" />
                      Appeler
                    </button>
                  )}
                  
                  {lead.leadStatus === 'en_appel' && (
                    <div className="flex-1 space-y-2">
                      <button
                        onClick={() => updateLeadStatus(lead._id, 'traité', 'Client contacté')}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Traité
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Note:');
                          if (notes) updateLeadStatus(lead._id, 'rappel', notes);
                        }}
                        className="w-full px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                      >
                        Rappel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperatorLeads;

