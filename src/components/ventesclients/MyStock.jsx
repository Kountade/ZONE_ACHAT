// src/components/ventesclients/MyStock.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Package, RefreshCw, Loader2, CheckCircle, AlertCircle, X,
  DollarSign, TrendingUp, History, PackageSearch
} from 'lucide-react';

const MyStock = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
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

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get('/client-space/my-stock/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      setStock(response.data);
      setIsFirstLoad(false);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement de mon stock...</p>
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
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Package className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-blue-600">
                Mon Stock Produits
              </h1>
              <p className="text-sm text-gray-500">
                Marchandises déposées chez moi
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchStock}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <Link
              to="/client/stock/movements"
              className="btn btn-sm btn-outline gap-2"
            >
              <History className="w-4 h-4" />
              Historique
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stock && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Produits</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stock.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <PackageSearch className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Quantité totale</p>
                <p className="text-2xl font-bold text-success">
                  {Number(stock.total_quantity || 0).toLocaleString('fr-FR')}
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
      )}

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {(!stock || !stock.results || stock.results.length === 0) ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun stock enregistré</p>
            <p className="text-sm text-gray-400 mt-1">
              Contactez l'administrateur pour un dépôt de marchandises
            </p>
          </div>
        ) : (
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
                {stock.results.map((ligne) => (
                  <tr key={ligne.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {ligne.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ligne.product_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {Number(ligne.quantity).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(ligne.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">
                      {formatCurrency(ligne.total_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MyStock;