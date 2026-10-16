// src/components/ventesclients/ClientStockMovements.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  History, Search, RefreshCw, Filter, Loader2,
  CheckCircle, AlertCircle, X, Package
} from 'lucide-react';

const ClientStockMovements = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return '-'; }
  };

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Récupérer tous les stocks clients puis leurs mouvements
      const stocksRes = await AxiosInstance.get('/client-stock/list/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const stocks = stocksRes.data.results || [];
      const allMovements = [];

      await Promise.all(
        stocks.map(async (s) => {
          try {
            const res = await AxiosInstance.get(
              `/client-stock/${s.client}/movements/`,
              { headers: { 'Authorization': `Token ${token}` } }
            );
            const list = res.data.movements || [];
            list.forEach(m => {
              allMovements.push({
                ...m,
                client_name: s.client_name,
                client_code: s.client_code,
              });
            });
          } catch (e) {
            console.error(e);
          }
        })
      );

      // Trier par date desc
      allMovements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMovements(allMovements);
      setIsFirstLoad(false);
    } catch (error) {
      console.error(error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  // Filtres
  const filteredMovements = movements.filter(m => {
    const matchSearch = !searchTerm ||
      m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || m.movement_type === typeFilter;
    return matchSearch && matchType;
  });

  const getMovementBadge = (type) => {
    const configs = {
      deposit: { label: 'Dépôt', className: 'badge-success' },
      withdrawal: { label: 'Retrait', className: 'badge-error' },
      adjustment: { label: 'Ajustement', className: 'badge-warning' },
      sale: { label: 'Vente', className: 'badge-info' },
      return: { label: 'Retour', className: 'badge-primary' },
    };
    return configs[type] || { label: type, className: 'badge-ghost' };
  };

  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement des mouvements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <History className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Mouvements Stock Client
              </h1>
              <p className="text-sm text-gray-500">
                Historique de tous les dépôts et retraits
              </p>
            </div>
          </div>
          <button onClick={fetchMovements} className="btn btn-sm btn-outline gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher produit, client, référence..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered w-full"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value="deposit">Dépôts</option>
            <option value="withdrawal">Retraits</option>
            <option value="adjustment">Ajustements</option>
            <option value="sale">Ventes</option>
            <option value="return">Retours</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Quantité</th>
                  <th className="py-3 px-4 text-center">Aperçu</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((m) => {
                  const badge = getMovementBadge(m.movement_type);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{m.client_name || '-'}</p>
                        <p className="text-xs text-gray-500">{m.client_code || ''}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.product_name}</p>
                            <p className="text-xs text-gray-500">{m.product_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${badge.className} badge-sm`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {m.quantity}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500">
                        {m.previous_quantity} → {m.new_quantity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ClientStockMovements;