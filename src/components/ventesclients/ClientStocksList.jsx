// src/components/ventesclients/ClientStocksList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Package, PackageSearch, Search, RefreshCw, Plus, Minus, Eye,
  History, Users, DollarSign, X, CheckCircle, AlertCircle,
  Loader2, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

const ClientStocksList = () => {
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    count: 0,
    total_value: 0,
    total_quantity: 0,
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await AxiosInstance.get(
        `/client-stock/list/?${params.toString()}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      const data = response.data;
      setStocks(data.results || []);
      setStats({
        count: data.count || 0,
        total_value: data.total_value || 0,
        total_quantity: data.total_quantity || 0,
      });
      setIsFirstLoad(false);
    } catch (error) {
      console.error('Erreur chargement stocks:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification(
          error.response?.data?.error || 'Erreur de chargement',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, navigate]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const paginatedStocks = stocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(stocks.length / itemsPerPage);

  // ============================================================
  // ÉCRAN DE CHARGEMENT INITIAL
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">
            Chargement des stocks clients...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <PackageSearch className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Stocks Clients
              </h1>
              {loading && !isFirstLoad && (
                <Loader2 className="w-5 h-5 text-primary animate-spin ml-2" />
              )}
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Marchandises déposées chez les clients
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchStocks}
              className="btn btn-sm sm:btn-md btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => navigate('/client-stocks/depot')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau Dépôt
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Clients avec stock
              </p>
              <p className="text-2xl font-bold text-primary">{stats.count}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Quantité totale</p>
              <p className="text-2xl font-bold text-success">
                {Number(stats.total_quantity).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Valeur totale</p>
              <p className="text-2xl font-bold text-warning">
                {formatCurrency(stats.total_value)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, code ou téléphone du client..."
            className="input input-bordered w-full pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 text-center">Produits</th>
                <th className="py-3 px-4 text-right">Quantité</th>
                <th className="py-3 px-4 text-right">Valeur</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !isFirstLoad && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && paginatedStocks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <PackageSearch className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Aucun stock client trouvé
                      </p>
                      <p className="text-sm text-gray-400">
                        Commencez par faire un dépôt de marchandises
                      </p>
                      <button
                        onClick={() => navigate('/client-stocks/depot')}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Nouveau Dépôt
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && paginatedStocks.map((stock) => (
                <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {stock.client_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {stock.client_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stock.client_code} • {stock.client_phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="badge badge-info badge-sm">
                      {stock.nombre_produits} produit(s)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {Number(stock.total_quantity).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-primary">
                    {formatCurrency(stock.total_value)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => navigate(`/client-stocks/${stock.client}/detail`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip text-primary"
                        data-tip="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/client-stocks/depot?client=${stock.client}`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip text-success"
                        data-tip="Ajouter du stock"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/client-stocks/retrait?client=${stock.client}`)}
                        className="btn btn-ghost btn-sm btn-circle tooltip text-error"
                        data-tip="Retirer du stock"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {stocks.length > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
              {Math.min(currentPage * itemsPerPage, stocks.length)} sur{' '}
              {stocks.length}
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5 lignes</option>
                <option value="10">10 lignes</option>
                <option value="20">20 lignes</option>
                <option value="50">50 lignes</option>
              </select>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="join-item btn btn-sm btn-disabled">
                  {totalPages > 0 ? `Page ${currentPage} / ${totalPages}` : 'Page 0'}
                </span>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ClientStocksList;