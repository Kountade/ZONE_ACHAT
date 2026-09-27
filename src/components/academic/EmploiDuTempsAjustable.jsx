// src/components/academic/EmploiDuTempsAjustable.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, BookOpen, Users, User, Building2,
  Loader2, ChevronLeft, ChevronRight, Search,
  RefreshCw, AlertCircle, Download, Printer,
  Edit, Trash2, CheckCircle, XCircle, History,
  Plus, Filter, X, FileText, BarChart3,
  School, CalendarDays, Timer, BookMarked,
  PenTool, MapPin, GraduationCap
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  differenceInMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Importer EmploiDuTempsPdf
import EmploiDuTempsPdf from './EmploiDuTempsPdf';

// Importer les autres composants avec fallback
let AjustementModal, StatistiquesEmploi;

try {
  AjustementModal = require('./AjustementModal').default;
} catch (e) {
  console.warn('AjustementModal non trouvé');
  AjustementModal = ({ isOpen, onClose, onConfirm, cours, date, loading }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-base-100 rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">Ajustement du cours</h3>
          <p className="mb-4">Fonctionnalité en cours de développement</p>
          <button onClick={onClose} className="btn btn-primary w-full">Fermer</button>
        </div>
      </div>
    );
  };
}

try {
  StatistiquesEmploi = require('./StatistiquesEmploi').default;
} catch (e) {
  console.warn('StatistiquesEmploi non trouvé');
  StatistiquesEmploi = ({ stats, cours }) => {
    if (!stats || cours.length === 0) return null;
    return (
      <div className="bg-base-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-base-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-base-content/60">Total cours</div>
          </div>
          <div className="bg-base-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-secondary">{Object.keys(stats.parMatiere || {}).length}</div>
            <div className="text-xs text-base-content/60">Matières</div>
          </div>
          <div className="bg-base-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">{Object.keys(stats.parEnseignant || {}).length}</div>
            <div className="text-xs text-base-content/60">Enseignants</div>
          </div>
          <div className="bg-base-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-info">{Math.round((stats.dureeTotale || 0) / 60)}h</div>
            <div className="text-xs text-base-content/60">Durée totale</div>
          </div>
        </div>
      </div>
    );
  };
}

const EmploiDuTempsAjustable = () => {
  // États principaux
  const [loading, setLoading] = useState(false);
  const [cours, setCours] = useState([]);
  const [emploiDuTemps, setEmploiDuTemps] = useState([]);
  const [filterType, setFilterType] = useState('classe');
  const [filterValue, setFilterValue] = useState('');
  const [filterOptions, setFilterOptions] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [error, setError] = useState(null);
  const [anneeScolaireActive, setAnneeScolaireActive] = useState(null);
  const [anneeScolaires, setAnneeScolaires] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    jour: '',
    type_cours: '',
    annee_scolaire: '',
    est_recurrent: ''
  });
  
  // États pour les ajustements
  const [ajustements, setAjustements] = useState([]);
  const [showAjustementModal, setShowAjustementModal] = useState(false);
  const [coursSelectionne, setCoursSelectionne] = useState(null);
  const [typeAjustement, setTypeAjustement] = useState('modification');
  const [dateAjustement, setDateAjustement] = useState(null);
  
  // États pour les statistiques
  const [showStats, setShowStats] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    parJour: {},
    parMatiere: {},
    parEnseignant: {},
    parType: {},
    dureeTotale: 0,
    ajustements: 0
  });

  // Configuration des jours
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const joursDisplay = {
    lundi: 'Lun',
    mardi: 'Mar',
    mercredi: 'Mer',
    jeudi: 'Jeu',
    vendredi: 'Ven',
    samedi: 'Sam'
  };
  const joursComplet = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi'
  };

  const typeCoursConfig = {
    cours: { label: 'CM', color: 'badge-primary' },
    td: { label: 'TD', color: 'badge-secondary' },
    tp: { label: 'TP', color: 'badge-accent' }
  };

  // ==================== CHARGEMENT DES DONNÉES ====================

  useEffect(() => {
    fetchFilterData();
    fetchAnneeScolaires();
    fetchAnneeScolaireActive();
    fetchAjustements();
  }, []);

  useEffect(() => {
    if (filterValue) {
      fetchEmploiDuTempsComplet();
    }
  }, [filterValue, filterType, currentWeekStart]);

  useEffect(() => {
    if (emploiDuTemps.length > 0) {
      calculateStats();
    }
  }, [emploiDuTemps]);

  // ==================== FONCTIONS API ====================

  const fetchAnneeScolaires = async () => {
    try {
      const response = await axiosInstance.get('/annees-scolaires/');
      setAnneeScolaires(response.data || []);
    } catch (error) {
      console.error('Erreur chargement années scolaires:', error);
    }
  };

  const fetchAnneeScolaireActive = async () => {
    try {
      const response = await axiosInstance.get('/annees-scolaires/active/');
      if (response.data) {
        setAnneeScolaireActive(response.data);
        setFilters(prev => ({
          ...prev,
          annee_scolaire: response.data.id
        }));
      }
    } catch (error) {
      console.error('Erreur chargement année scolaire active:', error);
    }
  };

  const fetchFilterData = useCallback(async () => {
    try {
      let options = [];
      if (filterType === 'classe') {
        const response = await axiosInstance.get('/classes/');
        options = response.data
          .sort((a, b) => a.nom?.localeCompare(b.nom))
          .map(c => ({ 
            value: c.id, 
            label: c.nom,
            extra: c.niveau_nom 
          }));
      } else if (filterType === 'enseignant') {
        const response = await axiosInstance.get('/professeurs/');
        options = response.data
          .sort((a, b) => a.nom?.localeCompare(b.nom))
          .map(p => ({
            value: p.id,
            label: `${p.prenom} ${p.nom}`,
            extra: p.matricule
          }));
      } else if (filterType === 'salle') {
        const response = await axiosInstance.get('/salles/');
        options = response.data
          .sort((a, b) => a.nom?.localeCompare(b.nom))
          .map(s => ({
            value: s.id,
            label: s.nom,
            extra: `${s.capacite} places`
          }));
      }
      setFilterOptions(options);
    } catch (error) {
      console.error('Erreur chargement options:', error);
      toast.error('Erreur lors du chargement des données');
    }
  }, [filterType]);

  const fetchEmploiDuTempsComplet = async () => {
    if (!filterValue) {
      toast.error('Veuillez sélectionner un élément');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (filterType === 'classe') params.append('classe', filterValue);
      else if (filterType === 'enseignant') params.append('enseignant', filterValue);
      else if (filterType === 'salle') params.append('salle', filterValue);

      if (filters.annee_scolaire) {
        params.append('annee_scolaire', filters.annee_scolaire);
      }

      // Ajouter la période de la semaine
      const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
      params.append('date_debut', weekStart);
      params.append('date_fin', weekEnd);

      const response = await axiosInstance.get(
        `/cours/emploi_du_temps_complet/?${params.toString()}`
      );

      setEmploiDuTemps(response.data.emploi_du_temps || []);
      
      // Extraire tous les cours pour l'affichage simplifié
      const allCours = response.data.emploi_du_temps?.flatMap(j => j.cours) || [];
      setCours(allCours);

      if (allCours.length === 0) {
        toast.info('Aucun cours trouvé pour cette sélection');
      } else {
        toast.success(`${allCours.length} cours trouvés`);
      }
    } catch (error) {
      console.error('Erreur chargement emploi du temps:', error);
      const msg = error.response?.data?.error || 'Impossible de charger l\'emploi du temps';
      setError(msg);
      toast.error('Erreur lors du chargement de l\'emploi du temps');
      setEmploiDuTemps([]);
      setCours([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAjustements = async () => {
    try {
      const response = await axiosInstance.get('/cours/ajustements/');
      setAjustements(response.data || []);
    } catch (error) {
      console.error('Erreur chargement ajustements:', error);
    }
  };

  // ==================== FONCTIONS DE STATISTIQUES ====================

  const calculateStats = () => {
    const statsData = {
      total: cours.length,
      parJour: {},
      parMatiere: {},
      parEnseignant: {},
      parType: {},
      dureeTotale: 0,
      ajustements: ajustements.filter(a => a.est_approuve).length
    };

    cours.forEach(c => {
      const jourLabel = joursComplet[c.jour] || c.jour;
      statsData.parJour[jourLabel] = (statsData.parJour[jourLabel] || 0) + 1;
      
      statsData.parMatiere[c.matiere_nom] = (statsData.parMatiere[c.matiere_nom] || 0) + 1;
      
      const typeLabel = typeCoursConfig[c.type_cours]?.label || c.type_cours || 'Cours';
      statsData.parType[typeLabel] = (statsData.parType[typeLabel] || 0) + 1;
      
      statsData.parEnseignant[c.enseignant_nom] = (statsData.parEnseignant[c.enseignant_nom] || 0) + 1;
      
      if (c.heure_debut && c.heure_fin) {
        const debut = new Date(`1970-01-01T${c.heure_debut}`);
        const fin = new Date(`1970-01-01T${c.heure_fin}`);
        statsData.dureeTotale += differenceInMinutes(fin, debut);
      }
    });

    setStats(statsData);
  };

  // ==================== FONCTIONS DE RENDU ====================

  const getCoursForDay = (dateStr) => {
    const jour = emploiDuTemps.find(j => j.date === dateStr);
    return jour ? jour.cours : [];
  };

  const getAjustementsForDay = (dateStr) => {
    const jour = emploiDuTemps.find(j => j.date === dateStr);
    return jour ? jour.ajustements : [];
  };

  const formatHeure = (heure) => {
    if (!heure) return '';
    return heure.substring(0, 5);
  };

  const getDuree = (debut, fin) => {
    if (!debut || !fin) return null;
    const minutes = differenceInMinutes(
      new Date(`1970-01-01T${fin}`),
      new Date(`1970-01-01T${debut}`)
    );
    if (minutes < 60) return `${minutes}min`;
    const heures = Math.floor(minutes / 60);
    const restes = minutes % 60;
    return restes > 0 ? `${heures}h${restes}` : `${heures}h`;
  };

  // ==================== NAVIGATION ====================

  const prevWeek = () => setCurrentWeekStart(prev => addWeeks(prev, -1));
  const nextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const currentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleFilterChange = (type) => {
    setFilterType(type);
    setFilterValue('');
    setCours([]);
    setEmploiDuTemps([]);
    setError(null);
    fetchFilterData();
  };

  const handleClearFilters = () => {
    setFilterValue('');
    setCours([]);
    setEmploiDuTemps([]);
    setError(null);
    setFilters({
      jour: '',
      type_cours: '',
      annee_scolaire: filters.annee_scolaire,
      est_recurrent: ''
    });
    setShowAdvancedFilters(false);
  };

  // ==================== GESTION DES AJUSTEMENTS ====================

  const handleAjusterCours = (coursItem, date) => {
    setCoursSelectionne({ ...coursItem, date_specifique: date });
    setDateAjustement(date);
    setShowAjustementModal(true);
  };

  const handleAnnulerCours = async (coursId, date) => {
    if (!window.confirm('Voulez-vous vraiment annuler ce cours ?')) return;

    setLoading(true);
    try {
      await axiosInstance.post('/cours/ajuster_cours/', {
        cours_id: coursId,
        date_effective: date,
        type_ajustement: 'annulation',
        raison: 'Annulation demandée par l\'administration'
      });
      
      toast.success('Cours annulé avec succès');
      fetchEmploiDuTempsComplet();
      fetchAjustements();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  const handleAjustementSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        cours_id: coursSelectionne.id,
        date_effective: dateAjustement,
        type_ajustement: data.type,
        raison: data.raison,
        ...(data.type === 'modification' && {
          nouvelle_heure_debut: data.nouvelle_heure_debut,
          nouvelle_heure_fin: data.nouvelle_heure_fin,
          nouvel_enseignant: data.nouvel_enseignant,
          nouvelle_salle: data.nouvelle_salle,
          nouvelle_matiere: data.nouvelle_matiere
        }),
        ...(data.type === 'deplacement' && {
          nouveau_jour: data.nouveau_jour,
          nouvelle_heure_debut: data.nouvelle_heure_debut,
          nouvelle_heure_fin: data.nouvelle_heure_fin
        })
      };

      await axiosInstance.post('/cours/ajuster_cours/', payload);
      
      toast.success('Ajustement effectué avec succès');
      setShowAjustementModal(false);
      setCoursSelectionne(null);
      fetchEmploiDuTempsComplet();
      fetchAjustements();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajustement');
    } finally {
      setLoading(false);
    }
  };

  // ==================== EXPORT ====================

  const handleExport = (formatType) => {
    if (cours.length === 0) {
      toast.error('Aucun cours à exporter');
      return;
    }

    const exportData = cours.map(c => ({
      'Matière': c.matiere_nom || '',
      'Enseignant': c.enseignant_nom || '',
      'Classe': c.classe_nom || '',
      'Salle': c.salle_nom || '',
      'Jour': joursComplet[c.jour] || c.jour || '',
      'Début': formatHeure(c.heure_debut),
      'Fin': formatHeure(c.heure_fin),
      'Durée': getDuree(c.heure_debut, c.heure_fin) || '',
      'Type': typeCoursConfig[c.type_cours]?.label || c.type_cours || 'Cours',
      'Récurrent': c.est_recurrent ? 'Oui' : 'Non',
      'Exception': c.est_exception ? 'Oui' : 'Non',
      'Annulé': c.est_annule ? 'Oui' : 'Non'
    }));

    if (formatType === 'csv') {
      const headers = Object.keys(exportData[0]);
      const csv = [
        headers.join(','),
        ...exportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `emploi_du_temps_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      toast.success('Export CSV effectué');
    } else {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json;charset=utf-8;'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `emploi_du_temps_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      toast.success('Export JSON effectué');
    }
  };

  // ==================== RENDU DES COURS ====================

  const renderCours = (coursItem, dateStr) => {
    const duree = getDuree(coursItem.heure_debut, coursItem.heure_fin);
    const typeInfo = typeCoursConfig[coursItem.type_cours] || { label: 'Cours', color: 'badge-ghost' };
    const isException = coursItem.est_exception;
    const isAnnule = coursItem.est_annule;
    const isAjuste = coursItem.raison_ajustement;

    return (
      <div
        key={coursItem.id}
        className={`rounded-lg p-3 mb-2 text-sm hover:shadow-md transition-all ${
          isAnnule ? 'opacity-50 line-through bg-base-300' :
          isException ? 'bg-warning/10 border-l-4 border-warning' :
          'bg-base-200 border-l-4 border-primary'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-1 truncate">
              <BookOpen className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.matiere_nom || 'Sans matière'}</span>
              {isException && (
                <span className="badge badge-warning badge-xs flex-shrink-0">Exception</span>
              )}
              {isAnnule && (
                <span className="badge badge-error badge-xs flex-shrink-0">Annulé</span>
              )}
            </div>
            <div className="text-xs text-base-content/70 flex flex-wrap items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatHeure(coursItem.heure_debut)} - {formatHeure(coursItem.heure_fin)}
                {duree && (
                  <span className="badge badge-ghost badge-xs">
                    {duree}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{coursItem.enseignant_nom || 'N/A'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span className="truncate max-w-[60px]">{coursItem.salle_nom || 'N/A'}</span>
              </span>
              {coursItem.classe_nom && filterType !== 'classe' && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="truncate max-w-[60px]">{coursItem.classe_nom}</span>
                </span>
              )}
            </div>
            {isAjuste && (
              <div className="text-xs text-warning mt-1">
                <AlertCircle className="w-3 h-3 inline" />
                <span className="ml-1">{coursItem.raison_ajustement}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
            <span className={`badge badge-xs ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {!coursItem.est_recurrent && !coursItem.est_exception && (
              <span className="badge badge-ghost badge-xs">Ponctuel</span>
            )}
            {!isAnnule && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => handleAjusterCours(coursItem, dateStr)}
                  className="btn btn-ghost btn-xs btn-square text-warning"
                  title="Ajuster ce cours"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleAnnulerCours(coursItem.id, dateStr)}
                  className="btn btn-ghost btn-xs btn-square text-error"
                  title="Annuler ce cours"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGrid = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const date = addDays(currentWeekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const coursOfDay = getCoursForDay(dateStr);
      const ajustementsOfDay = getAjustementsForDay(dateStr);
      const isToday = isSameDay(date, new Date());
      const isPast = date < new Date() && !isToday;

      days.push(
        <div
          key={i}
          className={`border rounded-lg p-2 min-h-[200px] transition-colors ${
            isToday ? 'border-primary bg-primary/5 shadow-md' :
            isPast ? 'border-base-300 bg-base-200/50' :
            'border-base-300 bg-base-100'
          }`}
        >
          <div
            className={`text-center font-semibold text-sm py-1 rounded mb-2 ${
              isToday ? 'bg-primary text-primary-content' :
              isPast ? 'bg-base-300 text-base-content/70' :
              'bg-base-200'
            }`}
          >
            {joursDisplay[jours[i]]}
            <span className="text-xs font-normal ml-1">
              {format(date, 'dd/MM', { locale: fr })}
            </span>
            {isToday && (
              <span className="badge badge-primary badge-xs ml-1">Aujourd'hui</span>
            )}
          </div>

          {ajustementsOfDay.length > 0 && (
            <div className="mb-2 p-1 bg-warning/10 rounded text-xs">
              <span className="font-semibold text-warning flex items-center gap-1">
                <History className="w-3 h-3" />
                Ajustements: 
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {ajustementsOfDay.map(a => (
                  <span key={a.id} className="badge badge-warning badge-xs">
                    {a.type_ajustement_display || a.type_ajustement}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            {coursOfDay.length === 0 ? (
              <div className="text-center text-xs text-base-content/40 py-4">-</div>
            ) : (
              coursOfDay.map((c) => renderCours(c, dateStr))
            )}
          </div>
          <div className="text-xs text-center text-base-content/40 mt-1">
            {coursOfDay.length > 0 && `${coursOfDay.length} cours`}
          </div>
        </div>
      );
    }
    return days;
  };

  const renderStats = () => {
    if (cours.length === 0) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <FileText className="w-5 h-5 text-primary/50" />
          </div>
          <div className="text-xs text-base-content/60">Total cours</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-secondary">
              {Object.keys(stats.parJour).length}
            </div>
            <CalendarDays className="w-5 h-5 text-secondary/50" />
          </div>
          <div className="text-xs text-base-content/60">Jours avec cours</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-accent">
              {Object.keys(stats.parMatiere).length}
            </div>
            <BookMarked className="w-5 h-5 text-accent/50" />
          </div>
          <div className="text-xs text-base-content/60">Matières</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-info">
              {Math.round(stats.dureeTotale / 60)}h
            </div>
            <Timer className="w-5 h-5 text-info/50" />
          </div>
          <div className="text-xs text-base-content/60">Durée totale</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-warning">
              {stats.ajustements}
            </div>
            <History className="w-5 h-5 text-warning/50" />
          </div>
          <div className="text-xs text-base-content/60">Ajustements</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-success">
              {Object.keys(stats.parEnseignant).length}
            </div>
            <User className="w-5 h-5 text-success/50" />
          </div>
          <div className="text-xs text-base-content/60">Enseignants</div>
        </div>
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" />
              Emploi du temps ajustable
            </h1>
            <p className="text-sm text-base-content/60 flex items-center gap-2">
              <School className="w-4 h-4" />
              Visualisez et ajustez les cours par classe, professeur ou salle
              {anneeScolaireActive && (
                <span className="ml-2 badge badge-primary badge-sm">
                  {anneeScolaireActive.libelle}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </button>
            
            {/* BOUTON PDF */}
            <EmploiDuTempsPdf
              cours={cours}
              stats={stats}
              filterType={filterType}
              filterValue={filterValue}
              filterOptions={filterOptions}
              filters={filters}
              currentWeekStart={currentWeekStart}
              jours={jours}
              joursDisplay={joursDisplay}
              joursComplet={joursComplet}
              typeCoursConfig={typeCoursConfig}
              getCoursForDay={getCoursForDay}
              formatHeure={formatHeure}
              getDuree={getDuree}
            />
            
            <button
              onClick={() => handleExport('csv')}
              className="btn btn-outline btn-sm gap-2"
              disabled={cours.length === 0}
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm gap-2"
              disabled={cours.length === 0}
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn btn-sm gap-2 ${showAdvancedFilters ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {Object.keys(filters).some(k => filters[k] && k !== 'annee_scolaire') && (
                <span className="badge badge-primary badge-xs">!</span>
              )}
            </button>
            <button
              onClick={handleClearFilters}
              className="btn btn-ghost btn-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Filtres principaux - inchangé */}
        <div className="bg-base-100 rounded-xl shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="form-control">
              <label className="label label-text">Afficher pour</label>
              <select
                className="select select-bordered"
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                disabled={loading}
              >
                <option value="classe">Classe</option>
                <option value="enseignant">Professeur</option>
                <option value="salle">Salle</option>
              </select>
            </div>
            <div className="form-control flex-1 min-w-[200px]">
              <label className="label label-text">Sélectionner</label>
              <select
                className="select select-bordered w-full"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                disabled={loading || filterOptions.length === 0}
              >
                <option value="">
                  {filterOptions.length === 0 ? 'Chargement...' : 'Sélectionner'}
                </option>
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.extra ? ` (${opt.extra})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <button
                className="btn btn-primary gap-2"
                onClick={fetchEmploiDuTempsComplet}
                disabled={!filterValue || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* Filtres avancés - inchangé */}
        {showAdvancedFilters && (
          <div className="bg-base-100 rounded-xl shadow-sm p-4 mb-4 border border-base-300">
            <div className="flex flex-wrap items-end gap-4">
              <div className="form-control">
                <label className="label label-text">Jour</label>
                <select
                  className="select select-bordered"
                  value={filters.jour}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    jour: e.target.value
                  }))}
                >
                  <option value="">Tous les jours</option>
                  {jours.map(j => (
                    <option key={j} value={j}>{joursComplet[j]}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label label-text">Type de cours</label>
                <select
                  className="select select-bordered"
                  value={filters.type_cours}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    type_cours: e.target.value
                  }))}
                >
                  <option value="">Tous les types</option>
                  <option value="cours">Cours magistral</option>
                  <option value="td">Travaux dirigés</option>
                  <option value="tp">Travaux pratiques</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label label-text">Récurrence</label>
                <select
                  className="select select-bordered"
                  value={filters.est_recurrent}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    est_recurrent: e.target.value
                  }))}
                >
                  <option value="">Tous</option>
                  <option value="true">Récurrent</option>
                  <option value="false">Ponctuel</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label label-text">Année scolaire</label>
                <select
                  className="select select-bordered"
                  value={filters.annee_scolaire}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    annee_scolaire: e.target.value
                  }))}
                >
                  <option value="">Toutes</option>
                  {anneeScolaires.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.libelle} {a.est_active ? '(active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    jour: '',
                    type_cours: '',
                    est_recurrent: ''
                  }))}
                >
                  <X className="w-4 h-4" />
                  Effacer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        {showStats && renderStats()}

        {/* Navigation semaine */}
        {cours.length > 0 && !error && (
          <div className="flex items-center justify-between mb-4 bg-base-100 rounded-xl shadow-sm p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="btn btn-ghost btn-sm btn-square"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium">
                Semaine du {format(currentWeekStart, 'dd MMMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={nextWeek}
                className="btn btn-ghost btn-sm btn-square"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">
                {cours.length} cours
              </span>
              <button
                onClick={currentWeek}
                className="btn btn-outline btn-sm"
              >
                Aujourd'hui
              </button>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-base-content/60">
              Chargement de l'emploi du temps...
            </span>
          </div>
        ) : error ? (
          <div className="bg-base-100 rounded-xl shadow-sm p-12 text-center text-error">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{error}</p>
            <p className="text-sm mt-2">
              Veuillez réessayer ou contacter l'administrateur.
            </p>
            <button
              onClick={fetchEmploiDuTempsComplet}
              className="btn btn-primary btn-sm mt-4"
            >
              Réessayer
            </button>
          </div>
        ) : cours.length === 0 ? (
          <div className="bg-base-100 rounded-xl shadow-sm p-12 text-center text-base-content/60">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun cours à afficher</p>
            <p className="text-sm">
              Sélectionnez un filtre et cliquez sur Rechercher
            </p>
          </div>
        ) : (
          <div className="bg-base-100 rounded-xl shadow-sm p-4 overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[700px]">
              {renderGrid()}
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajustement */}
      {AjustementModal && (
        <AjustementModal
          isOpen={showAjustementModal}
          onClose={() => {
            setShowAjustementModal(false);
            setCoursSelectionne(null);
          }}
          onConfirm={handleAjustementSubmit}
          cours={coursSelectionne}
          date={dateAjustement}
          loading={loading}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        @media print {
          .btn, 
          .form-control, 
          .no-print {
            display: none !important;
          }
          .bg-base-100, 
          .bg-base-200 {
            background: white !important;
          }
          .border {
            border-color: #ddd !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          .p-4, .p-6 {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EmploiDuTempsAjustable;