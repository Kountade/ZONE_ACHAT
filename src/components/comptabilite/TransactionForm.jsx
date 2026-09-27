// src/components/comptabilite/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

const TransactionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    compte_client: '',
    compte_professeur: '',
    compte_surveillant: '',
    type_transaction: 'credit',
    categorie: 'mensualite',
    montant: '',
    description: '',
    date_transaction: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: '',
    reference_paiement: '',
    est_valide: false,
    plan_comptable: ''
  });

  const [clients, setClients] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [surveillants, setSurveillants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // Charger les comptes clients
        try {
          const clientsRes = await axiosInstance.get('/comptes-clients/', headers);
          let clientsData = [];
          if (Array.isArray(clientsRes.data)) {
            clientsData = clientsRes.data;
          } else if (clientsRes.data?.results) {
            clientsData = clientsRes.data.results;
          }
          setClients(clientsData);
        } catch (err) {
          console.warn('⚠️ Erreur chargement clients:', err);
        }

        // Charger les professeurs
        try {
          const profRes = await axiosInstance.get('/comptes-professeurs/', headers);
          let profData = [];
          if (Array.isArray(profRes.data)) {
            profData = profRes.data;
          } else if (profRes.data?.results) {
            profData = profRes.data.results;
          }
          setProfesseurs(profData);
        } catch (err) {
          console.warn('⚠️ Erreur chargement professeurs:', err);
        }

        // Charger les surveillants
        try {
          const survRes = await axiosInstance.get('/comptes-surveillants/', headers);
          let survData = [];
          if (Array.isArray(survRes.data)) {
            survData = survRes.data;
          } else if (survRes.data?.results) {
            survData = survRes.data.results;
          }
          setSurveillants(survData);
        } catch (err) {
          console.warn('⚠️ Erreur chargement surveillants:', err);
        }

        // Si c'est une édition, charger les données
        if (isEditMode) {
          const transRes = await axiosInstance.get(`/transactions/${id}/`, headers);
          const data = transRes.data;
          setFormData({
            compte_client: data.compte_client || '',
            compte_professeur: data.compte_professeur || '',
            compte_surveillant: data.compte_surveillant || '',
            type_transaction: data.type_transaction || 'credit',
            categorie: data.categorie || 'mensualite',
            montant: data.montant || '',
            description: data.description || '',
            date_transaction: data.date_transaction || new Date().toISOString().split('T')[0],
            date_echeance: data.date_echeance || '',
            mode_paiement: data.mode_paiement || '',
            reference_paiement: data.reference_paiement || '',
            est_valide: data.est_valide || false,
            plan_comptable: data.plan_comptable || ''
          });
        }

      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        setError('Erreur de chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate]);

  // ============================================================
  // GESTION DES CHAMPS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      // Validation
      if (!formData.compte_client && !formData.compte_professeur && !formData.compte_surveillant) {
        setError('Au moins un compte (client, professeur ou surveillant) doit être spécifié');
        setSaving(false);
        return;
      }
      if (!formData.montant || parseFloat(formData.montant) <= 0) {
        setError('Le montant doit être supérieur à 0');
        setSaving(false);
        return;
      }
      if (!formData.description.trim()) {
        setError('La description est obligatoire');
        setSaving(false);
        return;
      }

      const payload = {
        compte_client: formData.compte_client ? parseInt(formData.compte_client) : null,
        compte_professeur: formData.compte_professeur ? parseInt(formData.compte_professeur) : null,
        compte_surveillant: formData.compte_surveillant ? parseInt(formData.compte_surveillant) : null,
        type_transaction: formData.type_transaction,
        categorie: formData.categorie,
        montant: parseFloat(formData.montant),
        description: formData.description.trim(),
        date_transaction: formData.date_transaction,
        date_echeance: formData.date_echeance || null,
        mode_paiement: formData.mode_paiement || null,
        reference_paiement: formData.reference_paiement || null,
        est_valide: formData.est_valide,
        plan_comptable: formData.plan_comptable ? parseInt(formData.plan_comptable) : null
      };

      if (isEditMode) {
        await axiosInstance.put(`/transactions/${id}/`, payload, headers);
      } else {
        await axiosInstance.post('/transactions/', payload, headers);
      }

      navigate('/transactions');

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          const messages = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          setError(messages);
        } else {
          setError(errors || 'Erreur lors de la sauvegarde');
        }
      } else {
        setError('Erreur de connexion au serveur');
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getClientLabel = (client) => {
    if (!client) return '';
    return `${client.prenom || ''} ${client.nom || ''} (${client.matricule || ''})`;
  };

  const getProfesseurLabel = (prof) => {
    if (!prof) return '';
    return `${prof.prenom || ''} ${prof.nom || ''} (${prof.matricule || ''})`;
  };

  const getSurveillantLabel = (surv) => {
    if (!surv) return '';
    return `${surv.prenom || ''} ${surv.nom || ''} (${surv.matricule || ''})`;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-semibold text-gray-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/transactions')} 
            className="btn btn-ghost btn-sm gap-2"
          >
            ← Retour
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditMode ? 'Modification d\'une transaction existante' : 'Ajouter une nouvelle transaction'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit}>
          
          {/* Erreur */}
          {error && (
            <div className="alert alert-error mb-6 rounded-xl">
              <span className="text-sm whitespace-pre-wrap">{error}</span>
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setError(null)}>
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Type de transaction */}
            <div>
              <label className="label font-medium">Type <span className="text-error">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type_transaction"
                    value="credit"
                    checked={formData.type_transaction === 'credit'}
                    onChange={handleChange}
                    className="radio radio-success"
                    disabled={saving}
                  />
                  <span className="text-success">Crédit (Payé)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type_transaction"
                    value="debit"
                    checked={formData.type_transaction === 'debit'}
                    onChange={handleChange}
                    className="radio radio-error"
                    disabled={saving}
                  />
                  <span className="text-error">Débit (Dû)</span>
                </label>
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="label font-medium">Catégorie <span className="text-error">*</span></label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="select select-bordered w-full"
                disabled={saving}
                required
              >
                <option value="inscription">Frais d'inscription</option>
                <option value="mensualite">Mensualité</option>
                <option value="scolarite">Scolarité</option>
                <option value="transport">Transport</option>
                <option value="cantine">Cantine</option>
                <option value="bibliotheque">Bibliothèque</option>
                <option value="activite">Activité parascolaire</option>
                <option value="salaire">Salaire</option>
                <option value="fourniture">Fourniture</option>
                <option value="entretien">Entretien</option>
                <option value="equipement">Équipement</option>
                <option value="taxe">Taxe</option>
                <option value="assurance">Assurance</option>
                <option value="remise">Remise</option>
                <option value="annulation">Annulation</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Compte Client */}
            <div>
              <label className="label font-medium">Client</label>
              <select
                name="compte_client"
                value={formData.compte_client}
                onChange={handleChange}
                className="select select-bordered w-full"
                disabled={saving}
              >
                <option value="">Aucun client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {getClientLabel(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* Compte Professeur */}
            <div>
              <label className="label font-medium">Professeur</label>
              <select
                name="compte_professeur"
                value={formData.compte_professeur}
                onChange={handleChange}
                className="select select-bordered w-full"
                disabled={saving}
              >
                <option value="">Aucun professeur</option>
                {professeurs.map(p => (
                  <option key={p.id} value={p.id}>
                    {getProfesseurLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Compte Surveillant */}
            <div>
              <label className="label font-medium">Surveillant</label>
              <select
                name="compte_surveillant"
                value={formData.compte_surveillant}
                onChange={handleChange}
                className="select select-bordered w-full"
                disabled={saving}
              >
                <option value="">Aucun surveillant</option>
                {surveillants.map(s => (
                  <option key={s.id} value={s.id}>
                    {getSurveillantLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Montant */}
            <div>
              <label className="label font-medium">Montant (FCFA) <span className="text-error">*</span></label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="100"
                className="input input-bordered w-full"
                required
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label font-medium">Description <span className="text-error">*</span></label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Paiement mensualité Janvier"
                className="input input-bordered w-full"
                required
                disabled={saving}
              />
            </div>

            {/* Date de transaction */}
            <div>
              <label className="label font-medium">Date de transaction <span className="text-error">*</span></label>
              <input
                type="date"
                name="date_transaction"
                value={formData.date_transaction}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
                disabled={saving}
              />
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="label font-medium">Date d'échéance</label>
              <input
                type="date"
                name="date_echeance"
                value={formData.date_echeance}
                onChange={handleChange}
                className="input input-bordered w-full"
                disabled={saving}
              />
            </div>

            {/* Mode de paiement */}
            <div>
              <label className="label font-medium">Mode de paiement</label>
              <select
                name="mode_paiement"
                value={formData.mode_paiement}
                onChange={handleChange}
                className="select select-bordered w-full"
                disabled={saving}
              >
                <option value="">Non spécifié</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
                <option value="carte">Carte bancaire</option>
                <option value="mobile">Mobile Money</option>
                <option value="transfert">Transfert</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Référence de paiement */}
            <div>
              <label className="label font-medium">Référence de paiement</label>
              <input
                type="text"
                name="reference_paiement"
                value={formData.reference_paiement}
                onChange={handleChange}
                placeholder="Ex: CHQ-001"
                className="input input-bordered w-full"
                disabled={saving}
              />
            </div>

            {/* Valider directement */}
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="est_valide"
                  checked={formData.est_valide}
                  onChange={handleChange}
                  className="checkbox checkbox-success"
                  disabled={saving}
                />
                <span className="font-medium">Valider directement la transaction</span>
                <span className="text-sm text-gray-500">
                  {formData.est_valide ? '✅ La transaction sera validée immédiatement' : '⏳ En attente de validation'}
                </span>
              </label>
            </div>

          </div>

          {/* Boutons */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="btn btn-ghost gap-2"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TransactionForm;