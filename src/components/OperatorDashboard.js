import React, { useState, useEffect } from 'react';
import OperatorOrders from './OperatorOrders';

function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [operatorStatus, setOperatorStatus] = useState('Hors ligne');
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const tabs = [
    { id: 'orders', name: 'Commandes', component: <OperatorOrders /> },
    { id: 'dashboard', name: 'Tableau de bord', component: <div>Tableau de bord opérateur</div> }
  ];

  // Récupérer les infos de l'utilisateur connecté
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      fetchUserInfo(username);
    }
  }, []);

  const fetchUserInfo = async (username) => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      const user = users.find(u => u.username === username);
      if (user) {
        setCurrentUser(user);
        setOperatorStatus(user.operatorStatus || 'Hors ligne');
        setIsConnected(user.operatorStatus === 'Connecté');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
    }
  };

  const toggleConnection = async () => {
    if (!currentUser) return;

    const newStatus = isConnected ? 'Hors ligne' : 'Connecté';
    
    try {
      const response = await fetch(`/api/users/${currentUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorStatus: newStatus
        })
      });

      if (response.ok) {
        setOperatorStatus(newStatus);
        setIsConnected(!isConnected);
        
        if (newStatus === 'Connecté') {
          alert('Vous êtes maintenant connecté pour recevoir les appels !');
        } else {
          alert('Vous êtes maintenant déconnecté.');
        }
      } else {
        alert('Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Connecté': return 'bg-green-500';
      case 'Hors ligne': return 'bg-red-500';
      case 'Pause': return 'bg-yellow-500';
      case 'Formation': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (showWelcome) {
    return (
      <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',background:'#f7f8fa'}}>
        <div style={{background:'#fff',borderRadius:16,padding:48,boxShadow:'0 2px 16px rgba(0,0,0,0.08)',textAlign:'center',maxWidth:420}}>
          <h1 style={{fontWeight:900,fontSize:'2.1rem',letterSpacing:1,marginBottom:18,color:'#e53935'}}>Bienvenue à <span style={{color:'#222'}}>C-<span style={{color:'#e53935'}}>INNOVATECH</span> SOLUTIONS</span></h1>
          <p style={{fontSize:'1.15rem',marginBottom:32}}>Connectez-vous pour recevoir les appels.</p>
          <button onClick={() => setShowWelcome(false)} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'14px 38px',fontWeight:700,fontSize:'1.1rem',cursor:'pointer',boxShadow:'0 2px 8px rgba(25,118,210,0.10)'}}>Débuter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Interface Opérateur</h1>
            
            {/* Statut et bouton de connexion */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Statut:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(operatorStatus)}`}>
                  {operatorStatus}
                </span>
              </div>
              
              <button
                onClick={toggleConnection}
                className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                  isConnected 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isConnected ? 'Se déconnecter' : 'Connecte-toi pour recevoir les appels'}
              </button>
            </div>
          </div>
          
          {/* Onglets */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="mt-6">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OperatorDashboard; 