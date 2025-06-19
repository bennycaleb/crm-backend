import React, { useState, useEffect, useRef } from 'react';
import './CRM.css';

const statusList = [
  { label: 'Connecté', color: '#4caf50', max: 72000 }, // 20h
  { label: 'Hors ligne', color: '#bdbdbd' },
  { label: 'Pause', color: '#ffb300', max: 5400 }, // 1h30
  { label: 'Formation', color: '#1976d2' }
];

const callStatusList = [
  'Appel sans réponse',
  'Rappel',
  'Validation',
  'Refus',
  'Poubelle'
];

const tabs = [
  'Principal',
  'Demandes',
  'Contacts supplémentaires',
  'Panier'
];

function getRandomDeliveryDate() {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * 2) + 2; // 2 ou 3 jours
  const delivery = new Date(now);
  delivery.setDate(now.getDate() + daysToAdd);
  return delivery.toISOString().split('T')[0];
}

function getMinDeliveryDate() {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  return now.toISOString().split('T')[0];
}

function getMaxDeliveryDate() {
  const now = new Date();
  let added = 0;
  while (added < 5) {
    now.setDate(now.getDate() + 1);
    // 0 = dimanche, 6 = samedi
    if (now.getDay() !== 0 && now.getDay() !== 6) {
      added++;
    }
  }
  return now.toISOString().split('T')[0];
}

function CRM() {
  // Onglets
  const [activeTab, setActiveTab] = useState('Principal');
  // Statut opérateur
  const [status, setStatus] = useState('Connecté');
  // Chronomètres pour chaque statut
  const [statusTimes, setStatusTimes] = useState({
    'Connecté': 0,
    'Hors ligne': 0,
    'Pause': 0,
    'Formation': 0
  });
  const statusTimerRef = useRef();
  // Appel
  const [callState, setCallState] = useState('ringing'); // 'ringing', 'in-call', 'ended'
  const [callSeconds, setCallSeconds] = useState(0);
  const callTimerRef = useRef();
  // Formulaire
  const [callStatus, setCallStatus] = useState(callStatusList[0]);
  const [client, setClient] = useState({ name: '', phone: '06 12 34 56 78' });
  const [address, setAddress] = useState({
    rue: '', numero: '', codePostal: '', ville: '',
    region: '', appartement: '', etage: '', entree: ''
  });
  const [cart, setCart] = useState([
    { produit: '', prix: '', quantite: '', frais: '', tva: '' }
  ]);
  const [orderSaved, setOrderSaved] = useState(false);
  // Timer de traitement
  const [showTreatmentTimer, setShowTreatmentTimer] = useState(false);
  const [treatmentSeconds, setTreatmentSeconds] = useState(0);
  const treatmentTimerRef = useRef();
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recallDate, setRecallDate] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [trashReason, setTrashReason] = useState('');
  const [formError, setFormError] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  // Liste des commandes
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Charger les commandes depuis l'API
  useEffect(() => {
    async function fetchOrders() {
      setLoadingOrders(true);
      setApiError(null);
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('API non disponible');
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        setApiError('Impossible de contacter le serveur des commandes. Vérifiez que le backend est bien lancé.');
      }
      setLoadingOrders(false);
    }
    fetchOrders();

    // Rafraîchir les commandes toutes les 30 secondes
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chronomètre statut
  useEffect(() => {
    clearInterval(statusTimerRef.current);
    statusTimerRef.current = setInterval(() => {
      setStatusTimes(times => ({
        ...times,
        [status]: times[status] + 1
      }));
    }, 1000);
    return () => clearInterval(statusTimerRef.current);
  }, [status]);

  // Chronomètre appel
  useEffect(() => {
    if (callState === 'in-call') {
      callTimerRef.current = setInterval(() => {
        setCallSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallSeconds(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState]);

  // Timer de traitement : démarre après raccrochage
  useEffect(() => {
    if (callState === 'ended') {
      setShowTreatmentTimer(true);
      setTreatmentSeconds(0);
      treatmentTimerRef.current = setInterval(() => {
        setTreatmentSeconds(s => s + 1);
      }, 1000);
    } else {
      setShowTreatmentTimer(false);
      setTreatmentSeconds(0);
      clearInterval(treatmentTimerRef.current);
    }
    return () => clearInterval(treatmentTimerRef.current);
  }, [callState]);

  // Arrêt du timer de traitement après enregistrement
  useEffect(() => {
    if (orderSaved) {
      setShowTreatmentTimer(false);
      setTreatmentSeconds(0);
      clearInterval(treatmentTimerRef.current);
    }
  }, [orderSaved]);

  // Quand le statut change, si Validation, génère la date de livraison
  useEffect(() => {
    if (callStatus === 'Validation') {
      setDateLivraison(getRandomDeliveryDate());
    } else {
      setDateLivraison('');
    }
  }, [callStatus]);

  // Quand le statut change, reset la date de livraison si pas Validation
  useEffect(() => {
    if (callStatus !== 'Validation') {
      setDateLivraison('');
    }
  }, [callStatus]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };
  const formatTimeHMS = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  // Ajout d'une ligne au panier
  const addCartLine = () => {
    setCart([...cart, { produit: '', prix: '', quantite: '', frais: '', tva: '' }]);
  };
  // Modification d'une ligne du panier
  const updateCartLine = (idx, field, value) => {
    const newCart = cart.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setCart(newCart);
  };
  // Déconnexion
  const handleLogout = () => {
    window.location.href = '/';
  };
  // Enregistrer la commande
  const handleSaveOrder = async (e) => {
    e.preventDefault();
    setFormError('');
    if (callStatus === 'Validation' && !dateLivraison) {
      setFormError('Veuillez choisir la date de livraison.');
      return;
    }
    // Validation selon le statut
    if (callStatus === 'Rappel') {
      if (!recallDate) {
        setFormError('Veuillez choisir la date et l\'heure du rappel.');
        return;
      }
      // Vérifier que la date est dans les 3 jours
      const now = new Date();
      const recall = new Date(recallDate);
      const diff = (recall - now) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 3) {
        setFormError('La date de rappel doit être dans les 3 jours à venir.');
        return;
      }
    }
    if (callStatus === 'Refus' && !refusalReason.trim()) {
      setFormError('Veuillez indiquer la raison du refus.');
      return;
    }
    if (callStatus === 'Poubelle' && !trashReason.trim()) {
      setFormError('Veuillez indiquer la raison pour la poubelle.');
      return;
    }

    // Générer un ID unique pour la commande
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    const orderId = `CMD${timestamp}${random}`;

    // Construction de la commande à envoyer à l'admin
    const orderToSend = {
      id: orderId,
      nom: client.name.split(' ')[0] || '',
      prenom: client.name.split(' ').slice(1).join(' ') || '',
      phone: client.phone,
      adresse: Object.values(address).filter(Boolean).join(', '),
      date: dateLivraison || new Date().toISOString().split('T')[0],
      produit: cart[0]?.produit || '',
      quantite: parseInt(cart[0]?.quantite) || 1,
      prix: parseFloat(cart[0]?.prix) || 0,
      statut: callStatus === 'Validation' ? 'Validée' : 'En attente',
      logistique: false,
      operateur: 'Opérateur', // Ajout de l'opérateur
      canal: 'Téléphone', // Ajout du canal
      historique: [
        {
          date: new Date().toISOString().split('T')[0],
          action: 'Création',
          utilisateur: 'Opérateur'
        }
      ]
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement de la commande');
      }

      const savedOrder = await response.json();
      setOrders(prevOrders => [...prevOrders, savedOrder]);
      setOrderSaved(true);
      setFormError(''); // Réinitialiser les erreurs
      setTimeout(() => setOrderSaved(false), 2000);
      setCallState('ringing'); // relance un appel
      setRecallDate('');
      setRefusalReason('');
      setTrashReason('');
      setDateLivraison('');
      
      // Réinitialiser le panier
      setCart([{ produit: '', prix: '', quantite: '', frais: '', tva: '' }]);
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setFormError(err.message || 'Erreur lors de l\'enregistrement de la commande. Veuillez réessayer.');
    }
  };

  // Fonction de recherche d'adresse
  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setAddressSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error);
      setAddressSuggestions([]);
    }
  };

  // Sélection d'une adresse
  const selectAddress = (feature) => {
    const properties = feature.properties;
    setAddress({
      ...address,
      numero: properties.housenumber || '',
      rue: properties.street || '',
      codePostal: properties.postcode || '',
      ville: properties.city || '',
      region: properties.context || ''
    });
    setSearchQuery(`${properties.housenumber || ''} ${properties.street || ''}, ${properties.postcode || ''} ${properties.city || ''}`);
    setShowSuggestions(false);
  };

  return (
    <div className="crm-legacy-container">
      {/* Onglets + Déconnexion */}
      <div className="crm-header-bar">
        <div className="crm-tabs">
          {tabs.map(tab => (
            <div
              key={tab}
              className={`crm-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
        <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
      </div>
      <div className="crm-brand">
        <span className="crm-brand-main">C-<span className="crm-brand-accent">INNOVATECH</span> Solutions</span>
      </div>
      <div className="crm-legacy-content">
        {activeTab === 'Panier' ? (
          <div style={{maxWidth: 950, margin: '0 auto', textAlign:'left', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'32px 28px 24px 28px', border:'1.5px solid #e0e0e0'}}>
            <h2 style={{fontWeight:800, fontSize:'1.6rem', marginBottom:32, textAlign:'center', letterSpacing:1}}>Mes commandes</h2>
            {apiError && (
              <div style={{color:'#e53935', marginBottom:16, padding:12, background:'#ffebee', borderRadius:8, border:'1px solid #ffcdd2'}}>
                {apiError}
              </div>
            )}
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:'0.99rem', background:'#fff', borderRadius:10}}>
                <thead>
                  <tr style={{background:'#f7f8fa'}}>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>ID</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Client</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Produit</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Date</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{padding:'12px 8px'}}>{order.id}</td>
                      <td style={{padding:'12px 8px'}}>{order.nom} {order.prenom}</td>
                      <td style={{padding:'12px 8px'}}>{order.produit}</td>
                      <td style={{padding:'12px 8px'}}>{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                      <td style={{padding:'12px 8px'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          background: 
                            order.statut === 'En attente' ? '#fff3e0' :
                            order.statut === 'Validée' ? '#e8f5e9' :
                            order.statut === 'Expédiée' ? '#e3f2fd' :
                            order.statut === 'Livrée' ? '#f3e5f5' :
                            '#ffebee',
                          color: 
                            order.statut === 'En attente' ? '#e65100' :
                            order.statut === 'Validée' ? '#2e7d32' :
                            order.statut === 'Expédiée' ? '#1565c0' :
                            order.statut === 'Livrée' ? '#6a1b9a' :
                            '#c62828'
                        }}>
                          {order.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Colonne de gauche */}
            <div style={{minWidth: 320, maxWidth: 340, marginRight: 32}}>
              {/* Bloc appel */}
              <div className="phonecall-box">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize: '2rem', color:'#e53935'}}>⏰</span>
                  <span style={{fontWeight:'bold',color:'#e53935'}}>Appel entrant...</span>
                </div>
                {callState === 'ringing' && (
                  <div style={{marginTop:12,display:'flex',gap:12}}>
                    <button className="btn-phonecall green big" onClick={() => setCallState('in-call')}>Décrocher</button>
                    <button className="btn-phonecall red big" onClick={() => setCallState('ended')}>Raccrocher</button>
                  </div>
                )}
                {callState === 'in-call' && (
                  <div style={{marginTop:12}}>
                    <span className="phonecall-inprogress-label">En appel…</span>
                    <span className="phonecall-timer">{formatTime(callSeconds)}</span>
                    <button className="btn-phonecall red big" style={{marginLeft:18}} onClick={() => setCallState('ended')}>Raccrocher</button>
                  </div>
                )}
                {callState === 'ended' && (
                  <div style={{marginTop:12}}>
                    <span className="phonecall-ended">Appel terminé</span>
                    <button className="btn-newcall" style={{marginLeft:18}} onClick={() => setCallState('ringing')}>Simuler un appel</button>
                  </div>
                )}
              </div>
              {/* Contrôle */}
              <div className="crm-controls-block-belowcall">
                <div className="crm-section-title">Contrôle</div>
                <div className="crm-controls">
                  {statusList.map(s => {
                    const time = statusTimes[s.label] || 0;
                    const isCurrent = status === s.label;
                    const isLate = s.max && time >= s.max;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        className={`btn-control ${s.label.normalize('NFD').replace(/[ -\u036f]/g, '').toLowerCase().replace(/ /g, '')}${isCurrent ? ' selected' : ''}`}
                        onClick={() => setStatus(s.label)}
                      >
                        {s.label}
                        <span className={`status-timer${isLate ? ' late' : ''}`}>{formatTimeHMS(time)}</span>
                        {isLate && s.label === 'Pause' && <span className="status-warning">⏰ max 1h30 !</span>}
                        {isLate && s.label === 'Connecté' && <span className="status-warning">⏰ max 20h !</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Colonne de droite : Formulaire */}
            <form className="crm-form" onSubmit={handleSaveOrder}>
              <div className="crm-section-flex">
                <div className="crm-section-block">
                  <div className="crm-section-title">Informations client</div>
                  <div className="crm-grid-2">
                    <div className="crm-field">
                      <label>Nom et prénom</label>
                      <input type="text" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} />
                    </div>
                    <div className="crm-field">
                      <label>Numéro de téléphone</label>
                      <input type="text" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="crm-section-block">
                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
                  <div className="crm-section-title" style={{marginBottom: 0}}>Adresse de livraison</div>
                  <div className="crm-field" style={{ minWidth: 220, width: 280, marginBottom: 0, position: 'relative' }}>
                    <label style={{display:'none'}}>Rechercher une adresse</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchAddress(e.target.value);
                      }}
                      placeholder="Rechercher une adresse..."
                      style={{ width: '100%' }}
                    />
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="address-suggestions">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => selectAddress(suggestion)}
                          >
                            {suggestion.properties.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="crm-grid-4">
                  <div className="crm-field">
                    <label>Rue</label>
                    <input type="text" value={address.rue} readOnly />
                  </div>
                  <div className="crm-field">
                    <label>Numéro</label>
                    <input type="text" value={address.numero} readOnly />
                  </div>
                  <div className="crm-field">
                    <label>Code postal</label>
                    <input type="text" value={address.codePostal} readOnly />
                  </div>
                  <div className="crm-field">
                    <label>Ville</label>
                    <input type="text" value={address.ville} readOnly />
                  </div>
                </div>
                <div className="crm-grid-3">
                  <div className="crm-field">
                    <label>Région</label>
                    <input type="text" value={address.region} onChange={e => setAddress({ ...address, region: e.target.value })} />
                  </div>
                  <div className="crm-field">
                    <label>Appartement</label>
                    <input type="text" value={address.appartement} onChange={e => setAddress({ ...address, appartement: e.target.value })} />
                  </div>
                  <div className="crm-field">
                    <label>Entrée</label>
                    <input type="text" value={address.entree} onChange={e => setAddress({ ...address, entree: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="crm-section-block">
                <div className="crm-section-title">Statut après l'appel</div>
                <div className="crm-field" style={{maxWidth: '300px'}}>
                  <select value={callStatus} onChange={e => setCallStatus(e.target.value)}>
                    {callStatusList.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {/* Champs dynamiques selon le statut */}
                {callStatus === 'Rappel' && (
                  <div className="crm-field" style={{maxWidth: 320}}>
                    <label>Date et heure du rappel (dans les 3 jours)</label>
                    <input
                      type="datetime-local"
                      value={recallDate}
                      min={new Date().toISOString().slice(0,16)}
                      max={(() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 3);
                        return d.toISOString().slice(0,16);
                      })()}
                      onChange={e => setRecallDate(e.target.value)}
                    />
                  </div>
                )}
                {callStatus === 'Refus' && (
                  <div className="crm-field" style={{maxWidth: 320}}>
                    <label>Raison du refus</label>
                    <input
                      type="text"
                      value={refusalReason}
                      onChange={e => setRefusalReason(e.target.value)}
                      placeholder="Indiquez la raison du refus"
                    />
                  </div>
                )}
                {callStatus === 'Poubelle' && (
                  <div className="crm-field" style={{maxWidth: 320}}>
                    <label>Raison pour la poubelle</label>
                    <input
                      type="text"
                      value={trashReason}
                      onChange={e => setTrashReason(e.target.value)}
                      placeholder="Indiquez la raison"
                    />
                  </div>
                )}
                {callStatus === 'Validation' && (
                  <div className="crm-field" style={{maxWidth: 320}}>
                    <label>Date de livraison prévue</label>
                    <input type="date" value={dateLivraison} min={getMinDeliveryDate()} max={getMaxDeliveryDate()} onChange={e => setDateLivraison(e.target.value)} required />
                  </div>
                )}
                {formError && <div style={{color:'#e53935',marginTop:8,fontWeight:600}}>{formError}</div>}
              </div>
              <div className="crm-section-block">
                <div className="crm-section-title">Panier</div>
                <div className="crm-grid-5">
                  {cart.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div className="crm-field">
                        <label>Nom de produit</label>
                        <input type="text" value={item.produit} onChange={e => updateCartLine(idx, 'produit', e.target.value)} />
                      </div>
                      <div className="crm-field">
                        <label>Prix</label>
                        <input type="number" value={item.prix} onChange={e => updateCartLine(idx, 'prix', e.target.value)} />
                      </div>
                      <div className="crm-field">
                        <label>Quantité</label>
                        <input type="number" value={item.quantite} onChange={e => updateCartLine(idx, 'quantite', e.target.value)} />
                      </div>
                      <div className="crm-field">
                        <label>Frais de livraison</label>
                        <input type="number" value={item.frais} onChange={e => updateCartLine(idx, 'frais', e.target.value)} />
                      </div>
                      <div className="crm-field">
                        <label>TVA</label>
                        <input type="number" value={item.tva} onChange={e => updateCartLine(idx, 'tva', e.target.value)} />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <button type="button" className="crm-btn-add" onClick={addCartLine}>Ajouter un produit</button>
              </div>
              {showTreatmentTimer && (
                <div className="treatment-timer-block">
                  <span className="treatment-timer-label">Temps de traitement de la commande :</span>
                  <span className={`treatment-timer-value${treatmentSeconds >= 600 ? ' late' : ''}`}>{formatTime(treatmentSeconds)}</span>
                  {treatmentSeconds >= 600 && <span className="treatment-timer-warning">⏰ Dépassement !</span>}
                </div>
              )}
              <div className="crm-section-block" style={{textAlign:'center', marginTop: 18}}>
                <button type="submit" className="btn-save-order">Enregistrer la commande</button>
                {orderSaved && <span className="order-saved-msg">Commande enregistrée !</span>}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default CRM;
