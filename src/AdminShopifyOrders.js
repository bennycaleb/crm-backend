import React, { useEffect, useState } from 'react';

function AdminShopifyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [sendingToOperatorId, setSendingToOperatorId] = useState(null);

  useEffect(() => {
    fetch('/api/shopify/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des commandes');
        setLoading(false);
      });
  }, []);

  const handleSendToGlnet = async (orderId) => {
    console.log('=== DÉBUT DE L\'ENVOI À GLNET ===');
    console.log('Commande ID:', orderId);
    setSendingId(orderId);
    setSuccessMsg('');
    setError('');
    
    try {
      const url = `http://localhost:5001/api/shopify/send-to-glnet/${orderId}`;
      console.log('URL de la requête:', url);
      
      const response = await fetch(url, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('Status de la réponse:', response.status);
      console.log('Headers de la réponse:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Données reçues:', data);
      
      if (response.ok) {
        setSuccessMsg(data.message);
        console.log('Succès:', data);
      } else {
        const errorMsg = data.error || 'Erreur lors de l\'envoi à gl-net';
        setError(errorMsg);
        console.error('Erreur:', errorMsg);
      }
    } catch (e) {
      console.error('Exception lors de l\'envoi:', e);
      setError('Erreur lors de l\'envoi à gl-net: ' + e.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleSendToOperator = async (orderId) => {
    console.log('=== DÉBUT DE L\'ENVOI À L\'OPÉRATEUR ===');
    console.log('Commande ID:', orderId);
    setSendingToOperatorId(orderId);
    setSuccessMsg('');
    setError('');
    
    try {
      // Récupérer les détails de la commande Shopify
      const order = orders.find(o => o.shopifyOrderId === orderId);
      if (!order) {
        throw new Error('Commande non trouvée');
      }

      // Convertir la commande Shopify en format standard
      const shopifyData = order.data;
      const customer = shopifyData.customer || {};
      const shippingAddress = shopifyData.shipping_address || {};
      const lineItems = shopifyData.line_items || [];

      // Créer une nouvelle commande dans le système
      const newOrder = {
        clientName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        clientPhone: shippingAddress.phone || customer.phone || '0000000000',
        products: lineItems.map(item => ({
          name: item.title || 'Produit',
          quantity: item.quantity || 1,
          price: parseFloat(item.price) || 0
        })),
        totalAmount: parseFloat(shopifyData.total_price) || 0,
        status: 'pending',
        address: `${shippingAddress.address1 || ''} ${shippingAddress.address2 || ''} ${shippingAddress.city || ''} ${shippingAddress.zip || ''}`.trim(),
        deliveryDate: new Date().toISOString().split('T')[0],
        operator: '', // Sera assigné automatiquement
        channel: 'shopify',
        history: [{
          date: new Date().toISOString().split('T')[0],
          action: 'Importée depuis Shopify',
          utilisateur: 'Admin'
        }],
        logistics: false,
        orderId: `SHOPIFY-${orderId}`
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder)
      });

      if (response.ok) {
        setSuccessMsg(`Commande ${orderId} envoyée aux opérateurs avec succès !`);
        console.log('Commande envoyée aux opérateurs:', newOrder);
        
        // Optionnel : supprimer la commande Shopify après envoi
        // await fetch(`/api/shopify/orders/${orderId}`, { method: 'DELETE' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi aux opérateurs');
      }
    } catch (e) {
      console.error('Exception lors de l\'envoi aux opérateurs:', e);
      setError('Erreur lors de l\'envoi aux opérateurs: ' + e.message);
    } finally {
      setSendingToOperatorId(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Commandes à traiter</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>Commandes reçues depuis les sites web partenaires</p>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <ul>
        {orders.map(order => (
          <li key={order.shopifyOrderId} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
            <strong>ID Commande:</strong> {order.shopifyOrderId}<br />
            <strong>Date:</strong> {new Date(order.dateReception).toLocaleString()}<br />
            <details>
              <summary>Détails de la commande</summary>
              <pre style={{ background: '#f8f8f8', padding: 8 }}>{JSON.stringify(order.data, null, 2)}</pre>
            </details>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleSendToOperator(order.shopifyOrderId)}
                disabled={sendingToOperatorId === order.shopifyOrderId}
                style={{ background: '#43a047', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
              >
                {sendingToOperatorId === order.shopifyOrderId ? 'Envoi en cours...' : 'Envoyer'}
              </button>
              <button
                onClick={() => handleSendToGlnet(order.shopifyOrderId)}
                disabled={sendingId === order.shopifyOrderId}
                style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
              >
                {sendingId === order.shopifyOrderId ? 'Envoi en cours...' : 'Envoyer à gl-net'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminShopifyOrders; 