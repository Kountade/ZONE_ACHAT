// src/components/settings/AnneeScolaireManager.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import { 
  Calendar, Plus, Edit, Trash2, Save, X, AlertCircle, 
  CheckCircle, Building2 
} from 'lucide-react';

const AnneeScolaireManager = () => {
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    libelle: '',
    date_debut: '',
    date_fin: '',
    est_active: false,
  });
  const [saving, setSaving] = useState(false);

  // États pour les notifications
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' ou 'error'

  const fetchAnnees = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/annees-scolaires/');
      setAnnees(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement années:', err);
      setError('Impossible de charger les années scolaires.');
      afficherMessage('Impossible de charger les années scolaires.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnees();
  }, []);

  // Fonction pour afficher une notification
  const afficherMessage = (texte, type = 'success') => {
    setMessageText(texte);
    setMessageType(type);
    setShowMessage(true);
    // Auto‑masquer après 5 secondes
    setTimeout(() => setShowMessage(false), 5000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      libelle: '',
      date_debut: '',
      date_fin: '',
      est_active: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (annee) => {
    setFormData({
      libelle: annee.libelle,
      date_debut: annee.date_debut,
      date_fin: annee.date_fin,
      est_active: annee.est_active,
    });
    setEditingId(annee.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      libelle: formData.libelle,
      date_debut: formData.date_debut,
      date_fin: formData.date_fin,
      est_active: formData.est_active,
    };

    try {
      if (editingId) {
        await axiosInstance.put(`/annees-scolaires/${editingId}/`, payload);
        afficherMessage('✅ Année mise à jour avec succès !', 'success');
      } else {
        await axiosInstance.post('/annees-scolaires/', payload);
        afficherMessage('✅ Année créée avec succès !', 'success');
      }
      resetForm();
      await fetchAnnees();
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      let msg = 'Erreur lors de la sauvegarde.';
      if (err.response && err.response.data) {
        const details = Object.values(err.response.data).flat().join(' ');
        msg += ' ' + details;
      } else if (err.message === 'Network Error') {
        msg = 'Le serveur ne répond pas. Vérifiez qu\'il est lancé.';
      } else {
        msg += ' ' + err.message;
      }
      setError(msg);
      afficherMessage('❌ ' + msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez‑vous vraiment supprimer cette année ?')) return;
    try {
      await axiosInstance.delete(`/annees-scolaires/${id}/`);
      afficherMessage('✅ Année supprimée avec succès !', 'success');
      fetchAnnees();
    } catch (err) {
      afficherMessage('❌ Erreur lors de la suppression.', 'error');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axiosInstance.patch(`/annees-scolaires/${id}/`, { est_active: !currentStatus });
      fetchAnnees();
    } catch (err) {
      afficherMessage('❌ Impossible de modifier le statut.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Notification flottante (identique à Login) */}
      {showMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slideDown">
          <div className={`alert shadow-lg border-l-4 ${
            messageType === 'error' 
              ? 'alert-error border-l-error' 
              : 'alert-success border-l-success'
          }`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{messageText}</span>
            </div>
            <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost btn-circle">✕</button>
          </div>
        </div>
      )}

      <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-base-content">Années scolaires</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle année
          </button>
        </div>

        {error && (
          <div className="alert alert-warning shadow-lg mb-6">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        {showForm && (
          <div className="bg-base-200 rounded-xl p-6 mb-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifier l\'année' : 'Nouvelle année scolaire'}
              </h2>
              <button onClick={resetForm} className="btn btn-sm btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label"><span className="label-text font-medium">Libellé *</span></label>
                <input
                  type="text"
                  name="libelle"
                  value={formData.libelle}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Ex: 2025-2026"
                  required
                />
              </div>
              <div>
                <label className="label"><span className="label-text font-medium">Date début *</span></label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="label"><span className="label-text font-medium">Date fin *</span></label>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="est_active"
                    checked={formData.est_active}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm">Active</span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary gap-2 flex-1"
                >
                  {saving ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {annees.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <p className="text-base-content/50">Aucune année scolaire enregistrée.</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm mt-4">
              Créer la première année
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {annees.map((annee) => (
                  <tr key={annee.id} className={annee.est_active ? 'bg-primary/5' : ''}>
                    <td className="font-medium">{annee.libelle}</td>
                    <td>{new Date(annee.date_debut).toLocaleDateString('fr-FR')}</td>
                    <td>{new Date(annee.date_fin).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(annee.id, annee.est_active)}
                        className={`badge ${annee.est_active ? 'badge-success' : 'badge-ghost'} gap-1 cursor-pointer hover:opacity-80`}
                      >
                        {annee.est_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Active
                          </>
                        ) : (
                          'Inactive'
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(annee)}
                          className="btn btn-sm btn-ghost text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(annee.id)}
                          className="btn btn-sm btn-ghost text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

export default AnneeScolaireManager;