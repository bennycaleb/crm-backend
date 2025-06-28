import React, { useState } from 'react';
import AdminOrders from './AdminOrders';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  const tabs = [
    { id: 'orders', name: 'Commandes', component: <AdminOrders /> },
    { id: 'dashboard', name: 'Tableau de bord', component: <div>Tableau de bord admin</div> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Interface Administrateur</h1>
          
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

export default AdminDashboard; 