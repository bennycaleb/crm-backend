import React, { useState, useEffect } from 'react';
import { API_URL } from '../apiConfig';

const AdminExternalOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commandes');
      }
      const data = await response.json();
      // Filtrer seulement les commandes externes en attente
      const externalOrders = data.filter(order => order.status === 'external_pending');
      setOrders(externalOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignToOperator = async (orderId, operatorName) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'pending',
          operator: operatorName,
          history: [{
            date: new Date().toISOString().split('T')[0],
            action: `Assignée à l'opérateur ${operatorName}`,
            utilisateur: 'Admin'
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'assignation');
      }

      // Rafraîchir la liste
      fetchOrders();
      alert(`Commande assignée à ${operatorName} avec succès !`);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const rejectOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'refused',
          history: [{
            date: new Date().toISOString().split('T')[0],
            action: 'Refusée par l\'admin',
            utilisateur: 'Admin'
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du refus');
      }

      // Rafraîchir la liste
      fetchOrders();
      alert('Commande refusée avec succès !');
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Commandes externes à traiter
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Commandes reçues depuis les sites partenaires en attente de traitement
          </p>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune commande externe en attente</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Commande #{order._id.slice(-6)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Client: {order.clientName} - {order.clientPhone}
                        </p>
                        <p className="text-sm text-gray-500">
                          Source: {order.channel || 'Externe'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Date: {formatDate(order.createdAt)}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">
                            Produits:
                          </p>
                          <ul className="mt-1 space-y-1">
                            {order.products.map((product, index) => (
                              <li key={index} className="text-sm text-gray-600">
                                • {product.name} - Quantité: {product.quantity} - Prix: {product.price}€
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          Total: {order.totalAmount}€
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          En attente de traitement
                        </span>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const operator = prompt('Entrez le nom de l\'opérateur:');
                              if (operator) {
                                assignToOperator(order._id, operator);
                              }
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Assigner à un opérateur
                          </button>
                          <button
                            onClick={() => rejectOrder(order._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminExternalOrders; 