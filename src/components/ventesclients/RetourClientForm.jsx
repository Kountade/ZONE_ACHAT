// src/components/retours-clients/RetourClientForm.jsx
// ============================================================
// VERSION PROFESSIONNELLE - Style AssuranceForm
// ============================================================

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Undo2,
  FileText, Package, CheckSquare, Square, Calculator, User,
  DollarSign, Info, Eye, AlertTriangle, Sparkles, Receipt,
  Box, TrendingDown, RefreshCw, X, Building2, Tag,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary RetourClientForm:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200/40 p-6 flex items-center justify-center">
          <div className="bg-base-100 rounded-2xl shadow-lg p-8 max-w-2xl w-full border border-base-300">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le formulaire</h2>
            </div>
            <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-auto max-h-64 text-error">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recharger
              </button>
              <button
                onClick={() => window.location.href = '/retours-clients'}
                className="btn btn-ghost"
              >
                Retour aux retours
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const RetourClientFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const hasFetchedRef = useRef(false);

  // États
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementVentes, setChargementVentes] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  // Données
  const [clients, setClients] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [saleDetails, setSaleDetails] = useState(null);
  const [existingAvoirs, setExistingAvoirs] = useState({});

  // Formulaire
  const [formData, setFormData] = useState({
    client: '',
    sale: '',
    type: 'refund',
    reason: '',
    notes: '',
    restore_stock: true,
    lignes: [],
  });

  const getToken = () => localStorage.getItem('Token');

  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    const headers = { Authorization: `Token ${token}` };

    const loadData = async () => {
      setChargementInitial(true);
      try {
        // Clients
        const clRes = await AxiosInstance.get(
          '/clients/?page_size=1000',
          { headers }
        ).catch(() => ({ data: [] }));
        if (!isMounted) return;
        setClients(normalizeData(clRes.data));

        // Édition
        if (isEdit) {
          const avRes = await AxiosInstance.get(`/avoirs/${id}/`, { headers });
          if (!isMounted) return;
          const d = avRes.data;
          setFormData({
            client: d.client || '',
            sale: d.sale || '',
            type: d.type || 'refund',
            reason: d.reason || '',
            notes: d.notes || '',
            restore_stock: false,
            lignes: [],
          });
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 401) navigate('/login');
          else if (err.response?.status === 404 && isEdit) {
            setErreur('Retour non trouvé');
            setTimeout(() => navigate('/retours-clients'), 1500);
          } else setErreur('Erreur de chargement');
        }
      } finally {
        if (isMounted) setChargementInitial(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [id, isEdit, navigate]);

  // ============================================================
  // CHARGEMENT DES VENTES
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    if (!formData.client) {
      setVentes([]);
      setSaleDetails(null);
      return;
    }

    const fetchVentes = async () => {
      setChargementVentes(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get(
          `/sales/?client=${formData.client}&status=paid,delivered,confirmed`,
          { headers: { Authorization: `Token ${token}` } }
        );
        if (!isMounted) return;
        setVentes(normalizeData(res.data));
      } catch {
        if (isMounted) setVentes([]);
      } finally {
        if (isMounted) setChargementVentes(false);
      }
    };

    fetchVentes();
    return () => { isMounted = false; };
  }, [formData.client]);

  // ============================================================
  // CHARGEMENT DÉTAILS VENTE
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    if (!formData.sale) {
      setSaleDetails(null);
      setExistingAvoirs({});
      return;
    }

    const fetchSaleDetails = async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Token ${token}` };

        // Détails vente
        const saleRes = await AxiosInstance.get(
          `/sales/${formData.sale}/`,
          { headers }
        );
        if (!isMounted) return;
        const sale = saleRes.data;
        setSaleDetails(sale);

        // Avoirs existants
        const avoirsRes = await AxiosInstance.get(
          `/avoirs/?sale=${formData.sale}`,
          { headers }
        );
        if (!isMounted) return;
        const avoirsList = normalizeData(avoirsRes.data);

        const dejaRetournes = {};
        for (const avoir of avoirsList) {
          if (avoir.lignes && Array.isArray(avoir.lignes)) {
            for (const ligne of avoir.lignes) {
              if (ligne.ligne_vente) {
                const key = ligne.ligne_vente;
                dejaRetournes[key] =
                  (dejaRetournes[key] || 0) + parseFloat(ligne.quantity || 0);
              }
            }
          }
        }
        setExistingAvoirs(dejaRetournes);

        // Initialisation des lignes
        const initialLignes = (sale.lines || []).map((line) => {
          const dejaRetourne = dejaRetournes[line.id] || 0;
          const restant = line.quantity - dejaRetourne;
          return {
            product: line.product,
            product_name: line.product_name || line.product?.name || 'Produit',
            product_code: line.product_code || line.product?.code || '',
            ligne_vente: line.id,
            quantity_sold: parseFloat(line.quantity) || 0,
            quantity_already_returned: dejaRetourne,
            quantity_remaining: restant,
            quantity: 0,
            unit_price: parseFloat(line.unit_price) || 0,
            discount: parseFloat(line.discount) || 0,
            selected: false,
            max_returnable: restant,
          };
        });

        setFormData((prev) => ({ ...prev, lignes: initialLignes }));
      } catch (err) {
        if (isMounted) setErreur('Impossible de charger les détails de la vente');
      }
    };

    fetchSaleDetails();
    return () => { isMounted = false; };
  }, [formData.sale]);

  // ============================================================
  // CALCULS MÉMOÏSÉS
  // ============================================================
  const lignesSelectionnees = useMemo(
    () => formData.lignes.filter((l) => l.selected && l.quantity > 0),
    [formData.lignes]
  );

  const totalRetour = useMemo(() => {
    return lignesSelectionnees.reduce((sum, l) => {
      const lineTotal = l.quantity * l.unit_price;
      const lineDiscount =
        l.quantity_sold > 0 ? (l.discount * l.quantity) / l.quantity_sold : 0;
      return sum + (lineTotal - lineDiscount);
    }, 0);
  }, [lignesSelectionnees]);

  const nombreProduits = lignesSelectionnees.length;
  const quantiteTotale = lignesSelectionnees.reduce(
    (s, l) => s + l.quantity,
    0
  );

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleClientChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      client: e.target.value,
      sale: '',
      lignes: [],
    }));
  };

  const toggleLineSelection = (index) => {
    const newLignes = [...formData.lignes];
    const ligne = newLignes[index];

    if (!ligne.selected && ligne.max_returnable <= 0) {
      setErreur(`Aucune quantité restante pour ${ligne.product_name}`);
      setTimeout(() => setErreur(null), 3000);
      return;
    }

    ligne.selected = !ligne.selected;
    if (!ligne.selected) {
      ligne.quantity = 0;
    } else if (ligne.quantity === 0) {
      ligne.quantity = Math.min(1, ligne.max_returnable);
    }

    setFormData((prev) => ({ ...prev, lignes: newLignes }));
  };

  const updateLineQuantity = (index, value) => {
    const newLignes = [...formData.lignes];
    let qty = parseFloat(value) || 0;

    if (qty < 0) qty = 0;
    if (qty > newLignes[index].max_returnable) {
      qty = newLignes[index].max_returnable;
    }

    newLignes[index].quantity = qty;
    newLignes[index].selected = qty > 0;
    setFormData((prev) => ({ ...prev, lignes: newLignes }));
  };

  const selectAll = () => {
    const newLignes = formData.lignes.map((l) => ({
      ...l,
      selected: l.max_returnable > 0,
      quantity:
        l.max_returnable > 0
          ? l.quantity > 0
            ? l.quantity
            : l.max_returnable
          : 0,
    }));
    setFormData((prev) => ({ ...prev, lignes: newLignes }));
  };

  const deselectAll = () => {
    const newLignes = formData.lignes.map((l) => ({
      ...l,
      selected: false,
      quantity: 0,
    }));
    setFormData((prev) => ({ ...prev, lignes: newLignes }));
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement) return;

    setErreur(null);
    setSucces(false);

    if (!formData.client) {
      setErreur('Sélectionnez un client');
      return;
    }
    if (!formData.sale) {
      setErreur('Sélectionnez une vente');
      return;
    }
    if (!formData.reason.trim()) {
      setErreur('La raison est obligatoire');
      return;
    }

    const lignesValides = formData.lignes.filter(
      (l) => l.selected && l.quantity > 0
    );
    if (lignesValides.length === 0) {
      setErreur('Sélectionnez au moins un produit à retourner');
      return;
    }

    for (const ligne of lignesValides) {
      if (ligne.quantity > ligne.max_returnable) {
        setErreur(
          `Quantité trop élevée pour ${ligne.product_name} (max : ${ligne.max_returnable})`
        );
        return;
      }
    }

    setChargement(true);

    try {
      const token = getToken();
      const headers = { Authorization: `Token ${token}` };

      const dataToSend = {
        client: parseInt(formData.client, 10),
        sale: parseInt(formData.sale, 10),
        type: formData.type,
        reason: formData.reason.trim(),
        notes: formData.notes.trim() || '',
        restore_stock: formData.restore_stock,
        lignes: lignesValides.map((l) => ({
          product: l.product,
          ligne_vente: l.ligne_vente,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount:
            l.quantity_sold > 0
              ? (l.discount * l.quantity) / l.quantity_sold
              : 0,
        })),
      };

      let response;
      if (isEdit) {
        response = await AxiosInstance.put(`/avoirs/${id}/`, dataToSend, { headers });
      } else {
        response = await AxiosInstance.post('/avoirs/', dataToSend, { headers });
      }

      setSucces(true);
      setTimeout(() => {
        const avoirId = response.data?.avoir?.id || response.data?.id || id;
        navigate(`/retours-clients/${avoirId}`);
      }, 1200);
    } catch (err) {
      let msg = 'Erreur lors de la sauvegarde';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.lignes) {
          msg = Array.isArray(data.lignes) ? data.lignes[0] : data.lignes;
        } else if (data.error) msg = data.error;
        else if (data.detail) msg = data.detail;
        else if (typeof data === 'object') {
          const firstError = Object.values(data).flat()[0];
          if (firstError) msg = String(firstError);
        }
      }
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formaterMontant = (n) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' CFA';

  const getClientName = (clId) => {
    const cl = clients.find((c) => String(c.id) === String(clId));
    return cl ? `${cl.name} (${cl.code})` : '—';
  };

  const getTypeLabel = (type) => {
    const labels = {
      refund: 'Remboursement',
      return: 'Retour marchandise',
      discount: 'Remise',
      error: 'Erreur facturation',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'refund': return <DollarSign className="w-5 h-5" />;
      case 'return': return <Box className="w-5 h-5" />;
      case 'discount': return <Tag className="w-5 h-5" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      default: return <Undo2 className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'refund': return 'primary';
      case 'return': return 'info';
      case 'discount': return 'warning';
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  // ============================================================
  // LOADER INITIAL
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  const typeColor = getTypeColor(formData.type);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/retours-clients')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Retours clients / <span className="text-primary">{isEdit ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Undo2 className="w-5 h-5 text-primary" />
              {isEdit ? 'Modifier le retour' : 'Nouveau retour client'}
            </h1>
          </div>
          <div className="badge badge-primary hidden sm:flex">
            {isEdit ? 'Édition' : 'Création'}
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Retour {isEdit ? 'modifié' : 'créé'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
          <button
            className="btn btn-ghost btn-xs btn-circle ml-auto"
            onClick={() => setErreur(null)}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* COLONNE PRINCIPALE (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1 : Informations générales */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <User className="w-3 h-3 mr-1 inline" /> Client{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="client"
                        className="select select-bordered w-full"
                        value={formData.client}
                        onChange={handleClientChange}
                        required
                      >
                        <option value="">— Sélectionner ({clients.length}) —</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Receipt className="w-3 h-3 mr-1 inline" /> Vente{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="sale"
                        className="select select-bordered w-full"
                        value={formData.sale}
                        onChange={handleChange}
                        disabled={!formData.client || chargementVentes}
                        required
                      >
                        <option value="">
                          {chargementVentes
                            ? 'Chargement...'
                            : `— Sélectionner (${ventes.length}) —`}
                        </option>
                        {ventes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.invoice_number} - {formaterMontant(v.total)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Undo2 className="w-3 h-3 mr-1 inline" /> Type de
                          retour <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="refund">Remboursement</option>
                        <option value="return">Retour marchandise</option>
                        <option value="discount">Remise</option>
                        <option value="error">Erreur facturation</option>
                      </select>
                    </div>

                    {(formData.type === 'refund' || formData.type === 'return') && (
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">
                            Option
                          </span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-3 py-2 bg-warning/5 rounded-lg border border-warning/20 px-3">
                          <input
                            type="checkbox"
                            name="restore_stock"
                            className="toggle toggle-warning"
                            checked={formData.restore_stock}
                            onChange={handleChange}
                          />
                          <span className="label-text text-sm font-medium flex items-center gap-2">
                            <Box className="w-4 h-4 text-warning" />
                            Restaurer le stock
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Raison du
                        retour <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="reason"
                      className="textarea textarea-bordered w-full"
                      value={formData.reason}
                      onChange={handleChange}
                      rows="2"
                      maxLength="500"
                      placeholder="Ex : Produit défectueux, erreur de facturation..."
                      required
                    ></textarea>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Notes
                        internes
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Notes pour usage interne (optionnel)"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Produits à retourner */}
            {saleDetails && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <h2 className="font-semibold text-sm">
                        Produits à retourner
                        {nombreProduits > 0 && (
                          <span className="badge badge-warning badge-sm ml-2">
                            {nombreProduits} sélectionné(s)
                          </span>
                        )}
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="btn btn-outline btn-xs gap-1"
                        disabled={formData.lignes.every((l) => l.max_returnable <= 0)}
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span className="hidden sm:inline">Tout</span>
                      </button>
                      <button
                        type="button"
                        onClick={deselectAll}
                        className="btn btn-outline btn-xs gap-1"
                        disabled={nombreProduits === 0}
                      >
                        <Square className="w-3 h-3" />
                        <span className="hidden sm:inline">Aucun</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Info vente */}
                    <div className="alert alert-info py-2">
                      <Info className="w-4 h-4" />
                      <div className="text-xs flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Facture :</strong> {saleDetails.invoice_number}
                        </span>
                        <span>
                          <strong>Date :</strong>{' '}
                          {new Date(saleDetails.sale_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span>
                          <strong>Total :</strong>{' '}
                          <span className="font-mono font-bold text-primary">
                            {formaterMontant(saleDetails.total)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Alerte retours antérieurs */}
                    {Object.keys(existingAvoirs).length > 0 && (
                      <div className="alert alert-warning py-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">
                          Certains produits ont déjà fait l'objet de retours
                          antérieurs. La quantité max est ajustée automatiquement.
                        </span>
                      </div>
                    )}

                    {/* Tableau */}
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead className="bg-base-200/50">
                          <tr>
                            <th className="w-10"></th>
                            <th>Produit</th>
                            <th className="text-center w-16">Vendu</th>
                            <th className="text-center w-20">Retourné</th>
                            <th className="text-center w-20">Max</th>
                            <th className="text-center w-24">Qté retour</th>
                            <th className="text-right w-28">Sous-total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.lignes.map((ligne, index) => {
                            const epuise = ligne.max_returnable <= 0;
                            const sousTotal = ligne.quantity * ligne.unit_price;

                            return (
                              <tr
                                key={index}
                                className={`border-b border-base-200 ${
                                  epuise ? 'opacity-40' : ''
                                } ${ligne.selected ? 'bg-warning/5' : ''}`}
                              >
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-warning checkbox-sm"
                                    checked={ligne.selected}
                                    onChange={() => toggleLineSelection(index)}
                                    disabled={epuise}
                                  />
                                </td>
                                <td>
                                  <p className="font-medium text-sm">
                                    {ligne.product_name}
                                  </p>
                                  {ligne.product_code && (
                                    <p className="text-xs text-base-content/40 font-mono">
                                      {ligne.product_code}
                                    </p>
                                  )}
                                </td>
                                <td className="text-center text-sm font-mono">
                                  {ligne.quantity_sold}
                                </td>
                                <td className="text-center">
                                  {ligne.quantity_already_returned > 0 ? (
                                    <span className="badge badge-error badge-sm font-mono">
                                      {ligne.quantity_already_returned}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-base-content/40">—</span>
                                  )}
                                </td>
                                <td className="text-center">
                                  {epuise ? (
                                    <span className="badge badge-ghost badge-sm">
                                      Épuisé
                                    </span>
                                  ) : (
                                    <span className="badge badge-success badge-sm font-mono">
                                      {ligne.max_returnable}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="input input-bordered input-sm w-20 text-center font-mono"
                                    value={ligne.quantity || 0}
                                    onChange={(e) =>
                                      updateLineQuantity(index, e.target.value)
                                    }
                                    min="0"
                                    max={ligne.max_returnable}
                                    step="1"
                                    disabled={!ligne.selected || epuise}
                                  />
                                </td>
                                <td className="text-right font-mono font-semibold text-sm">
                                  {ligne.quantity > 0 ? (
                                    <span className="text-warning">
                                      {formaterMontant(sousTotal)}
                                    </span>
                                  ) : (
                                    <span className="text-base-content/30">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {formData.lignes.length === 0 && (
                            <tr>
                              <td colSpan="7" className="text-center py-8 text-base-content/40">
                                Aucun produit dans cette vente
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Récap dans la card */}
                    {nombreProduits > 0 && (
                      <div className="bg-gradient-to-r from-warning/10 to-warning/5 rounded-lg p-4 border border-warning/20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-base-content/60">
                              Produits
                            </p>
                            <p className="font-bold text-warning text-lg">
                              {nombreProduits}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-base-content/60">
                              Quantité
                            </p>
                            <p className="font-bold text-warning text-lg">
                              {quantiteTotale}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-base-content/60">Type</p>
                            <p className="font-bold text-sm">
                              {getTypeLabel(formData.type)}
                            </p>
                          </div>
                          <div className="md:text-right">
                            <p className="text-xs text-base-content/60">
                              Montant
                            </p>
                            <p className="font-mono font-bold text-error text-lg">
                              {formaterMontant(totalRetour)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLONNE APERÇU (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm sticky top-20">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-${typeColor}/20 flex items-center justify-center flex-shrink-0`}>
                      {getTypeIcon(formData.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {saleDetails?.invoice_number || 'RETOUR'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {getTypeLabel(formData.type)}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Client :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {getClientName(formData.client)}
                      </span>
                    </div>
                    {formData.restore_stock && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Stock :</span>
                        <span className="text-success text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Restauré
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Produits :</span>
                      <span className="font-mono font-bold">{nombreProduits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Quantité :</span>
                      <span className="font-mono font-bold">{quantiteTotale}</span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Total retour :</span>
                    <span className="font-mono font-bold text-error text-base">
                      {formaterMontant(totalRetour)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Retour partiel</p>
                    <p className="text-base-content/70">
                      Vous pouvez retourner une <strong>quantité partielle</strong> par
                      produit. Les retours antérieurs sont déduits automatiquement
                      pour éviter les doublons.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil */}
            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Cochez <strong>Restaurer le stock</strong> uniquement si
                      les produits sont réintégrables en stock (pas les produits
                      défectueux).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <div className="hidden md:block mr-auto text-sm">
              {nombreProduits > 0 ? (
                <>
                  <span className="text-base-content/60">Total retour : </span>
                  <span className="font-mono font-bold text-error">
                    {formaterMontant(totalRetour)}
                  </span>
                </>
              ) : (
                <span className="text-base-content/40">
                  Aucun produit sélectionné
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/retours-clients')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-warning gap-2 min-w-[180px]"
              disabled={chargement || nombreProduits === 0}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />{' '}
                  {isEdit ? 'Enregistrer' : 'Créer le retour'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// WRAPPER AVEC ERROR BOUNDARY
// ============================================================
const RetourClientForm = () => (
  <ErrorBoundary>
    <RetourClientFormContent />
  </ErrorBoundary>
);

export default RetourClientForm;