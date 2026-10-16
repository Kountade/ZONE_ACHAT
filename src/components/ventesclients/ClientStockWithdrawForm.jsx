// src/components/ventesclients/ClientStockWithdrawForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, PackageMinus, Loader2, AlertCircle,
  CheckCircle, User, Package, Hash, MessageSquare, Search,
  AlertTriangle
} from 'lucide-react';

const ClientStockWithdrawForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get('client');

  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedLigne, setSelectedLigne] = useState(null);

  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [stockLines, setStockLines] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const [formData, setFormData] = useState({
    client_id: preselectedClient || '',
    product_id: '',
    quantity: '',
    notes: '',
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT CLIENT PRÉ-SÉLECTIONNÉ
  // ============================================================
  useEffect(() => {
    if (!preselectedClient) return;
    const fetchPreselected = async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get(`/clients/${preselectedClient}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setSelectedClient(res.data);
        setClientSearch(res.data.name);
        setFormData(prev => ({ ...prev, client_id: res.data.id }));
      } catch (e) {
        console.error(e);
      }
    };
    fetchPreselected();
  }, [preselectedClient]);

  // ============================================================
  // CHARGEMENT DU STOCK QUAND CLIENT SÉLECTIONNÉ
  // ============================================================
  useEffect(() => {
    if (!formData.client_id) {
      setStockLines([]);
      return;
    }
    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get(
          `/client-stock/${formData.client_id}/client-stock/`,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        setStockLines(res.data.lignes || []);
      } catch (e) {
        console.error('Erreur stock client:', e);
        setStockLines([]);
      } finally {
        setLoadingStock(false);
      }
    };
    fetchStock();
  }, [formData.client_id]);

  // ============================================================
  // RECHERCHE CLIENTS
  // ============================================================
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) {
      setClients([]);
      return;
    }
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get('/clients/', {
          params: { search: clientSearch, page_size: 20 },
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setClients(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingClients(false);
      }
    };
    const t = setTimeout(fetchClients, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // ============================================================
  // SÉLECTIONS
  // ============================================================
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      product_id: '',
    }));
    setSelectedLigne(null);
    setProductSearch('');
    setShowClientDropdown(false);
    setErrors(prev => ({ ...prev, client_id: '' }));
  };

  const handleSelectLigne = (ligne) => {
    setSelectedLigne(ligne);
    setProductSearch(ligne.product_name);
    setFormData(prev => ({ ...prev, product_id: ligne.product }));
    setShowProductDropdown(false);
    setErrors(prev => ({ ...prev, product_id: '' }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Veuillez sélectionner un client';
    }
    if (!formData.product_id) {
      newErrors.product_id = 'Veuillez sélectionner un produit';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }
    if (selectedLigne && parseFloat(formData.quantity) > selectedLigne.quantity) {
      newErrors.quantity = `Stock insuffisant. Disponible: ${selectedLigne.quantity}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showNotification('Veuillez corriger les erreurs', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      await AxiosInstance.post('/client-stock/withdraw/', {
        client_id: parseInt(formData.client_id),
        product_id: parseInt(formData.product_id),
        quantity: parseFloat(formData.quantity),
        notes: formData.notes || '',
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification('Retrait effectué avec succès', 'success');
      setTimeout(() => navigate('/client-stocks'), 1500);
    } catch (error) {
      console.error('Erreur retrait:', error);
      const errorMsg =
        error.response?.data?.error ||
        (error.response?.data && Object.values(error.response.data)[0]?.[0]) ||
        'Erreur lors du retrait';
      showNotification(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrage des lignes de stock selon la recherche produit
  const filteredLines = stockLines.filter(l =>
    !productSearch ||
    l.product_name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    l.product_code?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {notification && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(null)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="w-full px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/client-stocks')}
                className="btn btn-ghost gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" /> Retour
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-error/10 rounded-xl">
                  <PackageMinus className="w-7 h-7 text-error" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Retrait de Marchandises
                  </h1>
                  <p className="text-sm text-gray-500">
                    Récupérer du stock chez un client
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="font-medium">Nouveau retrait</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-full px-6 sm:px-8 py-6">
        <form onSubmit={handleSubmit} className="w-full">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <User className="w-5 h-5 text-primary" />
                  Client
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="relative">
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Rechercher un client <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Nom, code ou téléphone..."
                      className={`input input-bordered w-full pl-10 h-12 ${errors.client_id ? 'input-error' : ''}`}
                      autoComplete="off"
                    />
                    {loadingClients && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {showClientDropdown && clients.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowClientDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        {clients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectClient(c)}
                            className="w-full text-left px-4 py-3 hover:bg-primary/5 flex items-center gap-3 border-b border-gray-100 last:border-0"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                              {c.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{c.name}</p>
                              <p className="text-xs text-gray-500 truncate">{c.code} • {c.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {errors.client_id && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {errors.client_id}
                    </p>
                  )}
                </div>

                {selectedClient && (
                  <div className="bg-primary/5 rounded-lg p-4 flex items-center gap-3 border border-primary/20">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                      {selectedClient.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{selectedClient.name}</p>
                      <p className="text-sm text-gray-500">{selectedClient.code} • {selectedClient.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Produit */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Package className="w-5 h-5 text-primary" />
                  Produit (dans le stock client)
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="relative">
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Sélectionner un produit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder={selectedClient ? "Nom ou code..." : "Sélectionnez d'abord un client"}
                      className={`input input-bordered w-full pl-10 h-12 ${errors.product_id ? 'input-error' : ''}`}
                      autoComplete="off"
                      disabled={!selectedClient || loadingStock}
                    />
                    {loadingStock && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {showProductDropdown && filteredLines.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProductDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        {filteredLines.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleSelectLigne(l)}
                            className="w-full text-left px-4 py-3 hover:bg-primary/5 flex items-center gap-3 border-b border-gray-100 last:border-0"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{l.product_name}</p>
                              <p className="text-xs text-gray-500 truncate">{l.product_code}</p>
                            </div>
                            <span className="text-xs font-bold text-primary shrink-0">
                              Stock: {l.quantity}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedClient && !loadingStock && stockLines.length === 0 && (
                    <p className="text-warning text-sm mt-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Ce client n'a aucun stock enregistré
                    </p>
                  )}

                  {errors.product_id && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {errors.product_id}
                    </p>
                  )}
                </div>

                {selectedLigne && (
                  <div className="bg-warning/5 rounded-lg p-4 flex items-center gap-3 border border-warning/20">
                    <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{selectedLigne.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Stock disponible: <strong>{selectedLigne.quantity}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantité */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Hash className="w-5 h-5 text-primary" />
                  Quantité à retirer
                </h3>
              </div>
              <div className="p-5">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Ex: 10"
                  className={`input input-bordered w-full h-12 text-base ${errors.quantity ? 'input-error' : ''}`}
                  disabled={!selectedLigne}
                />
                {selectedLigne && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, quantity: selectedLigne.quantity });
                      setErrors(prev => ({ ...prev, quantity: '' }));
                    }}
                    className="text-xs text-primary hover:underline mt-1.5 font-medium"
                  >
                    → Remplir avec le stock total ({selectedLigne.quantity})
                  </button>
                )}
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Notes (optionnel)
                </h3>
              </div>
              <div className="p-5">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Retour de marchandise..."
                  className="textarea textarea-bordered w-full min-h-[100px] resize-none text-base"
                />
              </div>
            </div>

          </div>

          {/* Boutons */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-base text-gray-600">
                {selectedLigne && formData.quantity && (
                  <span>
                    Stock après retrait:{' '}
                    <strong className="text-warning text-lg">
                      {Math.max(0, parseFloat(selectedLigne.quantity) - parseFloat(formData.quantity || 0))}
                    </strong>
                  </span>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/client-stocks')}
                  className="btn btn-ghost gap-2 flex-1 sm:flex-none h-12 px-6 text-base"
                  disabled={submitting}
                >
                  <X className="w-5 h-5" /> Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-error gap-2 flex-1 sm:flex-none h-12 px-8 text-base min-w-[200px]"
                  disabled={submitting || !selectedLigne}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer le retrait
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ClientStockWithdrawForm;