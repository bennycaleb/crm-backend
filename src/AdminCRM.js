import React, { useState, useEffect } from 'react';
import { FaUserCheck, FaUserTimes, FaClock, FaChartBar, FaBoxOpen, FaSearch, FaUserPlus, FaUserMinus, FaUserShield, FaClipboardList, FaTruck, FaFileExport, FaKey, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { DatePicker } from 'antd';
import 'antd/dist/reset.css';
import moment from 'moment';
import AdminShopifyOrders from './AdminShopifyOrders';

const tabs = [
  { label: 'Statistiques' },
  { label: 'Commandes' },
  { label: 'Commandes Shopify' },
  { label: 'Recherché' },
  { label: 'Vendeurs' },
  { label: 'Demandes d\'inscription' }
];

const initialOrders = [
  {
    id: 'CMD001',
    client: 'Jean Dupont',
    phone: '0612345678',
    produits: 'Produit A, Produit B',
    quantite: 2,
    montant: 120,
    statut: 'En attente',
    date: '2024-06-10',
    operateur: 'Alice',
    canal: 'Appel entrant',
    adresse: '25 rue Pelleport, 33800 Bordeaux',
    remarques: 'Livraison urgente',
    historique: 'Créée le 2024-06-10, Validée le 2024-06-10 par Alice'
  },
  {
    id: 'CMD002',
    client: 'Marie Martin',
    phone: '0622334455',
    produits: 'Produit C',
    quantite: 1,
    montant: 80,
    statut: 'Validée',
    date: '2024-06-09',
    operateur: 'Bob',
    canal: 'Formulaire web',
    adresse: '10 avenue de Paris, 75000 Paris',
    remarques: '',
    historique: 'Créée le 2024-06-09, Validée le 2024-06-09 par Bob'
  }
];

const COLORS = ['#1976d2', '#e53935', '#43a047', '#ffb300', '#6a1b9a', '#00bcd4', '#8bc34a', '#f44336'];

function AdminCRM() {
  const [activeTab, setActiveTab] = useState('Statistiques');
  const [orders, setOrders] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    nom: '',
    prenom: '',
    phone: '',
    adresse: '',
    produit: '',
    quantite: 1,
    prix: 0,
    statut: 'En attente',
    date: new Date().toISOString().split('T')[0]
  });
  const [editIndex, setEditIndex] = useState(null);
  const [filters, setFilters] = useState({
    client: '',
    phone: '',
    id: '',
    dateStart: '',
    dateEnd: '',
    statut: '',
    produit: '',
    operateur: '',
    canal: ''
  });
  const [statsPeriod, setStatsPeriod] = useState('Mois');
  const [customRange, setCustomRange] = useState([moment().startOf('month'), moment()]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [searchStats, setSearchStats] = useState('');
  const [sortStats, setSortStats] = useState({ key: 'date', asc: false });
  const [pageStats, setPageStats] = useState(1);
  const pageSizeStats = 10;
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);

  // Charger les commandes depuis l'API
  useEffect(() => {
    async function fetchOrders() {
      setLoadingOrders(true);
      setApiError(null);
      try {
        const res = await fetch('http://localhost:5001/api/shopify/orders');
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

  // Charger les demandes d'inscription
  useEffect(() => {
    async function fetchRegistrationRequests() {
      if (activeTab === 'Demandes d\'inscription') {
        setLoadingRequests(true);
        try {
          const res = await fetch('http://localhost:5001/api/requests');
          if (!res.ok) throw new Error('API non disponible');
          const data = await res.json();
          setRegistrationRequests(data);
        } catch (e) {
          console.error('Erreur lors du chargement des demandes:', e);
        }
        setLoadingRequests(false);
      }
    }
    fetchRegistrationRequests();
  }, [activeTab]);

  // Filtrage dynamique
  const filteredOrders = orders.filter(order => {
    const matchClient = !filters.client || order.nom.toLowerCase().includes(filters.client.toLowerCase()) || order.prenom.toLowerCase().includes(filters.client.toLowerCase());
    const matchPhone = !filters.phone || order.phone.includes(filters.phone);
    const matchId = !filters.id || order.id.toLowerCase().includes(filters.id.toLowerCase());
    const matchStatut = !filters.statut || order.statut === filters.statut;
    const matchProduit = !filters.produit || order.produit.toLowerCase().includes(filters.produit.toLowerCase());
    const matchOperateur = !filters.operateur || order.operateur.toLowerCase().includes(filters.operateur.toLowerCase());
    const matchCanal = !filters.canal || order.canal.toLowerCase().includes(filters.canal.toLowerCase());
    const matchDateStart = !filters.dateStart || order.date >= filters.dateStart;
    const matchDateEnd = !filters.dateEnd || order.date <= filters.dateEnd;
    return matchClient && matchPhone && matchId && matchStatut && matchProduit && matchOperateur && matchCanal && matchDateStart && matchDateEnd;
  });

  // Ajouter ou modifier une commande
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      // Modification
      const orderToUpdate = { ...orders[editIndex], ...newOrder };
      await fetch(`/api/orders/${orderToUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToUpdate)
      });
      const updated = [...orders];
      updated[editIndex] = orderToUpdate;
      setOrders(updated);
      setEditIndex(null);
    } else {
      // Création
      const newId = 'CMD' + (orders.length + 1).toString().padStart(3, '0');
      const orderToCreate = {
        ...newOrder,
        id: newId,
        logistique: false,
        historique: [
          {
            date: new Date().toISOString().split('T')[0],
            action: 'Création',
            utilisateur: 'Admin'
          }
        ]
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToCreate)
      });
      const created = await res.json();
      setOrders([...orders, created]);
    }
    setNewOrder({ 
      nom: '', 
      prenom: '', 
      phone: '', 
      adresse: '', 
      produit: '', 
      quantite: 1, 
      prix: 0,
      statut: 'En attente',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Supprimer une commande
  const handleDelete = async (idx) => {
    const id = orders[idx].id;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    setOrders(orders.filter((_, i) => i !== idx));
    setSelectedOrder(null);
  };

  // Modifier une commande
  const handleEdit = (idx) => {
    setNewOrder({ ...orders[idx] });
    setEditIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Envoyer à la logistique
  const handleSendLogistique = async (idx) => {
    const order = { ...orders[idx], logistique: true };
    try {
      // Mettre à jour le statut dans la base de données
      await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      // Envoyer à gl-net
      const glnetResponse = await fetch(`/api/shopify/send-to-glnet/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (!glnetResponse.ok) {
        throw new Error('Erreur lors de l\'envoi à gl-net');
      }

      const updated = [...orders];
      updated[idx] = { ...order, glnetSent: true };
      setOrders(updated);
      alert('Commande envoyée à gl-net avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi à gl-net: ' + error.message);
    }
  };

  // Voir détails
  const handleShowDetails = (order) => {
    setSelectedOrder(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction d'export Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
      'ID': order.id,
      'Nom': order.nom,
      'Prénom': order.prenom,
      'Téléphone': order.phone,
      'Adresse': order.adresse,
      'Produit': order.produit,
      'Quantité': order.quantite,
      'Prix': order.prix,
      'Logistique': order.logistique ? 'Oui' : 'Non'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");
    XLSX.writeFile(workbook, "commandes.xlsx");
  };

  // Fonction d'export PDF
  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Liste des Commandes', 14, 15);
    
    const tableColumn = ['ID', 'Client', 'Téléphone', 'Adresse', 'Produit', 'Quantité', 'Prix', 'Logistique'];
    const tableRows = orders.map(order => [
      order.id,
      `${order.nom} ${order.prenom}`,
      order.phone,
      order.adresse,
      order.produit,
      order.quantite.toString(),
      `${order.prix} €`,
      order.logistique ? 'Oui' : 'Non'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 60 },
        4: { cellWidth: 40 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 }
      },
      margin: { top: 25 }
    });
    
    doc.save('commandes.pdf');
  };

  function getPeriodRange(period, customRange) {
    const now = moment();
    let start, end = now.clone();
    if (period === 'Jour') {
      start = now.clone().startOf('day');
    } else if (period === 'Semaine') {
      start = now.clone().startOf('isoWeek');
    } else if (period === 'Mois') {
      start = now.clone().startOf('month');
    } else if (period === 'Trimestre') {
      start = now.clone().startOf('quarter');
    } else if (period === 'Année') {
      start = now.clone().startOf('year');
    } else if (period === 'Personnalisé' && customRange) {
      start = moment(customRange[0]);
      end = moment(customRange[1]);
    } else {
      start = now.clone().startOf('day');
    }
    return [start, end];
  }

  function getOrdersInRange(orders, start, end) {
    return orders.filter(o => moment(o.date).isBetween(start, end, null, '[]'));
  }

  function getKPI(orders) {
    const totalOrders = orders.length;
    const ca = orders.reduce((sum, o) => sum + o.prix * o.quantite, 0);
    const clients = new Set(orders.map(o => o.nom + o.prenom));
    const reorders = orders.filter((o, i, arr) => arr.findIndex(x => x.nom === o.nom && x.prenom === o.prenom) !== i);
    const panierMoyen = totalOrders ? ca / totalOrders : 0;
    return {
      totalOrders,
      ca,
      clients: clients.size,
      tauxReachat: totalOrders ? Math.round((reorders.length / totalOrders) * 100) : 0,
      panierMoyen
    };
  }

  function getSalesCurve(orders, period) {
    let groupBy = 'date';
    if (period === 'Jour') groupBy = 'hour';
    if (period === 'Semaine' || period === 'Mois') groupBy = 'date';
    if (period === 'Trimestre' || period === 'Année') groupBy = 'month';
    const map = {};
    orders.forEach(o => {
      let key;
      if (groupBy === 'hour') key = moment(o.date).format('HH');
      else if (groupBy === 'month') key = moment(o.date).format('MMM YYYY');
      else key = moment(o.date).format('DD/MM/YYYY');
      if (!map[key]) map[key] = { date: key, ca: 0, commandes: 0 };
      map[key].ca += o.prix * o.quantite;
      map[key].commandes += 1;
    });
    return Object.values(map).sort((a, b) => moment(a.date, 'DD/MM/YYYY').toDate() - moment(b.date, 'DD/MM/YYYY').toDate());
  }

  function getPieData(orders, key) {
    const map = {};
    orders.forEach(o => {
      const k = o[key] || 'Autre';
      if (!map[k]) map[k] = 0;
      map[k] += o.prix * o.quantite;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }

  function getBarData(orders, key) {
    const map = {};
    orders.forEach(o => {
      const k = o[key] || 'Autre';
      if (!map[k]) map[k] = 0;
      map[k] += o.prix * o.quantite;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }

  const [start, end] = getPeriodRange(statsPeriod, customRange);
  let periodOrders = getOrdersInRange(orders, start, end);
  if (selectedProduct) periodOrders = periodOrders.filter(o => o.produit === selectedProduct);
  if (searchStats) periodOrders = periodOrders.filter(o => (o.nom + ' ' + o.prenom + ' ' + o.produit).toLowerCase().includes(searchStats.toLowerCase()));
  const kpi = getKPI(periodOrders);
  const salesCurve = getSalesCurve(periodOrders, statsPeriod);
  const pieData = getPieData(periodOrders, 'produit');
  const barData = getBarData(periodOrders, 'statut');
  const products = [...new Set(orders.map(o => o.produit))];
  const paginatedOrders = periodOrders.slice((pageStats-1)*pageSizeStats, pageStats*pageSizeStats);

  // Approuver une demande
  const handleApproveRequest = async (requestId) => {
    const username = prompt('Entrez le nom d\'utilisateur pour ce compte:');
    if (!username) return;
    
    const password = prompt('Entrez le mot de passe pour ce compte:');
    if (!password) return;

    try {
      const res = await fetch(`http://localhost:5001/api/approve/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error('Erreur lors de l\'approbation');
      
      // Rafraîchir la liste des demandes
      const updatedRequests = await fetch('http://localhost:5001/api/requests').then(r => r.json());
      setRegistrationRequests(updatedRequests);
      
      alert('Demande approuvée avec succès');
    } catch (e) {
      alert('Erreur lors de l\'approbation: ' + e.message);
    }
  };

  // Refuser une demande
  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Entrez la raison du refus:');
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:5001/api/reject/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!res.ok) throw new Error('Erreur lors du refus');
      
      // Rafraîchir la liste des demandes
      const updatedRequests = await fetch('http://localhost:5001/api/requests').then(r => r.json());
      setRegistrationRequests(updatedRequests);
      
      alert('Demande refusée avec succès');
    } catch (e) {
      alert('Erreur lors du refus: ' + e.message);
    }
  };

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', padding: 0, background: '#fff', minHeight: '100vh'}}>
      <div style={{ padding: 16, background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
      </div>
      {/* Menu onglets */}
      <div style={{display:'flex', borderBottom:'2px solid #eee', background:'#fff', position:'sticky', top:0, zIndex:10}}>
        <div style={{fontWeight:900, fontSize:'1.3rem', letterSpacing:1.5, marginLeft:32, alignSelf:'center', textTransform:'uppercase', display:'flex', alignItems:'center'}}>
          C- <span style={{color:'#e53935', marginLeft:4, marginRight:4}}>INNOVATECH</span> <span style={{color:'#222'}}>SOLUTIONS</span>
        </div>
        {tabs.map(tab => (
          <div
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            style={{
              padding: '0 32px',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 600,
              color: activeTab === tab.label ? '#e53935' : '#222',
              borderBottom: activeTab === tab.label ? '3px solid #e53935' : '3px solid transparent',
              fontSize: '1.08rem',
              background: activeTab === tab.label ? '#fff' : 'none',
              transition: 'border 0.2s, color 0.2s',
            }}
          >
            {tab.label}
          </div>
        ))}
        <div style={{flex:1}}></div>
        <button
          style={{
            marginRight: 32,
            background: '#e53935',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '10px 32px',
            fontSize: '1.08rem',
            fontWeight: 700,
            cursor: 'pointer',
            alignSelf: 'center'
          }}
          onClick={() => navigate('/')}
        >
          Déconnexion
        </button>
      </div>
      {/* Contenu dynamique */}
      <div style={{padding: '48px 0 0 0', minHeight: 600}}>
        {activeTab === 'Statistiques' && (
          <div style={{maxWidth: 1200, margin: '0 auto', textAlign:'center', padding: '0 8px'}}>
            {/* Header & Filters */}
            <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', marginBottom:24, gap:12}}>
              <h2 style={{fontWeight:900, fontSize:'2rem', margin:0, letterSpacing:1, display:'flex', alignItems:'center', gap:8}}>
                <span role="img" aria-label="stats">📊</span> Statistiques de vente
              </h2>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                {['Jour','Semaine','Mois','Trimestre','Année','Personnalisé'].map(p => (
                  <button key={p} onClick={()=>setStatsPeriod(p)} style={{background:statsPeriod===p?'#e53935':'#e3f2fd', color:statsPeriod===p?'#fff':'#1976d2', border:'none', borderRadius:18, padding:'8px 18px', fontWeight:700, fontSize:'1rem', cursor:'pointer'}}>{p}</button>
                ))}
                {statsPeriod==='Personnalisé' && (
                  <DatePicker.RangePicker
                    value={customRange}
                    onChange={v=>setCustomRange(v)}
                    format="DD/MM/YYYY"
                    style={{marginLeft:8}}
                  />
                )}
                <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem', background:'#fff'}}>
                  <option value="">Tous les produits</option>
                  {products.map(p=>(<option key={p} value={p}>{p}</option>))}
                </select>
                <button onClick={()=>{/* TODO: export */}} style={{background:'#43a047', color:'#fff', border:'none', borderRadius:8, padding:'10px 18px', fontWeight:700, fontSize:'1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8}}><FaFileExport/> Exporter</button>
              </div>
            </div>
            {/* KPI Cards */}
            <div style={{display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center', marginBottom:32}}>
              <div style={{background:'#fff', borderRadius:12, padding:'18px 32px', minWidth:180, border:'1.5px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:15, color:'#888'}}>Total commandes</div>
                <div style={{fontWeight:800, fontSize:28}}>{kpi.totalOrders}</div>
              </div>
              <div style={{background:'#fff', borderRadius:12, padding:'18px 32px', minWidth:180, border:'1.5px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:15, color:'#888'}}>Chiffre d'affaires (€)</div>
                <div style={{fontWeight:800, fontSize:28}}>{kpi.ca.toLocaleString('fr-FR')}</div>
              </div>
              <div style={{background:'#fff', borderRadius:12, padding:'18px 32px', minWidth:180, border:'1.5px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:15, color:'#888'}}>Clients uniques</div>
                <div style={{fontWeight:800, fontSize:28}}>{kpi.clients}</div>
              </div>
              <div style={{background:'#fff', borderRadius:12, padding:'18px 32px', minWidth:180, border:'1.5px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:15, color:'#888'}}>Taux de réachat</div>
                <div style={{fontWeight:800, fontSize:28}}>{kpi.tauxReachat}%</div>
              </div>
              <div style={{background:'#fff', borderRadius:12, padding:'18px 32px', minWidth:180, border:'1.5px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:15, color:'#888'}}>Panier moyen (€)</div>
                <div style={{fontWeight:800, fontSize:28}}>{kpi.panierMoyen.toLocaleString('fr-FR', {maximumFractionDigits:2})}</div>
              </div>
            </div>
            {/* Graphiques dynamiques */}
            <div style={{display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center', marginBottom:32}}>
              <div style={{background:'#fff', borderRadius:12, padding:18, border:'1.5px solid #eee', flex:1, minWidth:320, maxWidth:500}}>
                <div style={{fontWeight:600, marginBottom:8}}>Courbe des ventes</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={salesCurve} margin={{top:10,right:20,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ca" stroke="#e53935" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:'#fff', borderRadius:12, padding:18, border:'1.5px solid #eee', flex:1, minWidth:320, maxWidth:500}}>
                <div style={{fontWeight:600, marginBottom:8}}>Répartition des ventes (produits)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx%COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:'#fff', borderRadius:12, padding:18, border:'1.5px solid #eee', flex:1, minWidth:320, maxWidth:500}}>
                <div style={{fontWeight:600, marginBottom:8}}>Statut des commandes</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{top:10,right:20,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Tableau détaillé */}
            <div style={{background:'#fff', borderRadius:12, border:'1.5px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', padding:18, marginBottom:32}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                <input type="text" placeholder="Recherche..." value={searchStats} onChange={e=>{setSearchStats(e.target.value);setPageStats(1);}} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem', minWidth:200}} />
                <div style={{fontSize:13, color:'#888'}}>Total : {periodOrders.length} commandes</div>
              </div>
              <div style={{overflowX:'auto'}}>
                {loadingOrders ? (
                  <div>Chargement des commandes...</div>
                ) : apiError ? (
                  <div>{apiError}</div>
                ) : (
                  <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:'0.99rem', background:'#fff', borderRadius:10}}>
                    <thead>
                      <tr style={{background:'#f7f8fa'}}>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222', cursor:'pointer'}} onClick={()=>{setSortStats(s=>({key:'date',asc:s.key==='date'?!s.asc:true}));}}>Date {sortStats.key==='date' && (sortStats.asc?<FaArrowUp/>:<FaArrowDown/>)}</th>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222', cursor:'pointer'}} onClick={()=>{setSortStats(s=>({key:'nom',asc:s.key==='nom'?!s.asc:true}));}}>Client {sortStats.key==='nom' && (sortStats.asc?<FaArrowUp/>:<FaArrowDown/>)}</th>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Produit</th>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Quantité</th>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Prix</th>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Total</th>
                        <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((o, idx) => (
                        <tr key={o.id || idx} style={{borderBottom:'1.5px solid #f0f0f0'}}>
                          <td style={{padding:'10px 8px'}}>{moment(o.date).format('DD/MM/YYYY')}</td>
                          <td style={{padding:'10px 8px'}}>{o.nom} {o.prenom}</td>
                          <td style={{padding:'10px 8px'}}>{o.produit}</td>
                          <td style={{padding:'10px 8px', textAlign:'center'}}>{o.quantite}</td>
                          <td style={{padding:'10px 8px', textAlign:'right'}}>{o.prix} €</td>
                          <td style={{padding:'10px 8px', textAlign:'right'}}>{(o.prix*o.quantite).toLocaleString('fr-FR')} €</td>
                          <td style={{padding:'10px 8px'}}>{o.statut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Pagination */}
              <div style={{display:'flex', justifyContent:'center', gap:8, marginTop:12}}>
                {Array.from({length:Math.ceil(periodOrders.length/pageSizeStats)},(_,i)=>(
                  <button key={i} onClick={()=>setPageStats(i+1)} style={{background:pageStats===i+1?'#e53935':'#e3f2fd', color:pageStats===i+1?'#fff':'#1976d2', border:'none', borderRadius:8, padding:'6px 14px', fontWeight:700, fontSize:'1rem', cursor:'pointer'}}>{i+1}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Commandes' && (
          <div style={{maxWidth: 950, margin: '0 auto', textAlign:'left', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'32px 28px 24px 28px', border:'1.5px solid #e0e0e0'}}>
            <h2 style={{fontWeight:800, fontSize:'1.6rem', marginBottom:32, textAlign:'center', letterSpacing:1}}>Commandes</h2>
            {/* Formulaire création/modification */}
            <section style={{marginBottom:36, borderBottom:'1.5px solid #f0f0f0', paddingBottom:24}}>
              <h3 style={{fontWeight:700, fontSize:'1.13rem', marginBottom:18, color:'#1976d2'}}>Créer ou modifier une commande</h3>
              <form onSubmit={handleOrderSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'18px 18px', alignItems:'end', marginBottom:0}}>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Nom</label>
                  <input type="text" value={newOrder.nom} onChange={e=>setNewOrder(o=>({...o, nom:e.target.value}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px'}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Prénom</label>
                  <input type="text" value={newOrder.prenom} onChange={e=>setNewOrder(o=>({...o, prenom:e.target.value}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px'}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Téléphone</label>
                  <input type="text" value={newOrder.phone} onChange={e=>setNewOrder(o=>({...o, phone:e.target.value}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px'}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Adresse de livraison</label>
                  <input type="text" value={newOrder.adresse} onChange={e=>setNewOrder(o=>({...o, adresse:e.target.value}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px'}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Nom du produit</label>
                  <input type="text" value={newOrder.produit} onChange={e=>setNewOrder(o=>({...o, produit:e.target.value}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px'}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Quantité</label>
                  <input type="number" min={1} value={newOrder.quantite} onChange={e=>setNewOrder(o=>({...o, quantite:parseInt(e.target.value)||1}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px', width:100}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Prix</label>
                  <input type="number" min={0} value={newOrder.prix} onChange={e=>setNewOrder(o=>({...o, prix:parseFloat(e.target.value)||0}))} required style={{borderRadius:6, border:'1.2px solid #cfd8dc', padding:'8px 10px', width:120}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontWeight:500, color:'#444', marginBottom:2}}>Statut</label>
                  <select
                    value={newOrder.statut}
                    onChange={e => setNewOrder(o => ({ ...o, statut: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1.2px solid #cfd8dc',
                      fontSize: '0.97rem',
                      background: '#fff'
                    }}
                  >
                    <option value="En attente">En attente</option>
                    <option value="En cours">En cours</option>
                    <option value="Expédiée">Expédiée</option>
                    <option value="Livrée">Livrée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
                <div style={{display:'flex', gap:10, gridColumn:'1/5'}}>
                  <button type="submit" style={{background:'#43a047', color:'#fff', border:'none', borderRadius:8, padding:'10px 28px', fontWeight:700, fontSize:'1rem', cursor:'pointer', boxShadow:'0 2px 8px rgba(67,160,71,0.10)'}}>{editIndex !== null ? 'Valider la modification' : 'Créer la commande'}</button>
                  {editIndex !== null && <button type="button" onClick={()=>{setEditIndex(null);setNewOrder({ nom: '', prenom: '', phone: '', adresse: '', produit: '', quantite: 1, prix: 0, statut: 'En attente', date: new Date().toISOString().split('T')[0] });}} style={{background:'#e53935', color:'#fff', border:'none', borderRadius:8, padding:'10px 28px', fontWeight:700, fontSize:'1rem', cursor:'pointer', boxShadow:'0 2px 8px rgba(229,57,53,0.10)'}}>Annuler</button>}
                </div>
              </form>
            </section>
            {/* Tableau des commandes */}
            <section style={{marginBottom:36}}>
              <h3 style={{fontWeight:700, fontSize:'1.13rem', marginBottom:18, color:'#1976d2'}}>Liste des commandes</h3>
              
              {/* Barre de recherche et filtres */}
              <div style={{marginBottom:20, display:'flex', gap:12, flexWrap:'wrap'}}>
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={filters.client}
                  onChange={e => setFilters(f => ({...f, client: e.target.value}))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1.2px solid #cfd8dc',
                    fontSize: '0.97rem',
                    minWidth: 200
                  }}
                />
                <select
                  value={filters.statut}
                  onChange={e => setFilters(f => ({...f, statut: e.target.value}))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1.2px solid #cfd8dc',
                    fontSize: '0.97rem',
                    background: '#fff'
                  }}
                >
                  <option value="">Tous les statuts</option>
                  <option value="En attente">En attente</option>
                  <option value="En cours">En cours</option>
                  <option value="Expédiée">Expédiée</option>
                  <option value="Livrée">Livrée</option>
                  <option value="Annulée">Annulée</option>
                </select>
                <input
                  type="date"
                  value={filters.dateStart}
                  onChange={e => setFilters(f => ({...f, dateStart: e.target.value}))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1.2px solid #cfd8dc',
                    fontSize: '0.97rem'
                  }}
                />
                <input
                  type="date"
                  value={filters.dateEnd}
                  onChange={e => setFilters(f => ({...f, dateEnd: e.target.value}))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1.2px solid #cfd8dc',
                    fontSize: '0.97rem'
                  }}
                />
              </div>

              <div style={{display:'flex', gap:12, marginBottom:16}}>
                <button 
                  onClick={exportToExcel}
                  style={{
                    background:'#43a047',
                    color:'#fff',
                    border:'none',
                    borderRadius:8,
                    padding:'10px 24px',
                    fontWeight:600,
                    fontSize:'0.97rem',
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    gap:8
                  }}
                >
                  <FaFileExport /> Exporter en Excel
                </button>
                <button 
                  onClick={exportToPDF}
                  style={{
                    background:'#e53935',
                    color:'#fff',
                    border:'none',
                    borderRadius:8,
                    padding:'10px 24px',
                    fontWeight:600,
                    fontSize:'0.97rem',
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    gap:8
                  }}
                >
                  <FaFileExport /> Exporter en PDF
                </button>
              </div>
              <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:'0.99rem', background:'#fff', borderRadius:10, boxShadow:'0 1px 6px rgba(0,0,0,0.04)'}}>
                <thead>
                  <tr style={{background:'#f7f8fa'}}>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Client</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Téléphone</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Adresse</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Produit</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Quantité</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Prix</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Statut</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Date</th>
                    <th style={{padding:'12px 8px', fontWeight:700, color:'#222', borderBottom:'2px solid #e0e0e0'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr key={order.id || idx} style={{background: order.logistique ? '#e3f2fd' : 'white', transition:'background 0.2s', borderBottom:'1.5px solid #f0f0f0', cursor:'pointer'}} onMouseOver={e=>e.currentTarget.style.background='#f5f5f5'} onMouseOut={e=>e.currentTarget.style.background=order.logistique ? '#e3f2fd' : 'white'}>
                      <td style={{padding:'10px 8px', fontWeight:600, color:'#222'}}>{order.client?.nom} {order.client?.prenom}</td>
                      <td style={{padding:'10px 8px'}}>{order.client?.telephone}</td>
                      <td style={{padding:'10px 8px'}}>{order.client?.adresse}</td>
                      <td style={{padding:'10px 8px'}}>{order.produits?.map(p => p.nom).join(', ')}</td>
                      <td style={{padding:'10px 8px', textAlign:'center'}}>{order.produits?.reduce((acc, p) => acc + (p.quantite || 1), 0)}</td>
                      <td style={{padding:'10px 8px', textAlign:'right'}}>{order.produits?.reduce((acc, p) => acc + (p.prix || 0), 0)} €</td>
                      <td style={{padding:'10px 8px'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          background: 
                            order.statut === 'En attente' ? '#fff3e0' :
                            order.statut === 'En cours' ? '#e3f2fd' :
                            order.statut === 'Expédiée' ? '#e8f5e9' :
                            order.statut === 'Livrée' ? '#f3e5f5' :
                            '#ffebee',
                          color: 
                            order.statut === 'En attente' ? '#e65100' :
                            order.statut === 'En cours' ? '#1565c0' :
                            order.statut === 'Expédiée' ? '#2e7d32' :
                            order.statut === 'Livrée' ? '#6a1b9a' :
                            '#c62828'
                        }}>
                          {order.statut}
                        </span>
                      </td>
                      <td style={{padding:'10px 8px'}}>{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                      <td style={{padding:'10px 8px'}}>{order.agent || '—'}</td>
                      <td style={{padding:'10px 8px'}}>
                        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                          <button style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:7, padding:'7px 16px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', minWidth:90}} onClick={e=>{e.stopPropagation();handleShowDetails(order);}}>Détails</button>
                          <button style={{background:'#43a047', color:'#fff', border:'none', borderRadius:7, padding:'7px 16px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', minWidth:90, opacity:order.logistique?0.7:1}} onClick={e=>{e.stopPropagation();handleSendLogistique(idx);}} disabled={order.logistique}>{order.logistique ? 'Envoyée' : 'Logistique'}</button>
                          <button style={{background:'#ffb300', color:'#fff', border:'none', borderRadius:7, padding:'7px 16px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', minWidth:90}} onClick={e=>{e.stopPropagation();handleEdit(idx);}}>Modifier</button>
                          <button style={{background:'#e53935', color:'#fff', border:'none', borderRadius:7, padding:'7px 16px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', minWidth:90}} onClick={e=>{e.stopPropagation();handleDelete(idx);}}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </section>
            {/* Détail d'une commande */}
            {selectedOrder && (
              <section style={{marginBottom:32}}>
                <h3 style={{fontWeight:700, fontSize:'1.13rem', marginBottom:18, color:'#1976d2'}}>Détail de la commande {selectedOrder.id}</h3>
                <div style={{background:'#fafbfc', borderRadius:12, padding:24, border:'1.5px solid #e0e0e0', maxWidth:700, margin:'0 auto'}}>
                  <div style={{marginBottom:8}}><b>Client :</b> {selectedOrder.nom} {selectedOrder.prenom}</div>
                  <div style={{marginBottom:8}}><b>Téléphone :</b> {selectedOrder.phone}</div>
                  <div style={{marginBottom:8}}><b>Adresse :</b> {selectedOrder.adresse}</div>
                  <div style={{marginBottom:8}}><b>Produit :</b> {selectedOrder.produit}</div>
                  <div style={{marginBottom:8}}><b>Quantité :</b> {selectedOrder.quantite}</div>
                  <div style={{marginBottom:8}}><b>Prix :</b> {selectedOrder.prix} €</div>
                  <div style={{marginBottom:8}}><b>Envoyée à la logistique :</b> {selectedOrder.logistique ? 'Oui' : 'Non'}</div>
                  <button style={{marginTop:12, background:'#888', color:'#fff', border:'none', borderRadius:8, padding:'10px 28px', fontWeight:700, fontSize:'1rem', cursor:'pointer', display:'block', marginLeft:'auto', marginRight:'auto'}} onClick={()=>setSelectedOrder(null)}>Fermer</button>
                </div>
              </section>
            )}
          </div>
        )}
        {activeTab === 'Commandes Shopify' && (
          <AdminShopifyOrders />
        )}
        {activeTab === 'Recherché' && (
          <div style={{maxWidth: 1100, margin: '0 auto', textAlign:'left', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', padding:'32px 28px 24px 28px', border:'1.5px solid #e0e0e0'}}>
            <h2 style={{fontWeight:900, fontSize:'2rem', marginBottom:24, letterSpacing:1, display:'flex', alignItems:'center', gap:8}}>
              <span role="img" aria-label="search">🔎</span> Recherche avancée de commandes
            </h2>
            {/* Filtres avancés */}
            <div style={{display:'flex', flexWrap:'wrap', gap:18, marginBottom:24, alignItems:'end'}}>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Nom ou Prénom</label>
                <input type="text" placeholder="Nom ou prénom..." value={filters.client} onChange={e=>setFilters(f=>({...f, client:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Téléphone</label>
                <input type="text" placeholder="Téléphone..." value={filters.phone} onChange={e=>setFilters(f=>({...f, phone:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>N° Commande</label>
                <input type="text" placeholder="CMD..." value={filters.id} onChange={e=>setFilters(f=>({...f, id:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Date début</label>
                <input type="date" value={filters.dateStart} onChange={e=>setFilters(f=>({...f, dateStart:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Date fin</label>
                <input type="date" value={filters.dateEnd} onChange={e=>setFilters(f=>({...f, dateEnd:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Statut</label>
                <select value={filters.statut} onChange={e=>setFilters(f=>({...f, statut:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}}>
                  <option value="">Tous</option>
                  <option value="En attente">🕒 En attente</option>
                  <option value="En cours">En cours</option>
                  <option value="Expédiée">Expédiée</option>
                  <option value="Livrée">✅ Livrée</option>
                  <option value="Annulée">❌ Annulée</option>
                  <option value="Litige">🚨 Litige</option>
                </select>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Canal</label>
                <input type="text" placeholder="Web, Appel..." value={filters.canal} onChange={e=>setFilters(f=>({...f, canal:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Opérateur</label>
                <input type="text" placeholder="Agent..." value={filters.operateur} onChange={e=>setFilters(f=>({...f, operateur:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label>Produit</label>
                <input type="text" placeholder="Produit..." value={filters.produit} onChange={e=>setFilters(f=>({...f, produit:e.target.value}))} style={{padding:'8px 12px', borderRadius:6, border:'1.2px solid #cfd8dc', fontSize:'1rem'}} />
              </div>
              {/* Ajout d'autres filtres pro si besoin */}
            </div>
            {/* Résultats */}
            <div style={{overflowX:'auto', marginTop:18}}>
              <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:'0.99rem', background:'#fff', borderRadius:10}}>
                <thead>
                  <tr style={{background:'#f7f8fa'}}>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>N° Cmd</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Client</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Téléphone</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Date</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Produit(s)</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Montant</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Statut</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Agent</th>
                    <th style={{padding:'10px 8px', fontWeight:700, color:'#222'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr key={order.id || idx} style={{borderBottom:'1.5px solid #f0f0f0'}}>
                      <td style={{padding:'10px 8px', fontWeight:600}}>{order.id}</td>
                      <td style={{padding:'10px 8px'}}>{order.nom} {order.prenom}</td>
                      <td style={{padding:'10px 8px'}}>{order.phone}</td>
                      <td style={{padding:'10px 8px'}}>{order.date}</td>
                      <td style={{padding:'10px 8px'}}>{order.produit} {order.quantite>1?`(x${order.quantite})`:''}</td>
                      <td style={{padding:'10px 8px', textAlign:'right'}}>{order.prix*order.quantite} €</td>
                      <td style={{padding:'10px 8px'}}>
                        <span style={{padding:'4px 8px', borderRadius:12, fontWeight:600, background: order.statut==='Livrée'?'#e8f5e9':order.statut==='Annulée'?'#ffebee':order.statut==='En attente'?'#fff3e0':order.statut==='Litige'?'#ffecb3':'#e3f2fd', color: order.statut==='Livrée'?'#2e7d32':order.statut==='Annulée'?'#c62828':order.statut==='En attente'?'#e65100':order.statut==='Litige'?'#ff9800':'#1565c0'}}>{order.statut}</span>
                      </td>
                      <td style={{padding:'10px 8px'}}>{order.operateur||'—'}</td>
                      <td style={{padding:'10px 8px'}}>
                        <button style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:7, padding:'6px 12px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', marginRight:4}} onClick={()=>setSelectedOrder(order)}>🔍</button>
                        <button style={{background:'#ffb300', color:'#fff', border:'none', borderRadius:7, padding:'6px 12px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', marginRight:4}}>✏️</button>
                        <button style={{background:'#888', color:'#fff', border:'none', borderRadius:7, padding:'6px 12px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer'}}>📄</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Détail d'une commande (fiche) */}
            {selectedOrder && (
              <div style={{marginTop:32, background:'#fafbfc', borderRadius:12, padding:24, border:'1.5px solid #e0e0e0', maxWidth:700, margin:'32px auto 0 auto'}}>
                <h3 style={{fontWeight:700, fontSize:'1.13rem', marginBottom:18, color:'#1976d2'}}>Fiche commande {selectedOrder.id}</h3>
                <div style={{marginBottom:8}}><b>Client :</b> {selectedOrder.nom} {selectedOrder.prenom}</div>
                <div style={{marginBottom:8}}><b>Téléphone :</b> {selectedOrder.phone}</div>
                <div style={{marginBottom:8}}><b>Adresse :</b> {selectedOrder.adresse}</div>
                <div style={{marginBottom:8}}><b>Produit :</b> {selectedOrder.produit}</div>
                <div style={{marginBottom:8}}><b>Quantité :</b> {selectedOrder.quantite}</div>
                <div style={{marginBottom:8}}><b>Prix :</b> {selectedOrder.prix} €</div>
                <div style={{marginBottom:8}}><b>Statut :</b> {selectedOrder.statut}</div>
                <div style={{marginBottom:8}}><b>Opérateur :</b> {selectedOrder.operateur||'—'}</div>
                <div style={{marginBottom:8}}><b>Date :</b> {selectedOrder.date}</div>
                <div style={{marginBottom:8}}><b>Canal :</b> {selectedOrder.canal||'—'}</div>
                <div style={{marginBottom:8}}><b>Historique :</b> <pre style={{background:'#f5f5f5', borderRadius:6, padding:8, fontSize:13}}>{JSON.stringify(selectedOrder.historique,null,2)}</pre></div>
                <button style={{marginTop:12, background:'#888', color:'#fff', border:'none', borderRadius:8, padding:'10px 28px', fontWeight:700, fontSize:'1rem', cursor:'pointer', display:'block', marginLeft:'auto', marginRight:'auto'}} onClick={()=>setSelectedOrder(null)}>Fermer</button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Vendeurs' && (
          <div style={{maxWidth: 700, margin: '0 auto', textAlign:'center'}}>
            <h2 style={{fontWeight:700, fontSize:'1.5rem', marginBottom:32}}>Vendeurs</h2>
            <div>[Liste des vendeurs ici]</div>
          </div>
        )}
        {activeTab === 'Demandes d\'inscription' && (
          <div className="registration-requests">
            <h2>Demandes d'inscription en attente</h2>
            {loadingRequests ? (
              <p>Chargement des demandes...</p>
            ) : registrationRequests.length === 0 ? (
              <p>Aucune demande en attente</p>
            ) : (
              <div className="requests-list">
                {registrationRequests.map(request => (
                  <div key={request._id} className="request-card">
                    <h3>{request.prenom} {request.nom}</h3>
                    <p>Email: {request.email}</p>
                    <p>Téléphone: {request.telephone}</p>
                    <p>Rôle demandé: {request.role}</p>
                    <p>Expérience: {request.experience}</p>
                    <p>Date de demande: {new Date(request.dateDemande).toLocaleDateString()}</p>
                    <div className="request-actions">
                      <button onClick={() => handleApproveRequest(request._id)} className="approve-btn">
                        Approuver
                      </button>
                      <button onClick={() => handleRejectRequest(request._id)} className="reject-btn">
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCRM; 