import React, { useState, useEffect } from 'react';
import { API_URL } from '../apiConfig';
import { FaPhone, FaPhoneAlt, FaPhoneSlash, FaVoicemail, FaClock, FaArrowDown, FaArrowUp, FaUser, FaUserCheck, FaUserTimes, FaSync } from 'react-icons/fa';

const AdminRingoverCalls = () => {
  const [calls, setCalls] = useState([]);
  const [queue, setQueue] = useState([]); // File d'attente
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'queue', 'assigned'
  const [filters, setFilters] = useState({
    direction: '',
    event: '',
    fromNumber: '',
    toNumber: '',
    callStatus: ''
  });
  const [sortBy, setSortBy] = useState({ field: 'startTime', order: 'desc' });
  const [assigningCallId, setAssigningCallId] = useState(null);

  useEffect(() => {
    fetchCalls();
    fetchQueue();
    fetchOperators();
    
    // Rafraîchissement automatique toutes les 10 secondes
    const interval = setInterval(() => {
      fetchCalls();
      fetchQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, [filters, activeTab]);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.direction) queryParams.append('direction', filters.direction);
      if (filters.event) queryParams.append('event', filters.event);
      if (filters.fromNumber) queryParams.append('fromNumber', filters.fromNumber);
      if (filters.toNumber) queryParams.append('toNumber', filters.toNumber);
      
      const response = await fetch(`${API_URL}/api/ringover/calls?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des appels');
      }
      const result = await response.json();
      setCalls(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ringover/calls/queue`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la file d\'attente');
      }
      const result = await response.json();
      setQueue(result.data || []);
    } catch (err) {
      console.error('Erreur file d\'attente:', err);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des opérateurs');
      }
      const operatorsData = await response.json();
      // Filtrer seulement les opérateurs (role: 'operator')
      const filteredOperators = operatorsData.filter(user => user.role === 'operator');
      setOperators(filteredOperators);
    } catch (err) {
      console.error('Erreur opérateurs:', err);
    }
  };

  const assignCall = async (callId, operatorId, operatorName) => {
    try {
      setAssigningCallId(callId);
      const response = await fetch(`${API_URL}/api/ringover/calls/${callId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId,
          operatorName: operatorName || `${operators.find(op => op._id === operatorId)?.prenom || ''} ${operators.find(op => op._id === operatorId)?.nom || ''}`.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'assignation');
      }

      alert('Appel assigné avec succès !');
      fetchCalls();
      fetchQueue();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setAssigningCallId(null);
    }
  };

  const reassignCall = async (callId, operatorId, operatorName) => {
    try {
      setAssigningCallId(callId);
      const response = await fetch(`${API_URL}/api/ringover/calls/${callId}/reassign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId,
          operatorName: operatorName || `${operators.find(op => op._id === operatorId)?.prenom || ''} ${operators.find(op => op._id === operatorId)?.nom || ''}`.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réassignation');
      }

      alert('Appel réassigné avec succès !');
      fetchCalls();
      fetchQueue();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setAssigningCallId(null);
    }
  };

  const updateCallStatus = async (callId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/ringover/calls/${callId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      fetchCalls();
      fetchQueue();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
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

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getEventIcon = (event) => {
    switch (event) {
      case 'ringing':
        return <FaPhone className="text-blue-500" />;
      case 'answered':
        return <FaPhoneAlt className="text-green-500" />;
      case 'missed':
        return <FaPhoneSlash className="text-red-500" />;
      case 'voicemail':
        return <FaVoicemail className="text-orange-500" />;
      case 'hangup':
        return <FaPhoneSlash className="text-gray-500" />;
      default:
        return <FaPhone className="text-gray-500" />;
    }
  };

  const getEventLabel = (event) => {
    const labels = {
      ringing: 'Sonnerie',
      answered: 'Répondu',
      missed: 'Manqué',
      voicemail: 'Messagerie',
      hangup: 'Raccroché'
    };
    return labels[event] || event;
  };

  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En attente',
      assigné: 'Assigné',
      en_cours: 'En cours',
      terminé: 'Terminé',
      manqué: 'Manqué'
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      assigné: 'bg-blue-100 text-blue-800',
      en_cours: 'bg-green-100 text-green-800',
      terminé: 'bg-gray-100 text-gray-800',
      manqué: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getEventBadgeColor = (event) => {
    const colors = {
      ringing: 'bg-blue-100 text-blue-800',
      answered: 'bg-green-100 text-green-800',
      missed: 'bg-red-100 text-red-800',
      voicemail: 'bg-orange-100 text-orange-800',
      hangup: 'bg-gray-100 text-gray-800'
    };
    return colors[event] || 'bg-gray-100 text-gray-800';
  };

  const getDirectionLabel = (direction) => {
    return direction === 'inbound' ? 'Entrant' : 'Sortant';
  };

  // Filtrer les appels selon l'onglet actif
  const getFilteredCalls = () => {
    if (activeTab === 'queue') {
      return queue;
    } else if (activeTab === 'assigned') {
      return calls.filter(call => call.assignedOperator && call.callStatus === 'assigné');
    }
    return calls;
  };

  const filteredCalls = getFilteredCalls();

  if (loading && calls.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-md p-8 text-center">
          <FaClock className="mx-auto text-4xl text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des appels...</p>
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
            onClick={() => { fetchCalls(); fetchQueue(); }}
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
                📞 Appels Ringover
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Gestion des appels et file d'attente
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {queue.length > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {queue.length} en attente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous les appels ({calls.length})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'queue'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              File d'attente ({queue.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignés ({calls.filter(c => c.assignedOperator && c.callStatus === 'assigné').length})
            </button>
          </nav>
        </div>

        {/* Filtres */}
        {activeTab === 'all' && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  value={filters.direction}
                  onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="inbound">Entrant</option>
                  <option value="outbound">Sortant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Événement</label>
                <select
                  value={filters.event}
                  onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="ringing">Sonnerie</option>
                  <option value="answered">Répondu</option>
                  <option value="missed">Manqué</option>
                  <option value="voicemail">Messagerie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={filters.callStatus}
                  onChange={(e) => setFilters({ ...filters, callStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="en_attente">En attente</option>
                  <option value="assigné">Assigné</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminé">Terminé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro appelant</label>
                <input
                  type="text"
                  value={filters.fromNumber}
                  onChange={(e) => setFilters({ ...filters, fromNumber: e.target.value })}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro appelé</label>
                <input
                  type="text"
                  value={filters.toNumber}
                  onChange={(e) => setFilters({ ...filters, toNumber: e.target.value })}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {filteredCalls.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FaPhone className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">
              {activeTab === 'queue' 
                ? 'Aucun appel en file d\'attente' 
                : activeTab === 'assigned'
                ? 'Aucun appel assigné'
                : 'Aucun appel enregistré'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Événement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    De
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opérateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call) => (
                  <tr key={call._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(call.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        call.direction === 'inbound' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {getDirectionLabel(call.direction)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {getEventIcon(call.event)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getEventBadgeColor(call.event)}`}>
                          {getEventLabel(call.event)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPhoneNumber(call.fromNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPhoneNumber(call.toNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(call.callStatus || 'en_attente')}`}>
                        {getStatusLabel(call.callStatus || 'en_attente')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {call.assignedOperator ? (
                        <div className="flex items-center text-green-600">
                          <FaUserCheck className="mr-1" />
                          {call.assignedOperatorName || (call.assignedOperator?.prenom && call.assignedOperator?.nom 
                            ? `${call.assignedOperator.prenom} ${call.assignedOperator.nom}` 
                            : call.assignedOperator?.username || 'Opérateur')}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        {!call.assignedOperator ? (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                assignCall(call._id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            disabled={assigningCallId === call._id}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Assigner...</option>
                            {operators.map(op => (
                              <option key={op._id} value={op._id}>
                                {op.prenom} {op.nom} ({op.username})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  reassignCall(call._id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              disabled={assigningCallId === call._id}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Réassigner...</option>
                              {operators.map(op => (
                                <option key={op._id} value={op._id}>
                                  {op.prenom} {op.nom} ({op.username})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => updateCallStatus(call._id, 'en_attente')}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                              title="Libérer l'appel"
                            >
                              <FaSync />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRingoverCalls;

