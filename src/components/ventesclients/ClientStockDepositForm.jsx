// src/components/ventesclients/ClientStockDepositForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, PackagePlus, Loader2, AlertCircle,
  CheckCircle, User, Package, Hash, Banknote, MessageSquare
} from 'lucide-react';

const ClientStockDepositForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get('client');

  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  // Listes complètes
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Sélections
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    client_id: preselectedClient || '',
    product_id: '',
    quantity: '',
    unit_price: '',
    notes: '',
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT COMPLET DES CLIENTS (au montage)
  // ============================================================
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const token = getToken();
        if (!token) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const res = await AxiosInstance.get('/clients/?page_size=1000', {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        // Trier par nom
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClients(data);

        // Si client présélectionné, le retrouver
        if (preselectedClient) {
          const found = data.find(c => c.id === parseInt(preselectedClient));
          if (found) {
            setSelectedClient(found);
            setFormData(prev => ({ ...prev, client_id: found.id }));
          }
        }
      } catch (e) {
        console.error('Erreur clients:', e);
        showNotification('Erreur de chargement des clients', 'error');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []); // eslint-disable-line

  // ============================================================
  // CHARGEMENT COMPLET DES PRODUITS (au montage)
  // ✅ CORRIGÉ : /products/ au lieu de /produits/
  // ============================================================
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const token = getToken();
        if (!token) return;

        const res = await AxiosInstance.get(
          '/products/?page_size=1000&status=active',
          { headers: { 'Authorization': `Token ${token}` } }
        );
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        // Trier par nom
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setProducts(data);
      } catch (e) {
        console.error('Erreur produits:', e);
        showNotification('Erreur de chargement des produits', 'error');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []); // eslint-disable-line

  // ============================================================
  // SÉLECTION CLIENT
  // ============================================================
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setFormData(prev => ({ ...prev, client_id: clientId }));
    const found = clients.find(c => c.id === parseInt(clientId));
    setSelectedClient(found || null);
    setErrors(prev => ({ ...prev, client_id: '' }));
  };

  // ============================================================
  // SÉLECTION PRODUIT
  // ============================================================
  const handleProductChange = (e) => {
    const productId = e.target.value;
    const found = products.find(p => p.id === parseInt(productId));
    setSelectedProduct(found || null);
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      unit_price: found ? (found.selling_price || found.purchase_price || 0) : '',
    }));
    setErrors(prev => ({ ...prev, product_id: '' }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.client_id) newErrors.client_id = 'Veuillez sélectionner un client';
    if (!formData.product_id) newErrors.product_id = 'Veuillez sélectionner un produit';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }
    if (formData.unit_price && parseFloat(formData.unit_price) < 0) {
      newErrors.unit_price = 'Le prix ne peut pas être négatif';
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

      await AxiosInstance.post('/client-stock/deposit/', {
        client_id: parseInt(formData.client_id),
        product_id: parseInt(formData.product_id),
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price) || 0,
        notes: formData.notes || '',
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification('Dépôt enregistré avec succès', 'success');
      setTimeout(() => navigate('/client-stocks'), 1500);
    } catch (error) {
      console.error('Erreur dépôt:', error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error.response?.data && Object.values(error.response.data)[0]?.[0]) ||
        'Erreur lors de l\'enregistrement';
      showNotification(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 FCFA';
    return `${Number(amount).toLocaleString('fr-FR')} FCFA`;
  };

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {notification && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
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
                <div className="p-3 bg-success/10 rounded-xl">
                  <PackagePlus className="w-7 h-7 text-success" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Dépôt de Marchandises</h1>
                  <p className="text-sm text-gray-500">Ajouter du stock chez un client</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="font-medium">Nouveau dépôt</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 sm:px-8 py-6">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

            {/* ============ CLIENT ============ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <User className="w-5 h-5 text-primary" />
                  Client
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Sélectionner un client <span className="text-red-500">*</span>
                  </label>

                  {loadingClients ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-gray-500">Chargement des clients...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.client_id}
                      onChange={handleClientChange}
                      className={`select select-bordered w-full h-12 text-base ${errors.client_id ? 'select-error' : ''}`}
                    >
                      <option value="">-- Choisir un client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.code ? `(${c.code})` : ''} {c.phone ? `- ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {clients.length} client(s) disponible(s)
                  </p>

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
                      <p className="text-sm text-gray-500">
                        {selectedClient.code} • {selectedClient.phone}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* ============ PRODUIT ============ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Package className="w-5 h-5 text-primary" />
                  Produit
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="label text-sm font-medium text-gray-700 pb-1">
                    Sélectionner un produit <span className="text-red-500">*</span>
                  </label>

                  {loadingProducts ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-gray-500">Chargement des produits...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.product_id}
                      onChange={handleProductChange}
                      className={`select select-bordered w-full h-12 text-base ${errors.product_id ? 'select-error' : ''}`}
                    >
                      <option value="">-- Choisir un produit --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.code ? `(${p.code})` : ''} — Stock: {p.current_stock || 0} — {Number(p.selling_price || 0).toLocaleString('fr-FR')} F
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {products.length} produit(s) disponible(s)
                  </p>

                  {errors.product_id && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {errors.product_id}
                    </p>
                  )}
                </div>

                {selectedProduct && (
                  <div className="bg-primary/5 rounded-lg p-4 flex items-center gap-3 border border-primary/20">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedProduct.code} • Prix: {formatCurrency(selectedProduct.selling_price)}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* ============ QUANTITÉ ============ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Hash className="w-5 h-5 text-primary" />
                  Quantité
                </h3>
              </div>
              <div className="p-5">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Ex: 50"
                  className={`input input-bordered w-full h-12 text-base ${errors.quantity ? 'input-error' : ''}`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>

            {/* ============ PRIX ============ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200">
                <h3 className="font-semibold flex items-center gap-2.5 text-gray-700">
                  <Banknote className="w-5 h-5 text-primary" />
                  Prix unitaire (FCFA)
                </h3>
              </div>
              <div className="p-5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="Ex: 1000"
                  className={`input input-bordered w-full h-12 text-base ${errors.unit_price ? 'input-error' : ''}`}
                />
                {errors.unit_price && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.unit_price}
                  </p>
                )}
              </div>
            </div>

            {/* ============ NOTES ============ */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  placeholder="Ex: Dépôt pour revente..."
                  className="textarea textarea-bordered w-full min-h-[100px] resize-none text-base"
                />
              </div>
            </div>

          </div>

          {/* Boutons */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-base text-gray-600">
                {formData.quantity && formData.unit_price && (
                  <span>
                    Valeur totale:{' '}
                    <strong className="text-primary text-lg">
                      {formatCurrency(
                        parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0)
                      )}
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
                  className="btn btn-success gap-2 flex-1 sm:flex-none h-12 px-8 text-base min-w-[200px]"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer le dépôt
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

export default ClientStockDepositForm;