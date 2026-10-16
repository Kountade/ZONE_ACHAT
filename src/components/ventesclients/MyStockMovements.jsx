// src/components/ventesclients/MyStockMovements.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  History, ArrowLeft, RefreshCw, Loader2, CheckCircle,
  AlertCircle, Package, Search, Filter
} from 'lucide-react';

const MyStockMovements = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ movements: [], stats: {} });
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

      const response = await AxiosInstance.get('/client-space/my-stock-movements/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      setData(response.data);
      setIsFirstLoad(false);
    } catch (error) {
      console.error(error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const getMovementBadge = (type) => {
    const configs = {
      deposit: { label: 'Dépôt', className: 'badge-success', sign: '+' },
      withdrawal: { label: 'Retrait', className: 'badge-error', sign: '-' },
      adjustment: { label: 'Ajustement', className: 'badge-warning', sign: '' },
      sale: { label: 'Vente', className: 'badge-info', sign: '-' },
      return: { label: 'Retour', className: 'badge-primary', sign: '+' },
    };
    return configs[type] || { label: type, className: 'badge-ghost', sign: '' };
  };

  const movements = data.movements || [];
  const filteredMovements = movements.filter(m => {
    const matchSearch = !searchTerm ||
      m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || m.movement_type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement de mes mouvements...</p>
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
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/client/stock')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <History className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-blue-600">
                Historique Mouvements
              </h1>
              <p className="text-sm text-gray-500">
                Dépôts et retraits sur mon stock
              </p>
            </div>
          </div>
          <button onClick={fetchMovements} className="btn btn-sm btn-outline gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      {data.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white shadow-md rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Total dépôts</p>
            <p className="text-2xl font-bold text-success">
              +{Number(data.stats.total_deposits || 0).toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Total retraits</p>
            <p className="text-2xl font-bold text-error">
              -{Number(data.stats.total_withdrawals || 0).toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Quantité actuelle</p>
            <p className="text-2xl font-bold text-blue-600">
              {Number(data.stats.current_quantity || 0).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
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
          <div className="divide-y divide-gray-100">
            {filteredMovements.map((m) => {
              const badge = getMovementBadge(m.movement_type);
              return (
                <div key={m.id} className="p-4 hover:bg-gray-50 flex items-center gap-3">
                  <span className={`badge ${badge.className} badge-sm`}>
                    {badge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{m.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(m.created_at)}
                      {m.created_by_name && ` • par ${m.created_by_name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${badge.sign === '+' ? 'text-success' : 'text-error'}`}>
                      {badge.sign}{m.quantity}
                    </p>
                    <p className="text-xs text-gray-400">
                      {m.previous_quantity} → {m.new_quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default MyStockMovements;