// src/components/paiements/PaiementForm.jsx
// ============================================================
// VERSION PROFESSIONNELLE - Style AssuranceForm
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, CreditCard,
  FileText, Wallet, Hash, MessageSquare, Banknote, Smartphone,
  Landmark, Info, Eye, Calculator, Receipt, User, Calendar,
  TrendingUp, TrendingDown, Sparkles, X,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';
import FactureSearchSelect from './FactureSearchSelect';

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
    console.error('ErrorBoundary PaiementForm:', error, errorInfo);
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
                onClick={() => window.location.href = '/paiements'}
                className="btn btn-ghost"
              >
                Retour aux paiements
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
// MÉTHODES DE PAIEMENT
// ============================================================
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: Banknote, color: 'success' },
  { value: 'card', label: 'Carte', icon: CreditCard, color: 'primary' },
  { value: 'check', label: 'Chèque', icon: FileText, color: 'warning' },
  { value: 'transfer', label: 'Virement', icon: Landmark, color: 'info' },
  { value: 'mobile_money', label: 'Mobile', icon: Smartphone, color: 'secondary' },
  { value: 'credit', label: 'Crédit', icon: Wallet, color: 'error' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const PaiementFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const hasFetchedRef = useRef(false);

  // États
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedFacture, setSelectedFacture] = useState(null);

  // Formulaire
  const [formData, setFormData] = useState({
    facture: '',
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
  });

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT INITIAL (édition uniquement)
  // ============================================================
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;

    const loadPaiement = async () => {
      if (!isEdit) {
        setChargementInitial(false);
        return;
      }

      try {
        const token = getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await AxiosInstance.get(`/payments/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        if (!isMounted) return;
        const d = res.data;
        setFormData({
          facture: d.facture || '',
          amount: d.amount || '',
          method: d.method || 'cash',
          reference: d.reference || '',
          notes: d.notes || '',
        });
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 401) {
            navigate('/login');
          } else if (err.response?.status === 404) {
            setErreur('Paiement non trouvé');
            setTimeout(() => navigate('/paiements'), 1500);
          } else {
            setErreur('Erreur de chargement du paiement');
          }
        }
      } finally {
        if (isMounted) setChargementInitial(false);
      }
    };

    loadPaiement();
    return () => { isMounted = false; };
  }, [id, isEdit, navigate]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFactureSelect = (factureId, facture) => {
    setFormData((prev) => ({ ...prev, facture: factureId, amount: '' }));
    setSelectedFacture(facture);
    setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const resetForm = () => {
    setFormData({
      facture: '',
      amount: '',
      method: 'cash',
      reference: '',
      notes: '',
    });
    setSelectedFacture(null);
    setErrors({});
  };

  // ============================================================
  // VALIDATION DU MONTANT
  // ============================================================
  const validateAmount = (value) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, message: 'Le montant doit être supérieur à 0' };
    }
    if (selectedFacture) {
      const remaining = selectedFacture.remaining_amount || selectedFacture.total;
      if (amount > remaining) {
        return {
          valid: false,
          message: `Montant maximum : ${formaterMontant(remaining)}`,
        };
      }
    }
    return { valid: true, message: '' };
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement) return;

    setErreur(null);
    setSucces(false);

    if (!formData.facture) {
      setErreur('Sélectionnez une facture.');
      return;
    }

    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.valid) {
      setErreur(amountValidation.message);
      return;
    }

    setChargement(true);

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Token ${token}` };
      const dataToSend = {
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference: formData.reference || '',
        notes: formData.notes || '',
      };

      if (isEdit) {
        await AxiosInstance.put(`/payments/${id}/`, dataToSend, { headers });
        setSucces(true);
        setTimeout(() => navigate('/paiements'), 1200);
      } else {
        await AxiosInstance.post(
          `/factures/${formData.facture}/register_payment/`,
          dataToSend,
          { headers }
        );
        setSucces(true);
        // Rester sur la page et réinitialiser
        resetForm();
        setTimeout(() => setSucces(false), 2000);
      }
    } catch (err) {
      let msg = "Erreur lors de l'enregistrement";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) msg = data.error;
        else if (data.message) msg = data.message;
        else if (typeof data === 'string') msg = data;
        else if (typeof data === 'object') {
          msg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join(' | ');
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

  const getStatusBadge = (status) => {
    const configs = {
      sent: { label: 'Envoyée', className: 'badge-info' },
      overdue: { label: 'En retard', className: 'badge-error' },
      draft: { label: 'Brouillon', className: 'badge-ghost' },
      paid: { label: 'Payée', className: 'badge-success' },
      partial: { label: 'Partielle', className: 'badge-warning' },
      cancelled: { label: 'Annulée', className: 'badge-ghost' },
    };
    return configs[status] || { label: status, className: 'badge-ghost' };
  };

  // Calculs mémoïsés
  const montantPaye = useMemo(() => {
    if (!selectedFacture) return 0;
    const total = parseFloat(selectedFacture.total) || 0;
    const restant = parseFloat(
      selectedFacture.remaining_amount ?? selectedFacture.total
    );
    return total - restant;
  }, [selectedFacture]);

  const resteAPayer = useMemo(() => {
    if (!selectedFacture) return 0;
    return parseFloat(
      selectedFacture.remaining_amount ?? selectedFacture.total
    );
  }, [selectedFacture]);

  const montantSaisi = parseFloat(formData.amount) || 0;
  const nouveauReste = Math.max(0, resteAPayer - montantSaisi);

  const methodeSelectionnee = PAYMENT_METHODS.find(
    (m) => m.value === formData.method
  );

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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/paiements')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Paiements / <span className="text-primary">{isEdit ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <CreditCard className="w-5 h-5 text-primary" />
              {isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}
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
          <span>Paiement {isEdit ? 'modifié' : 'enregistré'} avec succès !</span>
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
            {/* SECTION 1 : Facture */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">Facture</h2>
                  </div>
                  {selectedFacture && (
                    <span className={`badge badge-sm ${getStatusBadge(selectedFacture.status).className}`}>
                      {getStatusBadge(selectedFacture.status).label}
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Sélectionner
                        une facture <span className="text-error">*</span>
                      </span>
                    </label>
                    <FactureSearchSelect
                      value={formData.facture}
                      onChange={handleFactureSelect}
                      placeholder="Rechercher par client, n° facture, téléphone..."
                    />
                    {!formData.facture && (
                      <span className="text-warning text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Recherchez et sélectionnez une facture
                      </span>
                    )}
                  </div>

                  {/* Détails facture */}
                  {selectedFacture ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-base-200/50 rounded-lg p-3">
                          <p className="text-xs text-base-content/60 mb-1">
                            N° Facture
                          </p>
                          <p className="font-mono font-semibold text-sm truncate">
                            {selectedFacture.invoice_number}
                          </p>
                        </div>
                        <div className="bg-base-200/50 rounded-lg p-3">
                          <p className="text-xs text-base-content/60 mb-1">
                            Client
                          </p>
                          <p className="font-semibold text-sm truncate">
                            {selectedFacture.client_name}
                          </p>
                        </div>
                        <div className="bg-base-200/50 rounded-lg p-3">
                          <p className="text-xs text-base-content/60 mb-1">
                            Total
                          </p>
                          <p className="font-mono font-semibold text-sm">
                            {formaterMontant(selectedFacture.total)}
                          </p>
                        </div>
                        <div className="bg-success/10 rounded-lg p-3">
                          <p className="text-xs text-success mb-1">
                            Reste à payer
                          </p>
                          <p className="font-mono font-bold text-sm text-success">
                            {formaterMontant(resteAPayer)}
                          </p>
                        </div>
                      </div>

                      {/* Récapitulatif */}
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Récapitulatif
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-base-content/60">
                              Total facture
                            </span>
                            <span className="font-mono">
                              {formaterMontant(selectedFacture.total)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/60">
                              Déjà payé
                            </span>
                            <span className="font-mono">
                              {formaterMontant(montantPaye)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-primary/20 pt-2">
                            <span className="font-medium">Reste à payer</span>
                            <span className="font-mono font-bold text-success">
                              {formaterMontant(resteAPayer)}
                            </span>
                          </div>
                          {montantSaisi > 0 && (
                            <div className="flex justify-between text-primary pt-2 border-t border-primary/20">
                              <span className="font-medium">
                                Paiement en cours
                              </span>
                              <span className="font-mono font-bold">
                                +{formaterMontant(montantSaisi)}
                              </span>
                            </div>
                          )}
                          {montantSaisi > 0 && (
                            <div className="flex justify-between border-t border-dashed border-primary/30 pt-2">
                              <span className="font-medium">
                                Nouveau solde
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  nouveauReste === 0
                                    ? 'text-success'
                                    : 'text-warning'
                                }`}
                              >
                                {formaterMontant(nouveauReste)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-base-content/40">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        Aucune facture sélectionnée
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2 : Montant & Méthode */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Montant & Méthode</h2>
                </div>
                <div className="p-5 space-y-5">
                  {/* Montant */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <Banknote className="w-3 h-3 mr-1 inline" /> Montant
                        (CFA) <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Banknote className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="number"
                        name="amount"
                        className={`input input-bordered w-full pl-10 pr-16 font-mono text-lg ${
                          errors.amount ? 'input-error' : ''
                        }`}
                        value={formData.amount}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        placeholder="0"
                        disabled={!selectedFacture}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40 font-medium">
                        CFA
                      </span>
                    </div>
                    {errors.amount && (
                      <span className="text-error text-xs mt-1">{errors.amount}</span>
                    )}
                    {selectedFacture && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              amount: resteAPayer,
                            }));
                            setErrors((prev) => ({ ...prev, amount: '' }));
                          }}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          → Payer le solde restant ({formaterMontant(resteAPayer)})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Méthode */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <CreditCard className="w-3 h-3 mr-1 inline" /> Méthode
                        de paiement <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = formData.method === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, method: method.value }))
                            }
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-base-300 hover:border-base-content/30 text-base-content/60'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                isSelected ? 'text-primary' : 'text-base-content/40'
                              }`}
                            />
                            <span className="truncate">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 : Référence & Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Détails complémentaires</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <Hash className="w-3 h-3 mr-1 inline" /> Référence
                      </span>
                    </label>
                    <input
                      type="text"
                      name="reference"
                      className="input input-bordered w-full font-mono"
                      value={formData.reference}
                      onChange={handleChange}
                      maxLength="100"
                      placeholder="N° de chèque, transaction, code de validation..."
                    />
                    <span className="text-xs text-base-content/40 mt-1">
                      Ex : N° de chèque, numéro de transaction, code de validation
                    </span>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <MessageSquare className="w-3 h-3 mr-1 inline" /> Notes
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Informations complémentaires..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE APERÇU (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Aperçu */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm sticky top-20">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {selectedFacture?.invoice_number || 'N° FACTURE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {selectedFacture?.client_name || 'Client'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Facture :</span>
                      <span className="font-mono">
                        {formaterMontant(selectedFacture?.total || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Reste :</span>
                      <span className="font-mono text-warning">
                        {formaterMontant(resteAPayer)}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Méthode :</span>
                      <span className="font-medium">
                        {methodeSelectionnee?.label || '—'}
                      </span>
                    </div>
                    {formData.reference && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Référence :</span>
                        <span className="font-mono text-[10px] truncate ml-2 max-w-[120px]">
                          {formData.reference}
                        </span>
                      </div>
                    )}
                  </div>

                  {montantSaisi > 0 && (
                    <>
                      <div className="divider my-3"></div>
                      <div className="bg-success/10 rounded-lg p-3 border border-success/30">
                        <p className="text-xs text-success font-medium mb-1">
                          Montant du paiement
                        </p>
                        <p className="font-mono font-bold text-base text-success">
                          {formaterMontant(montantSaisi)}
                        </p>
                        <p className="text-xs text-base-content/60 mt-2">
                          Nouveau solde :{' '}
                          <span
                            className={`font-mono font-bold ${
                              nouveauReste === 0 ? 'text-success' : 'text-warning'
                            }`}
                          >
                            {formaterMontant(nouveauReste)}
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Un paiement peut être <strong>partiel</strong>. Le solde
                      restant sera recalculé automatiquement. Une facture est
                      marquée "Payée" quand le total est atteint.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerte montant complet */}
            {montantSaisi > 0 && nouveauReste === 0 && (
              <div className="card bg-success/5 border border-success/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-success mb-1">
                        Paiement complet
                      </p>
                      <p className="text-base-content/70">
                        Ce paiement <strong>solde entièrement</strong> la
                        facture. Elle sera marquée comme "Payée".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conseil */}
            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Renseignez la <strong>référence de transaction</strong>{' '}
                      pour faciliter le rapprochement bancaire et les audits.
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
              {selectedFacture ? (
                <>
                  <span className="text-base-content/60">Solde restant : </span>
                  <span className="font-mono font-bold text-primary">
                    {formaterMontant(resteAPayer)}
                  </span>
                </>
              ) : (
                <span className="text-base-content/40">
                  Aucune facture sélectionnée
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/paiements')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={
                chargement ||
                !!errors.amount ||
                !formData.amount ||
                !formData.facture
              }
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />{' '}
                  {isEdit ? 'Enregistrer' : 'Enregistrer le paiement'}
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
const PaiementForm = () => (
  <ErrorBoundary>
    <PaiementFormContent />
  </ErrorBoundary>
);

export default PaiementForm;