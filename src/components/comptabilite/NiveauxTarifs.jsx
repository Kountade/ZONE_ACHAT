// src/comptabilite/NiveauxTarifs.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Percent,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  School,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  AlertCircle
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import toast from 'react-hot-toast';

const NiveauxTarifs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tarifs, setTarifs] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [anneeFilter, setAnneeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🟢 NiveauxTarifs monté');
    fetchAnnees();
    fetchTarifs();
  }, []);

  useEffect(() => {
    if (anneeFilter) {
      console.log('🔄 Filtre année changé:', anneeFilter);
      fetchTarifs();
    }
  }, [anneeFilter]);

  const fetchAnnees = async () => {
    console.log('📥 Récupération des années...');
    try {
      const response = await axiosInstance.get('/annees-scolaires/');
      console.log('✅ Années chargées:', response.data);
      setAnnees(response.data || []);
      
      const active = response.data.find(a => a.est_active);
      if (active) {
        console.log('📌 Année active:', active);
        setAnneeFilter(active.id);
      }
    } catch (error) {
      console.error('❌ Erreur chargement années:', error);
      toast.error('Erreur de chargement des années');
    }
  };

  const fetchTarifs = async () => {
    console.log('📥 Récupération des tarifs...');
    setLoading(true);
    setError(null);
    try {
      const params = anneeFilter ? { annee: anneeFilter } : {};
      console.log('📤 Paramètres:', params);
      console.log('🔗 URL:', '/niveaux-tarifs/');  // ← CORRECTION : plus de /comptabilite/
      
      const response = await axiosInstance.get('/niveaux-tarifs/', { params });
      console.log('✅ Tarifs chargés:', response.data);
      setTarifs(response.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement tarifs:', error);
      console.error('📄 Détails:', error.response?.data);
      console.error('📊 Status:', error.response?.status);
      
      let message = 'Impossible de charger les tarifs';
      if (error.response?.status === 401) {
        message = 'Session expirée, veuillez vous reconnecter';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        message = 'Endpoint non trouvé. Vérifiez que le serveur est lancé.';
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        message = 'Impossible de contacter le serveur. Vérifiez que Django est lancé sur http://127.0.0.1:8000';
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce tarif ?')) return;
    try {
      await axiosInstance.delete(`/niveaux-tarifs/${id}/`);  // ← CORRECTION
      toast.success('Tarif supprimé avec succès');
      fetchTarifs();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEdit = (tarif) => {
    navigate(`/niveaux-tarifs/modifier/${tarif.id}`, { state: { tarif } });
  };

  const handleNew = () => {
    navigate('/niveaux-tarifs/nouveau');
  };

  const handleView = (tarif) => {
    navigate(`/niveaux-tarifs/${tarif.id}`, { state: { tarif } });
  };

  const calculTotalAnnuel = (tarif) => {
    return (tarif.frais_inscription || 0) + (tarif.mensualite_base || 0) * (tarif.nombre_mensualites || 10);
  };

  const formatMontant = (montant) => {
    return montant?.toLocaleString() || '0';
  };

  const filteredTarifs = tarifs.filter(t => {
    const search = searchTerm.toLowerCase();
    return (
      t.niveau_nom?.toLowerCase().includes(search) ||
      t.niveau?.nom?.toLowerCase().includes(search) ||
      t.annee_libelle?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: tarifs.length,
    moyenneInscription: tarifs.reduce((sum, t) => sum + (t.frais_inscription || 0), 0) / tarifs.length || 0,
    moyenneMensualite: tarifs.reduce((sum, t) => sum + (t.mensualite_base || 0), 0) / tarifs.length || 0,
    totalAnnuelMoyen: tarifs.reduce((sum, t) => sum + calculTotalAnnuel(t), 0) / tarifs.length || 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <span className="ml-3 text-base-content/60">Chargement des tarifs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-error">{error}</h3>
          <p className="text-base-content/60 mt-2 text-sm">
            Vérifiez que le serveur Django est lancé sur <code className="bg-base-200 px-2 py-1 rounded">http://127.0.0.1:8000</code>
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={fetchTarifs} className="btn btn-primary gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
            <button 
              onClick={() => window.open('http://127.0.0.1:8000/niveaux-tarifs/', '_blank')}
              className="btn btn-ghost btn-sm"
            >
              Tester l'API
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Percent className="w-8 h-8 text-primary" />
            Tarifs par Niveau
          </h1>
          <p className="text-sm text-base-content/60">
            Gestion des frais d'inscription et mensualités par niveau scolaire
          </p>
        </div>
        <button onClick={handleNew} className="btn btn-primary btn-sm gap-2">
          <Plus className="w-4 h-4" />
          Nouveau tarif
        </button>
      </div>

      {/* Statistiques */}
      {tarifs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <School className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Total niveaux</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Moyenne inscription</p>
                <p className="text-xl font-bold">{formatMontant(Math.round(stats.moyenneInscription))} FCFA</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Moyenne mensualité</p>
                <p className="text-xl font-bold">{formatMontant(Math.round(stats.moyenneMensualite))} FCFA</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Total annuel moyen</p>
                <p className="text-xl font-bold">{formatMontant(Math.round(stats.totalAnnuelMoyen))} FCFA</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher un niveau..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="select select-bordered"
            value={anneeFilter}
            onChange={(e) => setAnneeFilter(e.target.value)}
          >
            <option value="">Toutes les années</option>
            {annees.map(a => (
              <option key={a.id} value={a.id}>
                {a.libelle} {a.est_active && '⭐'}
              </option>
            ))}
          </select>
          <button onClick={fetchTarifs} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden border border-base-200">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="font-semibold">Niveau</th>
                <th className="font-semibold">Année</th>
                <th className="font-semibold text-right">Inscription</th>
                <th className="font-semibold text-right">Mensualité</th>
                <th className="font-semibold text-center">Nb mens.</th>
                <th className="font-semibold text-right">Transport</th>
                <th className="font-semibold text-right">Cantine</th>
                <th className="font-semibold text-center">Remises</th>
                <th className="font-semibold text-right">Total annuel</th>
                <th className="font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTarifs.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-base-content/40">
                    {searchTerm ? 'Aucun tarif trouvé pour cette recherche' : 'Aucun tarif trouvé'}
                  </td>
                </tr>
              ) : (
                filteredTarifs.map(tarif => (
                  <tr key={tarif.id} className="hover:bg-base-200/50 transition-colors">
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-primary/40" />
                        {tarif.niveau_nom || tarif.niveau?.nom || '-'}
                      </div>
                    </td>
                    <td>{tarif.annee_libelle || '-'}</td>
                    <td className="text-right font-medium text-primary">
                      {formatMontant(tarif.frais_inscription)} FCFA
                    </td>
                    <td className="text-right font-medium">
                      {formatMontant(tarif.mensualite_base)} FCFA
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost">{tarif.nombre_mensualites || 10}</span>
                    </td>
                    <td className="text-right text-sm">
                      {formatMontant(tarif.frais_transport)} FCFA
                    </td>
                    <td className="text-right text-sm">
                      {formatMontant(tarif.frais_cantine)} FCFA
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {tarif.remise_fratrie > 0 && (
                          <span className="badge badge-info badge-xs">F: {tarif.remise_fratrie}%</span>
                        )}
                        {tarif.remise_ancien > 0 && (
                          <span className="badge badge-secondary badge-xs">A: {tarif.remise_ancien}%</span>
                        )}
                        {tarif.remise_boursier > 0 && (
                          <span className="badge badge-success badge-xs">B: {tarif.remise_boursier}%</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right font-bold text-primary">
                      {formatMontant(calculTotalAnnuel(tarif))} FCFA
                    </td>
                    <td>
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleView(tarif)} className="btn btn-ghost btn-sm btn-square">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(tarif)} className="btn btn-ghost btn-sm btn-square">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tarif.id)} className="btn btn-ghost btn-sm btn-square text-error">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NiveauxTarifs;