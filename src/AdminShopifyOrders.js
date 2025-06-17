import React, { useEffect, useState } from 'react';

function AdminShopifyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sendingId, setSendingId] = useState(null);

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

  return (
    <div style={{ padding: 24 }}>
      <h2>Commandes Shopify reçues</h2>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <ul>
        {orders.map(order => (
          <li key={order.shopifyOrderId} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
            <strong>ID Shopify:</strong> {order.shopifyOrderId}<br />
            <strong>Date:</strong> {new Date(order.dateReception).toLocaleString()}<br />
            <details>
              <summary>Détails bruts</summary>
              <pre style={{ background: '#f8f8f8', padding: 8 }}>{JSON.stringify(order.data, null, 2)}</pre>
            </details>
            <button
              onClick={() => handleSendToGlnet(order.shopifyOrderId)}
              disabled={sendingId === order.shopifyOrderId}
              style={{ marginTop: 8, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
            >
              {sendingId === order.shopifyOrderId ? 'Envoi en cours...' : 'Envoyer à gl-net'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminShopifyOrders; 