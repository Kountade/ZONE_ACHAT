// src/components/academic/EmploiDuTemps.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  User,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  AlertCircle,
  Download,
  Printer,
  Filter,
  X,
  FileText,
  BarChart3,
  FileDown,
  School,
  CalendarDays,
  Timer,
  BookMarked
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  differenceInMinutes,
  addWeeks
} from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import EmploiDuTempsPdf from './EmploiDuTempsPdf';

const EmploiDuTemps = () => {
  // États principaux
  const [loading, setLoading] = useState(false);
  const [cours, setCours] = useState([]);
  const [filterType, setFilterType] = useState('classe');
  const [filterValue, setFilterValue] = useState('');
  const [filterOptions, setFilterOptions] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [error, setError] = useState(null);
  
  // États pour les filtres avancés
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    jour: '',
    type_cours: '',
    annee_scolaire: '',
    est_recurrent: ''
  });
  
  // États pour les données
  const [anneeScolaireActive, setAnneeScolaireActive] = useState(null);
  const [anneeScolaires, setAnneeScolaires] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    parJour: {},
    parMatiere: {},
    parType: {},
    parEnseignant: {},
    dureeTotale: 0
  });
  const [showStats, setShowStats] = useState(true);

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

  // Types de cours
  const typeCoursConfig = {
    cours: { label: 'CM', color: 'badge-primary' },
    td: { label: 'TD', color: 'badge-secondary' },
    tp: { label: 'TP', color: 'badge-accent' }
  };

  // Chargement initial
  useEffect(() => {
    fetchFilterData();
    fetchAnneeScolaires();
    fetchAnneeScolaireActive();
  }, []);

  useEffect(() => {
    if (filterValue) {
      fetchEmploiDuTemps();
    }
  }, [filterValue, filterType]);

  useEffect(() => {
    if (filterValue && cours.length > 0) {
      applyFilters();
    }
  }, [filters.jour, filters.type_cours, filters.est_recurrent]);

  useEffect(() => {
    calculateStats();
  }, [cours]);

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
      
      if (filterValue && !options.some(o => o.value.toString() === filterValue.toString())) {
        setFilterValue('');
      }
    } catch (error) {
      console.error('Erreur chargement options:', error);
      toast.error('Erreur lors du chargement des données');
    }
  }, [filterType, filterValue]);

  const fetchEmploiDuTemps = async () => {
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

      const response = await axiosInstance.get(
        `/cours/emploi_du_temps/?${params.toString()}`
      );

      let data = response.data || [];
      data = applyFiltersToData(data);
      
      setCours(data);
      
      if (data.length === 0) {
        toast.info('Aucun cours trouvé pour cette sélection');
      } else {
        toast.success(`${data.length} cours trouvés`);
      }
    } catch (error) {
      console.error('Erreur chargement emploi du temps:', error);
      const msg = error.response?.data?.error || 'Impossible de charger l\'emploi du temps';
      setError(msg);
      toast.error('Erreur lors du chargement de l\'emploi du temps');
      setCours([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FONCTIONS DE FILTRAGE ====================

  const applyFiltersToData = (data) => {
    let filtered = [...data];
    
    if (filters.jour) {
      filtered = filtered.filter(c => c.jour === filters.jour);
    }
    if (filters.type_cours) {
      filtered = filtered.filter(c => c.type_cours === filters.type_cours);
    }
    if (filters.est_recurrent !== '') {
      filtered = filtered.filter(c => c.est_recurrent === (filters.est_recurrent === 'true'));
    }
    
    return filtered;
  };

  const applyFilters = () => {
    if (cours.length > 0) {
      const filtered = applyFiltersToData(cours);
      setCours(filtered);
    }
  };

  // ==================== FONCTIONS DE STATISTIQUES ====================

  const calculateStats = () => {
    const statsData = {
      total: cours.length,
      parJour: {},
      parMatiere: {},
      parType: {},
      parEnseignant: {},
      dureeTotale: 0
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

  const getCoursForDay = (dayIndex) => {
    const dayName = jours[dayIndex];
    return cours
      .filter(c => c.jour === dayName)
      .sort((a, b) => a.heure_debut?.localeCompare(b.heure_debut) || 0);
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
    setError(null);
    fetchFilterData();
  };

  const handleClearFilters = () => {
    setFilterValue('');
    setCours([]);
    setError(null);
    setFilters({
      jour: '',
      type_cours: '',
      annee_scolaire: filters.annee_scolaire,
      est_recurrent: ''
    });
    setShowAdvancedFilters(false);
  };

  // ==================== EXPORT ====================

  const handleExport = (format) => {
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
      'Récurrent': c.est_recurrent ? 'Oui' : 'Non'
    }));

    if (format === 'csv') {
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

  // ==================== RENDU DES COMPOSANTS ====================

  const renderCours = (coursItem, idx) => {
    const duree = getDuree(coursItem.heure_debut, coursItem.heure_fin);
    const typeInfo = typeCoursConfig[coursItem.type_cours] || { label: 'Cours', color: 'badge-ghost' };

    return (
      <div
        key={idx}
        className="bg-base-200 rounded-lg p-2 mb-2 border-l-4 border-primary text-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-primary flex items-center gap-1 truncate">
              <BookOpen className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.matiere_nom || 'Sans matière'}</span>
            </div>
            <div className="text-xs text-base-content/70 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatHeure(coursItem.heure_debut)} - {formatHeure(coursItem.heure_fin)}
              {duree && (
                <span className="badge badge-ghost badge-xs ml-1">
                  {duree}
                </span>
              )}
            </div>
            <div className="text-xs text-base-content/70 flex items-center gap-1 truncate">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.enseignant_nom || 'N/A'}</span>
            </div>
            <div className="text-xs text-base-content/70 flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.salle_nom || 'N/A'}</span>
            </div>
            {coursItem.classe_nom && filterType !== 'classe' && (
              <div className="text-xs text-base-content/70 flex items-center gap-1 truncate">
                <Users className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{coursItem.classe_nom}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
            <span className={`badge badge-xs ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {!coursItem.est_recurrent && (
              <span className="badge badge-ghost badge-xs">Ponctuel</span>
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
      const coursOfDay = getCoursForDay(i);
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
          <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            {coursOfDay.length === 0 ? (
              <div className="text-center text-xs text-base-content/40 py-4">-</div>
            ) : (
              coursOfDay.map((c, idx) => renderCours(c, idx))
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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
          <div className="text-xs text-base-content/60">Matières différentes</div>
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
      </div>
    );
  };

  const renderFilterSelect = () => {
    return (
      <select
        className="select select-bordered w-full max-w-xs"
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
              Emploi du temps
            </h1>
            <p className="text-sm text-base-content/60 flex items-center gap-2">
              <School className="w-4 h-4" />
              Visualisez les cours par classe, professeur ou salle
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
            
            {/* Bouton PDF - Utilise le composant EmploiDuTempsPdf */}
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

        {/* Filtres principaux */}
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
              {renderFilterSelect()}
            </div>
            <div className="form-control">
              <button
                className="btn btn-primary gap-2"
                onClick={fetchEmploiDuTemps}
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

        {/* Filtres avancés */}
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
              onClick={fetchEmploiDuTemps}
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

      {/* Styles additionnels */}
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

export default EmploiDuTemps;