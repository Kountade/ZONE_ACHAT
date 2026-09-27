// src/components/evaluations/Classement.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  Download,
  Printer,
  School,
  User,
  Calendar,
  BarChart3,
  Award,
  Star,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Users,
  Trophy,
  Medal,
  Crown,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  File,
  Filter,
  ClipboardList
} from 'lucide-react';

const Classement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Données
  const [classement, setClassement] = useState([]);
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [periodeId, setPeriodeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    moyenneGenerale: 0,
    max: 0,
    min: 0,
    mentionTB: 0,
    mentionB: 0,
    mentionAB: 0,
    mentionP: 0,
    mentionNA: 0
  });

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showMessage = (texte, type = 'success') => {
    setMessage(texte);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { headers: { Authorization: `Token ${token}` } };

        // 1. Charger les classes
        const classesRes = await axiosInstance.get('/classes/?actif=true', headers);
        let classesData = [];
        if (Array.isArray(classesRes.data)) {
          classesData = classesRes.data;
        } else if (classesRes.data?.results) {
          classesData = classesRes.data.results;
        }
        setClasses(classesData);

        // 2. Charger les périodes
        const periodesRes = await axiosInstance.get('/periodes/', headers);
        let periodesData = [];
        if (Array.isArray(periodesRes.data)) {
          periodesData = periodesRes.data;
        } else if (periodesRes.data?.results) {
          periodesData = periodesRes.data.results;
        }
        setPeriodes(periodesData);

        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (classeId && periodeId) {
      loadClassement();
    }
  }, [classeId, periodeId]);

  // ============================================================
  // CHARGEMENT DU CLASSEMENT
  // ============================================================
  const loadClassement = async () => {
    if (!classeId || !periodeId) {
      setClassement([]);
      setTotalItems(0);
      updateStats([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      const headers = { headers: { Authorization: `Token ${token}` } };

      // Récupérer les élèves de la classe
      const elevesRes = await axiosInstance.get(`/eleves/?classe=${classeId}&statut=actif`, headers);
      let elevesData = [];
      if (Array.isArray(elevesRes.data)) {
        elevesData = elevesRes.data;
      } else if (elevesRes.data?.results) {
        elevesData = elevesRes.data.results;
      }

      // Filtrer les élèves de la classe
      const classeIdInt = parseInt(classeId);
      const elevesFiltres = elevesData.filter(e => {
        if (!e.classe) return false;
        return parseInt(e.classe) === classeIdInt;
      });

      if (elevesFiltres.length === 0) {
        setClassement([]);
        setTotalItems(0);
        updateStats([]);
        showMessage('Aucun élève dans cette classe', 'info');
        setLoading(false);
        return;
      }

      // Récupérer les évaluations de la période
      const evalRes = await axiosInstance.get(`/evaluations/?periode=${periodeId}`, headers);
      let evalData = [];
      if (Array.isArray(evalRes.data)) {
        evalData = evalRes.data;
      } else if (evalRes.data?.results) {
        evalData = evalRes.data.results;
      }

      const evaluationIds = evalData.map(e => e.id);

      // Calculer la moyenne générale de chaque élève
      const resultats = [];

      for (const eleve of elevesFiltres) {
        // Récupérer les notes de l'élève
        const notesRes = await axiosInstance.get(`/notes/?eleve=${eleve.id}`, headers);
        let notesData = [];
        if (Array.isArray(notesRes.data)) {
          notesData = notesRes.data;
        } else if (notesRes.data?.results) {
          notesData = notesRes.data.results;
        }

        // Filtrer les notes par période
        const notesPeriode = notesData.filter(n => evaluationIds.includes(n.evaluation));

        if (notesPeriode.length === 0) {
          resultats.push({
            eleve: eleve.id,
            eleve_nom: eleve.nom_complet || eleve.nom || eleve.prenom,
            eleve_matricule: eleve.matricule || '-',
            moyenne: 0,
            nombre_notes: 0,
            rang: 0,
            mention: 'Non noté'
          });
          continue;
        }

        // Calculer la moyenne
        const notesValides = notesPeriode.filter(n => n.note !== null && n.note !== undefined);
        if (notesValides.length > 0) {
          const sum = notesValides.reduce((s, n) => s + (parseFloat(n.note) || 0), 0);
          const moyenne = sum / notesValides.length;
          
          resultats.push({
            eleve: eleve.id,
            eleve_nom: eleve.nom_complet || eleve.nom || eleve.prenom,
            eleve_matricule: eleve.matricule || '-',
            moyenne: moyenne,
            nombre_notes: notesValides.length,
            rang: 0,
            mention: getMentionLabel(moyenne)
          });
        } else {
          resultats.push({
            eleve: eleve.id,
            eleve_nom: eleve.nom_complet || eleve.nom || eleve.prenom,
            eleve_matricule: eleve.matricule || '-',
            moyenne: 0,
            nombre_notes: 0,
            rang: 0,
            mention: 'Non noté'
          });
        }
      }

      // Trier par moyenne décroissante
      resultats.sort((a, b) => b.moyenne - a.moyenne);

      // Ajouter le rang
      let rang = 1;
      let previousMoyenne = -1;
      
      resultats.forEach((item, index) => {
        if (item.moyenne > 0) {
          if (item.moyenne !== previousMoyenne) {
            rang = index + 1;
            previousMoyenne = item.moyenne;
          }
          item.rang = rang;
        } else {
          item.rang = '-';
        }
      });

      setClassement(resultats);
      setTotalItems(resultats.length);
      updateStats(resultats);

    } catch (err) {
      console.error('❌ Erreur chargement classement:', err);
      showMessage('Erreur lors du chargement du classement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MISE À JOUR DES STATISTIQUES
  // ============================================================
  const updateStats = (data) => {
    const notesValides = data.filter(m => m.moyenne > 0);
    const total = data.length;
    
    let moyenneGenerale = 0;
    let max = 0;
    let min = 0;
    
    if (notesValides.length > 0) {
      const valeurs = notesValides.map(m => parseFloat(m.moyenne) || 0);
      const sum = valeurs.reduce((a, b) => a + b, 0);
      moyenneGenerale = sum / valeurs.length;
      max = Math.max(...valeurs);
      min = Math.min(...valeurs);
    }

    const mentionTB = data.filter(m => m.mention === 'Très Bien').length;
    const mentionB = data.filter(m => m.mention === 'Bien').length;
    const mentionAB = data.filter(m => m.mention === 'Assez Bien').length;
    const mentionP = data.filter(m => m.mention === 'Passable').length;
    const mentionNA = data.filter(m => m.mention === 'Non Admis' || m.mention === 'Non noté').length;

    setStats({
      total: total || 0,
      moyenneGenerale: moyenneGenerale || 0,
      max: max || 0,
      min: min || 0,
      mentionTB: mentionTB || 0,
      mentionB: mentionB || 0,
      mentionAB: mentionAB || 0,
      mentionP: mentionP || 0,
      mentionNA: mentionNA || 0
    });
  };

  // ============================================================
  // GESTIONNAIRES
  // ============================================================
  const handleClasseChange = (e) => {
    const value = e.target.value;
    setClasseId(value);
    setCurrentPage(1);
    setClassement([]);
    setStats({
      total: 0,
      moyenneGenerale: 0,
      max: 0,
      min: 0,
      mentionTB: 0,
      mentionB: 0,
      mentionAB: 0,
      mentionP: 0,
      mentionNA: 0
    });
  };

  const handlePeriodeChange = (e) => {
    const value = e.target.value;
    setPeriodeId(value);
    setCurrentPage(1);
    setClassement([]);
    setStats({
      total: 0,
      moyenneGenerale: 0,
      max: 0,
      min: 0,
      mentionTB: 0,
      mentionB: 0,
      mentionAB: 0,
      mentionP: 0,
      mentionNA: 0
    });
  };

  const handleRefresh = () => {
    if (classeId && periodeId) {
      loadClassement();
      showMessage('Données actualisées', 'success');
    } else {
      showMessage('Veuillez sélectionner une classe et une période', 'info');
    }
  };

  // ============================================================
  // ✅ NAVIGUER VERS LE PDF
  // ============================================================
  const goToPDF = () => {
    if (!classeId || !periodeId) {
      showMessage('Veuillez sélectionner une classe et une période', 'error');
      return;
    }
    if (classement.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }
    navigate(`/classement/${classeId}/pdf?classe=${classeId}&periode=${periodeId}`);
  };

  // ============================================================
  // FILTRES ET PAGINATION
  // ============================================================
  const getFilteredData = () => {
    let filtered = [...classement];

    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(m =>
        (m.eleve_nom || '').toLowerCase().includes(search) ||
        (m.eleve_matricule || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();
  const totalFiltered = filteredData.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getMoyenneColor = (moyenne) => {
    if (moyenne === null || moyenne === undefined || moyenne === 0) return 'text-gray-400';
    const val = parseFloat(moyenne);
    if (isNaN(val)) return 'text-gray-400';
    if (val >= 16) return 'text-green-600 font-bold';
    if (val >= 12) return 'text-orange-500 font-bold';
    if (val >= 10) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const getMentionLabel = (moyenne) => {
    if (moyenne >= 16) return 'Très Bien';
    if (moyenne >= 14) return 'Bien';
    if (moyenne >= 12) return 'Assez Bien';
    if (moyenne >= 10) return 'Passable';
    if (moyenne > 0) return 'Non Admis';
    return 'Non noté';
  };

  const getMentionColor = (mention) => {
    const map = {
      'Très Bien': 'text-green-600',
      'Bien': 'text-blue-600',
      'Assez Bien': 'text-orange-500',
      'Passable': 'text-yellow-600',
      'Non Admis': 'text-red-600',
      'Non noté': 'text-gray-400'
    };
    return map[mention] || 'text-gray-500';
  };

  const getRangDisplay = (rang) => {
    if (rang === '-') return '-';
    if (rang === 1) return '1er';
    if (rang === 2) return '2e';
    if (rang === 3) return '3e';
    return `#${rang}`;
  };

  const getRangIcon = (rang) => {
    if (rang === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rang === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rang === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const exportCSV = () => {
    if (classement.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Rang', 'Élève', 'Matricule', 'Moyenne Générale', 'Nombre de notes', 'Mention'];
    const rows = classement.map(m => [
      m.rang || '-',
      m.eleve_nom || '-',
      m.eleve_matricule || '-',
      m.moyenne ? m.moyenne.toFixed(2) : '0.00',
      m.nombre_notes || 0,
      m.mention || 'Non noté'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `classement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading && !classeId) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600">Erreur de chargement</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Message de notification */}
      {message && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${
          messageType === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : messageType === 'info'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'bg-green-50 border-green-500 text-green-700'
        }`}>
          {messageType === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
          <button
            onClick={() => setMessage('')}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="w-full bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Classement
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm disabled:opacity-50"
                disabled={classement.length === 0}
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              {/* ✅ BOUTON PDF */}
              <button
                onClick={goToPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm disabled:opacity-50"
                disabled={!classeId || !periodeId || classement.length === 0}
                title="Générer le PDF"
              >
                <File className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-4 py-6">

        {/* FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <School className="h-4 w-4 inline mr-1" />
                Classe *
              </label>
              <select
                value={classeId}
                onChange={handleClasseChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Période *
              </label>
              <select
                value={periodeId}
                onChange={handlePeriodeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez une période</option>
                {periodes.map(periode => (
                  <option key={periode.id} value={periode.id}>
                    {periode.libelle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="h-4 w-4 inline mr-1" />
                Recherche
              </label>
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  if (classeId && periodeId) {
                    loadClassement();
                  } else {
                    showMessage('Veuillez sélectionner une classe et une période', 'info');
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                disabled={!classeId || !periodeId}
              >
                <Trophy className="h-4 w-4" />
                Consulter
              </button>
            </div>

          </div>
        </div>

        {/* STATISTIQUES */}
        {classeId && periodeId && classement.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Moyenne</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.moyenneGenerale.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Maximum</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.max.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Minimum</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.min.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">TB</p>
              <p className="text-base sm:text-lg font-bold text-green-600">{stats.mentionTB}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">B/AB</p>
              <p className="text-base sm:text-lg font-bold text-blue-600">{stats.mentionB + stats.mentionAB}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase">NA</p>
              <p className="text-base sm:text-lg font-bold text-red-600">{stats.mentionNA}</p>
            </div>
          </div>
        )}

        {/* TABLEAU DU CLASSEMENT */}
        {classeId && periodeId ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-500">Chargement du classement...</span>
              </div>
            ) : classement.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {!classeId ? 'Veuillez sélectionner une classe' : 
                   !periodeId ? 'Veuillez sélectionner une période' :
                   'Aucun classement disponible pour cette classe'}
                </p>
                {classeId && periodeId && (
                  <button
                    onClick={loadClassement}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Recharger
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          <Trophy className="h-4 w-4 inline mr-1" />
                          Rang
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          <User className="h-4 w-4 inline mr-1" />
                          Élève
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">
                          <IdCard className="h-4 w-4 inline mr-1" />
                          Matricule
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                          <Gauge className="h-4 w-4 inline mr-1" />
                          Moyenne
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 hidden lg:table-cell">
                          <ClipboardList className="h-4 w-4 inline mr-1" />
                          Notes
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          Mention
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">
                          Tendance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item) => {
                        const moyenne = item.moyenne || 0;
                        const mentionColor = getMentionColor(item.mention);
                        const rangDisplay = getRangDisplay(item.rang);
                        const RangIcon = getRangIcon(item.rang);

                        return (
                          <tr key={item.eleve} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4 font-medium">
                              <span className={`flex items-center gap-1 ${
                                item.rang === 1 ? 'text-yellow-600' :
                                item.rang === 2 ? 'text-gray-500' :
                                item.rang === 3 ? 'text-amber-600' :
                                'text-gray-500'
                              }`}>
                                {RangIcon}
                                {item.rang === '-' ? '-' : rangDisplay}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-800">{item.eleve_nom || 'Inconnu'}</span>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <span className="text-sm text-gray-500">{item.eleve_matricule || '-'}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-lg ${getMoyenneColor(moyenne)}`}>
                                {moyenne > 0 ? moyenne.toFixed(2) : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center hidden lg:table-cell">
                              <span className="text-sm text-gray-500">{item.nombre_notes || 0}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm font-medium ${mentionColor}`}>
                                {item.mention}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {moyenne >= 16 ? (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                              ) : moyenne >= 10 ? (
                                <Minus className="h-5 w-5 text-yellow-500" />
                              ) : moyenne > 0 ? (
                                <TrendingDown className="h-5 w-5 text-red-500" />
                              ) : (
                                <Minus className="h-5 w-5 text-gray-300" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalFiltered > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">
                      {startIndex + 1} - {endIndex} sur {totalFiltered} résultat(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded transition ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <select
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              Sélectionnez une classe et une période
            </h3>
            <p className="text-gray-500">
              Choisissez une classe et une période pour consulter le classement des élèves
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classement;