// src/components/clients/ClientForm.jsx
// ============================================================
// VERSION OPTIMISÉE - Formulaire professionnel client
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Users,
  User, Building2, Phone, Mail, MapPin, FileText, Info, Eye,
  Power, Ban, Tag, Hash, Package, Briefcase, Store, Sparkles,
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
    console.error('ErrorBoundary ClientForm:', error, errorInfo);
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
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Recharger
              </button>
              <button onClick={() => window.location.href = '/clients'} className="btn btn-ghost">
                Retour aux clients
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
const ClientFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const estEdition = Boolean(id);

  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'particulier',
    phone: '',
    email: '',
    address: '',
    statut: 'actif',
    notes: '',
  });

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT INITIAL OPTIMISÉ
  // - Pas de useRef : évite le blocage du second effet en StrictMode.
  // - AbortController : annule la requête si le composant est démonté.
  // - En création, le code est généré localement : aucun appel API
  //   supplémentaire n'est nécessaire uniquement pour compter les clients.
  // ============================================================
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const init = async () => {
      setChargementInitial(true);
      setErreur(null);

      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      if (!estEdition) {
        const code = `CLT-${Date.now()}`;
        if (isMounted) {
          setFormData((prev) => ({ ...prev, code }));
          setChargementInitial(false);
        }
        return;
      }

      try {
        const response = await AxiosInstance.get(`/clients/${id}/`, {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        });

        if (!isMounted) return;

        const d = response.data || {};
        setFormData({
          code: d.code || '',
          name: d.name || '',
          type: d.type || 'particulier',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          statut: d.statut || 'actif',
          notes: d.notes || '',
        });
      } catch (err) {
        if (!isMounted || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;

        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 404) {
          setErreur('Client non trouvé');
          window.setTimeout(() => navigate('/clients'), 1500);
        } else {
          setErreur('Erreur lors du chargement du client. Veuillez réessayer.');
        }
      } finally {
        if (isMounted) setChargementInitial(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, estEdition, navigate]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (erreur) setErreur(null);
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // ENREGISTREMENT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement || !validate()) {
      if (!validate()) setErreur('Veuillez corriger les champs en rouge.');
      return;
    }

    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const headers = { Authorization: `Token ${token}` };
      const url = estEdition ? `/clients/${id}/` : '/clients/';
      const method = estEdition ? 'put' : 'post';

      const response = await AxiosInstance[method](url, formData, { headers });

      setSucces(true);
      const clientId = response.data?.id || id;
      window.setTimeout(() => navigate(`/clients/${clientId}`), 1000);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }

      let msg = "Erreur lors de l'enregistrement";
      const data = err.response?.data;

      if (typeof data === 'string') {
        msg = data;
      } else if (data?.detail) {
        msg = data.detail;
      } else if (data && typeof data === 'object') {
        const newErrors = {};
        const messages = [];

        Object.keys(data).forEach((key) => {
          const value = Array.isArray(data[key]) ? data[key][0] : data[key];
          newErrors[key] = value;
          messages.push(`${key}: ${value}`);
        });

        setErrors(newErrors);
        if (messages.length) msg = messages.join(' | ');
      }

      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getTypeLabel = (type) => ({
    particulier: 'Particulier',
    entreprise: 'Entreprise',
    revendeur: 'Revendeur',
    grossiste: 'Grossiste',
  }[type] || type);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'entreprise': return <Building2 className="w-5 h-5" />;
      case 'revendeur': return <Store className="w-5 h-5" />;
      case 'grossiste': return <Package className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getStatutBadge = (statut) => ({
    actif: { class: 'badge-success', label: 'Actif' },
    inactif: { class: 'badge-ghost', label: 'Inactif' },
    bloque: { class: 'badge-error', label: 'Bloqué' },
  }[statut] || { class: 'badge-success', label: 'Actif' });

  const statutBadge = getStatutBadge(formData.statut);

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
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate('/clients')} className="btn btn-ghost btn-sm btn-circle" type="button">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Clients / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Users className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le client' : 'Nouveau client'}
            </h1>
          </div>
          <div className="badge badge-primary hidden sm:flex">{estEdition ? 'Édition' : 'Création'}</div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Client {estEdition ? 'modifié' : 'créé'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium"><Hash className="w-3 h-3 mr-1 inline" /> Code client <span className="text-error">*</span></span>
                      </label>
                      <input
                        type="text" name="code"
                        className={`input input-bordered w-full font-mono ${errors.code ? 'input-error' : ''}`}
                        value={formData.code} onChange={handleChange}
                        readOnly={estEdition} maxLength="50" placeholder="CLT-0001" required
                      />
                      {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                      {estEdition && <span className="text-xs text-base-content/40 mt-1">Non modifiable</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium"><User className="w-3 h-3 mr-1 inline" /> Nom / Raison sociale <span className="text-error">*</span></span>
                      </label>
                      <input
                        type="text" name="name"
                        className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                        value={formData.name} onChange={handleChange}
                        maxLength="200" placeholder="Nom du client" required
                      />
                      {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium"><Briefcase className="w-3 h-3 mr-1 inline" /> Type de client</span>
                      </label>
                      <select name="type" className="select select-bordered w-full" value={formData.type} onChange={handleChange}>
                        <option value="particulier">Particulier</option>
                        <option value="entreprise">Entreprise</option>
                        <option value="revendeur">Revendeur</option>
                        <option value="grossiste">Grossiste</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium"><Power className="w-3 h-3 mr-1 inline" /> Statut</span>
                      </label>
                      <select name="statut" className="select select-bordered w-full" value={formData.statut} onChange={handleChange}>
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="bloque">Bloqué</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Contact</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium"><Phone className="w-3 h-3 mr-1 inline" /> Téléphone <span className="text-error">*</span></span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text" name="phone"
                          className={`input input-bordered w-full pl-10 font-mono ${errors.phone ? 'input-error' : ''}`}
                          value={formData.phone} onChange={handleChange}
                          maxLength="20" placeholder="77 123 45 67" required
                        />
                      </div>
                      {errors.phone && <span className="text-error text-xs mt-1">{errors.phone}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium"><Mail className="w-3 h-3 mr-1 inline" /> Email</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="email" name="email" className="input input-bordered w-full pl-10"
                          value={formData.email} onChange={handleChange}
                          maxLength="100" placeholder="client@exemple.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Adresse</h2>
                </div>
                <div className="p-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5"><span className="label-text text-sm font-medium">Adresse complète</span></label>
                    <textarea
                      name="address" className="textarea textarea-bordered w-full"
                      value={formData.address} onChange={handleChange}
                      rows="3" placeholder="Adresse complète du client..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Notes</h2>
                </div>
                <div className="p-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5"><span className="label-text text-sm font-medium">Notes supplémentaires</span></label>
                    <textarea
                      name="notes" className="textarea textarea-bordered w-full"
                      value={formData.notes} onChange={handleChange}
                      rows="3" placeholder="Informations complémentaires..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {getTypeIcon(formData.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">{formData.code || 'CLT-0000'}</p>
                      <p className="font-bold text-sm mt-0.5 truncate">{formData.name || 'Nom du client'}</p>
                    </div>
                  </div>
                  <div className="divider my-3" />
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">{getTypeLabel(formData.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Téléphone :</span>
                      <span className="font-mono truncate ml-2 max-w-[140px]">{formData.phone || '—'}</span>
                    </div>
                    {formData.email && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Email :</span>
                        <span className="font-mono text-[10px] truncate ml-2 max-w-[140px]">{formData.email}</span>
                      </div>
                    )}
                    {formData.address && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Adresse :</span>
                        <span className="text-xs truncate ml-2 max-w-[140px]">{formData.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="divider my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/60">Statut :</span>
                    <span className={`badge badge-sm ${statutBadge.class}`}>{statutBadge.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Types de clients</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li><strong>Particulier</strong> : achat au détail</li>
                      <li><strong>Entreprise</strong> : facturation pro</li>
                      <li><strong>Revendeur</strong> : rachat pour revente</li>
                      <li><strong>Grossiste</strong> : gros volumes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Renseignez un <strong>email</strong> et un <strong>téléphone valides</strong> pour faciliter les relances et l'envoi de factures.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {formData.statut === 'bloque' && (
              <div className="card bg-error/5 border border-error/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <Ban className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-error mb-1">Client bloqué</p>
                      <p className="text-base-content/70">
                        Ce client ne pourra pas passer de nouvelles commandes ni effectuer de paiements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button
              type="button" onClick={() => navigate('/clients')}
              className="btn btn-ghost" disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit" className="btn btn-primary gap-2 min-w-[180px]"
              disabled={chargement}
            >
              {chargement ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le client'}</>
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
const ClientForm = () => (
  <ErrorBoundary>
    <ClientFormContent />
  </ErrorBoundary>
);

export default ClientForm;
