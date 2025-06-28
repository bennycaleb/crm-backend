import React, { useState, useEffect } from 'react';
import { API_URL } from '../apiConfig';

const OperatorOrders = () => {
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
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      // Mettre à jour la liste des commandes
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      alert(`Statut mis à jour: ${newStatus}`);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      validated: { text: 'Validée', color: 'bg-green-100 text-green-800' },
      refused: { text: 'Refusée', color: 'bg-red-100 text-red-800' },
      no_answer: { text: 'Pas de réponse', color: 'bg-gray-100 text-gray-800' },
      sent_to_glnet: { text: 'Envoyée à gl-net', color: 'bg-blue-100 text-blue-800' },
      delivered: { text: 'Livrée', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getStatusActions = (order) => {
    if (order.status === 'pending') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => updateOrderStatus(order._id, 'validated')}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Valider
          </button>
          <button
            onClick={() => updateOrderStatus(order._id, 'refused')}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Refuser
          </button>
          <button
            onClick={() => updateOrderStatus(order._id, 'no_answer')}
            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            Pas de réponse
          </button>
        </div>
      );
    }
    return null;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Commandes</h2>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune commande pour le moment</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                        {getStatusBadge(order.status)}
                        {getStatusActions(order)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OperatorOrders; 