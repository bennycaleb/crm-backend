import React, { useState, useEffect } from 'react';
import { API_URL } from '../apiConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function OperatorsStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!stats) return;

    const doc = new jsPDF();
    
    // Titre principal
    doc.setFontSize(20);
    doc.text('Statistiques Générales des Opérateurs', 20, 20);
    
    // Date de génération
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    
    // Statistiques générales
    doc.setFontSize(16);
    doc.text('Statistiques Générales', 20, 45);
    
    doc.setFontSize(12);
    doc.text(`Total Appels: ${stats.globalStats.totalAppels}`, 20, 55);
    doc.text(`Total Validations: ${stats.globalStats.totalValidations}`, 20, 65);
    doc.text(`Chèque Total Société: ${stats.globalStats.chequeTotalSociete}%`, 20, 75);
    doc.text(`Chèque Moyen Global: ${stats.globalStats.chequeMoyenGlobal}%`, 20, 85);
    doc.text(`Nombre d'Opérateurs: ${stats.globalStats.nombreOperateurs}`, 20, 95);
    
    // Tableau des opérateurs
    doc.setFontSize(16);
    doc.text('Statistiques par Opérateur', 20, 115);
    
    const tableData = stats.operators.map(op => [
      `${op.prenom} ${op.nom}`,
      op.statut,
      op.statutConnexion,
      op.stats.appelsRecus,
      op.stats.appelsRejetes,
      op.stats.rappels,
      op.stats.sansReponse,
      op.stats.poubelle,
      op.stats.validations,
      `${op.stats.chequeMoyen}%`
    ]);
    
    autoTable(doc, {
      startY: 125,
      head: [['Opérateur', 'Statut Après-Vente', 'Connexion', 'Appels Reçus', 'Rejetés', 'Rappels', 'Sans Réponse', 'Poubelle', 'Validations', 'Chèque Moyen']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [229, 57, 53] }
    });
    
    // Sauvegarder le PDF
    doc.save(`statistiques-operateurs-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Statistiques Générales</h2>
          <button
            onClick={downloadPDF}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            📄 Télécharger PDF
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.globalStats.totalAppels}</div>
            <div className="text-sm text-gray-600">Total Appels</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.globalStats.totalValidations}</div>
            <div className="text-sm text-gray-600">Total Validations</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.globalStats.chequeTotalSociete}%</div>
            <div className="text-sm text-gray-600">Chèque Total Société</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.globalStats.chequeMoyenGlobal}%</div>
            <div className="text-sm text-gray-600">Chèque Moyen Global</div>
          </div>
        </div>
      </div>

      {/* Tableau des opérateurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Statistiques par Opérateur</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opérateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut Après-Vente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connexion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appels Reçus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejetés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rappels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sans Réponse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poubelle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chèque Moyen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.operators.map((operator) => (
                <tr key={operator.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {operator.prenom} {operator.nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      operator.statut === 'Validé' 
                        ? 'bg-green-100 text-green-800' 
                        : operator.statut === 'Rappel'
                        ? 'bg-yellow-100 text-yellow-800'
                        : operator.statut === 'Refus'
                        ? 'bg-red-100 text-red-800'
                        : operator.statut === 'Poubelle'
                        ? 'bg-orange-100 text-orange-800'
                        : operator.statut === 'Sans réponse'
                        ? 'bg-gray-100 text-gray-800'
                        : operator.statut === 'En traitement'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {operator.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      operator.statutConnexion === 'Connecté' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {operator.statutConnexion}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.stats.appelsRecus}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.stats.appelsRejetes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.stats.rappels}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.stats.sansReponse}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.stats.poubelle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.stats.validations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-semibold ${
                      operator.stats.chequeMoyen >= 20 
                        ? 'text-green-600' 
                        : operator.stats.chequeMoyen >= 10 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {operator.stats.chequeMoyen}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bouton de rafraîchissement */}
      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Actualiser les Statistiques
        </button>
      </div>
    </div>
  );
}

export default OperatorsStats;
