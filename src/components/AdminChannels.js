import React, { useState, useEffect } from 'react';
import { API_URL } from '../apiConfig';
import { FaUsers, FaUserPlus, FaUserMinus, FaCheckCircle, FaTimesCircle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const AdminChannels = () => {
  const [channels, setChannels] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [newChannel, setNewChannel] = useState({
    name: '',
    productName: '',
    description: ''
  });
  const [assigningOperator, setAssigningOperator] = useState(null);

  useEffect(() => {
    fetchChannels();
    fetchOperators();
    
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchChannels();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/channels`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des canaux');
      }
      const result = await response.json();
      setChannels(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des opérateurs');
      }
      const operatorsData = await response.json();
      const filteredOperators = operatorsData.filter(user => user.role === 'operator');
      setOperators(filteredOperators);
    } catch (err) {
      console.error('Erreur opérateurs:', err);
    }
  };

  const createChannel = async () => {
    try {
      if (!newChannel.name || !newChannel.productName) {
        alert('Veuillez remplir le nom et le nom du produit');
        return;
      }

      const response = await fetch(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChannel),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du canal');
      }

      alert('Canal créé avec succès !');
      setShowAddChannel(false);
      setNewChannel({ name: '', productName: '', description: '' });
      fetchChannels();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const assignOperator = async (channelId, operatorId) => {
    try {
      setAssigningOperator(`${channelId}-${operatorId}`);
      const response = await fetch(`${API_URL}/api/channels/${channelId}/assign-operator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operatorId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'assignation');
      }

      alert('Opérateur assigné avec succès !');
      fetchChannels();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setAssigningOperator(null);
    }
  };

  const removeOperator = async (channelId, operatorId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet opérateur du canal ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/channels/${channelId}/remove-operator/${operatorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du retrait de l\'opérateur');
      }

      alert('Opérateur retiré avec succès !');
      fetchChannels();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const toggleChannelStatus = async (channelId, isActive) => {
    try {
      const response = await fetch(`${API_URL}/api/channels/${channelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      fetchChannels();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  if (loading && channels.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des canaux...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Erreur: {error}</p>
          <button
            onClick={fetchChannels}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                📡 Gestion des Canaux
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Configurez les canaux par produit et assignez les opérateurs. Les commandes de landing page seront automatiquement routées vers le canal correspondant.
              </p>
            </div>
            <button
              onClick={() => setShowAddChannel(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
            >
              <FaUserPlus className="mr-2" />
              Créer un canal
            </button>
          </div>
        </div>

        {/* Formulaire de création de canal */}
        {showAddChannel && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du canal *
                </label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="Ex: Canal Produit A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit * (doit correspondre au nom dans les commandes)
                </label>
                <input
                  type="text"
                  value={newChannel.productName}
                  onChange={(e) => setNewChannel({ ...newChannel, productName: e.target.value })}
                  placeholder="Ex: Produit A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                  placeholder="Description du canal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddChannel(false);
                  setNewChannel({ name: '', productName: '', description: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={createChannel}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </div>
        )}

        {/* Liste des canaux */}
        {channels.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FaUsers className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">Aucun canal configuré</p>
            <p className="text-sm text-gray-500 mt-2">
              Créez votre premier canal pour commencer
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {channels.map((channel) => {
              const activeOperators = channel.assignedOperators.filter(op => op.isActive);
              const availableOperators = operators.filter(op => 
                !activeOperators.some(active => active.operatorId._id === op._id)
              );

              return (
                <div key={channel._id} className="px-4 py-5 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {channel.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          channel.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {channel.isActive ? 'Actif' : 'Inactif'}
                        </span>
                        <button
                          onClick={() => toggleChannelStatus(channel._id, channel.isActive)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {channel.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Produit: <span className="font-medium">{channel.productName}</span>
                      </p>
                      {channel.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {channel.description}
                        </p>
                      )}
                      
                      {/* Statistiques */}
                      <div className="mt-3 flex space-x-4 text-sm">
                        <span className="text-gray-600">
                          Total: <span className="font-medium">{channel.stats.totalOrders}</span>
                        </span>
                        <span className="text-yellow-600">
                          En attente: <span className="font-medium">{channel.stats.pendingOrders}</span>
                        </span>
                        <span className="text-green-600">
                          Terminées: <span className="font-medium">{channel.stats.completedOrders}</span>
                        </span>
                      </div>

                      {/* Opérateurs assignés */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700">
                            Opérateurs assignés ({activeOperators.length})
                          </h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeOperators.map((assignment) => {
                            const operator = assignment.operatorId;
                            return (
                              <div
                                key={assignment.operatorId._id}
                                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                <FaUsers className="text-xs" />
                                <span>
                                  {operator?.prenom || ''} {operator?.nom || ''} ({operator?.username || ''})
                                </span>
                                <button
                                  onClick={() => removeOperator(channel._id, operator._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Retirer l'opérateur"
                                >
                                  <FaUserMinus className="text-xs" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Ajouter un opérateur */}
                        {availableOperators.length > 0 && (
                          <div className="mt-3">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignOperator(channel._id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              disabled={assigningOperator?.startsWith(channel._id)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Ajouter un opérateur...</option>
                              {availableOperators.map(op => (
                                <option key={op._id} value={op._id}>
                                  {op.prenom} {op.nom} ({op.username})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChannels;

