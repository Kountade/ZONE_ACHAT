// src/components/ventesclients/ClientStockDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Package, User, Plus, Minus, RefreshCw,
  Loader2, CheckCircle, AlertCircle, X, DollarSign,
  History, TrendingUp
} from 'lucide-react';

const ClientStockDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [stock, setStock] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${Number(amount).toLocaleString('fr-FR')} FCFA`;
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

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadingMovements(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const [stockRes, movementsRes] = await Promise.all([
        AxiosInstance.get(`/client-stock/${clientId}/client-stock/`, {
          headers: { 'Authorization': `Token ${token}` }
        }),
        AxiosInstance.get(`/client-stock/${clientId}/movements/`, {
          headers: { 'Authorization': `Token ${token}` }
        })
      ]);

      setStock(stockRes.data);
      setMovements(movementsRes.data.movements || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
      setLoadingMovements(false);
    }
  }, [clientId, navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ============================================================
  // BADGE MOUVEMENT
  // ============================================================
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

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  if (loading && !stock) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error mx-auto" />
          <p className="text-gray-500">Stock introuvable</p>
          <button onClick={() => navigate('/client-stocks')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/client-stocks')}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Stock de {stock.client_name}
              </h1>
              <p className="text-sm text-gray-500">
                {stock.client_code} • {stock.client_phone}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAll}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate(`/client-stocks/depot?client=${stock.client}`)}
              className="btn btn-sm btn-success gap-2"
            >
              <Plus className="w-4 h-4" />
              Dépôt
            </button>
            <button
              onClick={() => navigate(`/client-stocks/retrait?client=${stock.client}`)}
              className="btn btn-sm btn-error gap-2"
            >
              <Minus className="w-4 h-4" />
              Retrait
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Produits différents</p>
              <p className="text-2xl font-bold text-primary">{stock.nombre_produits}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Quantité totale</p>
              <p className="text-2xl font-bold text-success">
                {Number(stock.total_quantity).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Valeur totale</p>
              <p className="text-2xl font-bold text-warning">
                {formatCurrency(stock.total_value)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Lignes de stock */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-700">Produits en stock</h3>
        </div>
        {stock.lignes?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4 text-right">Quantité</th>
                  <th className="py-3 px-4 text-right">Prix unitaire</th>
                  <th className="py-3 px-4 text-right">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {stock.lignes.map((ligne) => (
                  <tr key={ligne.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{ligne.product_name}</p>
                          <p className="text-xs text-gray-500">{ligne.product_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {Number(ligne.quantity).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(ligne.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary">
                      {formatCurrency(ligne.total_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun produit dans ce stock</p>
          </div>
        )}
      </div>

      {/* Historique mouvements */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-700">Derniers mouvements</h3>
        </div>

        {loadingMovements ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun mouvement enregistré
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.slice(0, 10).map((m) => {
              const badge = getMovementBadge(m.movement_type);
              return (
                <div key={m.id} className="p-4 hover:bg-gray-50 flex items-center gap-3">
                  <span className={`badge ${badge.className} badge-sm`}>
                    {badge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {m.product_name}
                    </p>
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

export default ClientStockDetail;