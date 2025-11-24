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
            📱 Commandes Landing Page
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Commandes reçues depuis vos landing pages. Les clients ont rempli le formulaire et attendent votre appel.
          </p>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune commande de landing page en attente</p>
            <p className="text-sm text-gray-400 mt-2">Les nouvelles commandes apparaîtront ici automatiquement</p>
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
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Client:</p>
                            <p className="text-sm text-gray-600">{order.clientName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Téléphone:</p>
                            <p className="text-sm text-gray-600">{order.clientPhone}</p>
                          </div>
                          {order.email && (
                            <div>
                              <p className="text-sm font-medium text-gray-900">Email:</p>
                              <p className="text-sm text-gray-600">{order.email}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">Source:</p>
                            <p className="text-sm text-gray-600">{order.channel || 'Landing Page'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Date:</p>
                            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                          </div>
                          {order.address && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-900">Adresse:</p>
                              <p className="text-sm text-gray-600">{order.address}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-bold text-gray-900 mb-2">
                            📦 Produit(s) demandé(s):
                          </p>
                          <ul className="space-y-2">
                            {order.products && order.products.length > 0 ? (
                              order.products.map((product, index) => (
                                <li key={index} className="text-sm bg-white p-2 rounded border border-gray-200">
                                  <span className="font-semibold text-gray-900">{product.name || 'Produit non spécifié'}</span>
                                  {product.quantity > 0 && (
                                    <span className="text-gray-600 ml-2">× {product.quantity}</span>
                                  )}
                                  {product.price > 0 && (
                                    <span className="text-gray-600 ml-2">- {product.price}€</span>
                                  )}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-500 italic">Aucun produit spécifié</li>
                            )}
                          </ul>
                          {order.totalAmount > 0 && (
                            <p className="text-sm font-bold text-gray-900 mt-3 pt-2 border-t border-gray-300">
                              Total: {order.totalAmount}€
                            </p>
                          )}
                        </div>
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