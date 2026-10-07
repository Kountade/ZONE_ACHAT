// src/pages/ClientsApproval.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from '../AxiosInstance'
import {
  UserRoundCheck,
  UserRoundX,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  Eye,
  ArrowLeft,
  Users,
  TrendingUp,
  X,
  ShieldCheck,
  Building2
} from 'lucide-react'

const ClientsApproval = () => {
  const navigate = useNavigate()

  // États principaux
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // id en cours d'action
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [tabValue, setTabValue] = useState('pending') // 'pending' | 'approved'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [clientToReject, setClientToReject] = useState(null)

  // ============================================================
  // NOTIFICATION
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
  }

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return '?'
  }

  // ============================================================
  // CHARGEMENT DES CLIENTS
  // ============================================================
  const fetchClients = async (status = tabValue) => {
    setLoading(true)
    try {
      const endpoint = status === 'pending'
        ? '/users/pending-clients/'
        : '/users/approved-clients/'

      const response = await AxiosInstance.get(endpoint)

      // Gérer les deux formats : liste directe ou objet {count, results}
      let list = []
      if (Array.isArray(response.data)) {
        list = response.data
      } else if (response.data?.results) {
        list = response.data.results
      }

      setClients(list)
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      showNotification('Erreur lors du chargement des clients', 'error')
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients(tabValue)
  }, [tabValue])

  // ============================================================
  // APPROUVER UN CLIENT
  // ============================================================
  const handleApprove = async (client) => {
    if (!client?.id) return

    setActionLoading(client.id)
    try {
      await AxiosInstance.post(`/users/${client.id}/approve/`)
      showNotification(`✅ ${client.full_name || client.email} a été approuvé avec succès`, 'success')
      // Recharger après un délai pour laisser le temps au backend
      setTimeout(() => fetchClients(tabValue), 500)
    } catch (error) {
      console.error('Erreur approbation:', error)
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Erreur lors de l\'approbation'
      showNotification(msg, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // OUVRIR LE MODAL DE REJET
  // ============================================================
  const openRejectModal = (client) => {
    setClientToReject(client)
    setRejectReason('')
    setShowRejectModal(true)
  }

  // ============================================================
  // REJETER UN CLIENT
  // ============================================================
  const handleReject = async () => {
    if (!clientToReject?.id) return

    setActionLoading(clientToReject.id)
    try {
      await AxiosInstance.post(`/users/${clientToReject.id}/reject/`, {
        notes: rejectReason
      })
      showNotification(`❌ ${clientToReject.full_name || clientToReject.email} a été rejeté`, 'success')
      setShowRejectModal(false)
      setClientToReject(null)
      setRejectReason('')
      setTimeout(() => fetchClients(tabValue), 500)
    } catch (error) {
      console.error('Erreur rejet:', error)
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Erreur lors du rejet'
      showNotification(msg, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // VOIR LES DÉTAILS
  // ============================================================
  const openDetailModal = (client) => {
    setSelectedClient(client)
    setShowDetailModal(true)
  }

  // ============================================================
  // FILTRAGE
  // ============================================================
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients
    const term = searchTerm.toLowerCase()
    return clients.filter((c) =>
      (c.email || '').toLowerCase().includes(term) ||
      (c.full_name || '').toLowerCase().includes(term) ||
      (c.first_name || '').toLowerCase().includes(term) ||
      (c.last_name || '').toLowerCase().includes(term) ||
      (c.phone_number || '').toLowerCase().includes(term)
    )
  }, [clients, searchTerm])

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => {
    return {
      total: clients.length,
      filtered: filteredClients.length
    }
  }, [clients, filteredClients])

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6">

      {/* ============ NOTIFICATION ============ */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-[60] animate-slide-in max-w-md">
          <div className={`alert shadow-xl rounded-xl border-none ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="btn btn-sm btn-ghost btn-circle"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        {/* ============ BOUTON RETOUR ============ */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost btn-sm gap-2 text-slate-600 hover:text-orange-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>
        </div>

        {/* ============ EN-TÊTE ============ */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
              <UserRoundCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Approbation des Clients
              </h1>
              <p className="text-sm text-slate-500">
                Validez ou refusez les demandes d'inscription client
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchClients(tabValue)}
              className="btn btn-outline btn-sm gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* ============ STATS ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {tabValue === 'pending' ? 'En attente' : 'Approuvés'}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tabValue === 'pending' ? 'bg-amber-100' : 'bg-green-100'}`}>
                {tabValue === 'pending'
                  ? <Clock className="w-5 h-5 text-amber-600" />
                  : <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Résultats filtrés
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.filtered}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Action rapide
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  {tabValue === 'pending'
                    ? 'Validez en 1 clic'
                    : 'Consultez l\'historique'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ============ ONGLETS ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Header avec onglets + recherche */}
          <div className="border-b border-slate-100 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Onglets */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg w-fit">
              <button
                onClick={() => setTabValue('pending')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                  tabValue === 'pending'
                    ? 'bg-white shadow-sm text-amber-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                En attente
              </button>
              <button
                onClick={() => setTabValue('approved')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                  tabValue === 'approved'
                    ? 'bg-white shadow-sm text-green-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approuvés
              </button>
            </div>

            {/* Recherche */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* ============ CONTENU ============ */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="mt-3 text-sm text-slate-500">Chargement des clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${tabValue === 'pending' ? 'bg-amber-50' : 'bg-green-50'}`}>
                {tabValue === 'pending'
                  ? <Users className="w-10 h-10 text-amber-500" />
                  : <CheckCircle className="w-10 h-10 text-green-500" />}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {searchTerm
                  ? 'Aucun résultat'
                  : (tabValue === 'pending'
                      ? 'Aucun client en attente'
                      : 'Aucun client approuvé')}
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                {searchTerm
                  ? `Aucun client ne correspond à "${searchTerm}"`
                  : (tabValue === 'pending'
                      ? 'Toutes les demandes ont été traitées. 🎉'
                      : 'Les clients approuvés apparaîtront ici.')}
              </p>
            </div>
          ) : (
            <>
              {/* ===== Vue Tableau (desktop) ===== */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                      <th className="font-semibold">Client</th>
                      <th className="font-semibold">Contact</th>
                      <th className="font-semibold">Localisation</th>
                      <th className="font-semibold">Inscription</th>
                      <th className="font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        {/* Client */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                              tabValue === 'pending'
                                ? 'bg-gradient-to-br from-amber-400 to-amber-500'
                                : 'bg-gradient-to-br from-green-400 to-green-500'
                            }`}>
                              {getInitials(client.first_name, client.last_name, client.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sans nom'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                ID: {client.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{client.email || '—'}</span>
                            </div>
                            {client.phone_number && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{client.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Localisation */}
                        <td>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {client.address || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(client.created_at)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            {/* Voir */}
                            <button
                              onClick={() => openDetailModal(client)}
                              className="btn btn-ghost btn-sm btn-circle text-slate-500 hover:text-blue-500 hover:bg-blue-50"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {tabValue === 'pending' && (
                              <>
                                {/* Approuver */}
                                <button
                                  onClick={() => handleApprove(client)}
                                  disabled={actionLoading === client.id}
                                  className="btn btn-sm gap-1.5 bg-green-500 hover:bg-green-600 text-white border-none shadow-sm"
                                  title="Approuver"
                                >
                                  {actionLoading === client.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <UserRoundCheck className="w-3.5 h-3.5" />
                                      <span className="hidden lg:inline">Approuver</span>
                                    </>
                                  )}
                                </button>

                                {/* Rejeter */}
                                <button
                                  onClick={() => openRejectModal(client)}
                                  disabled={actionLoading === client.id}
                                  className="btn btn-sm gap-1.5 btn-outline border-red-200 text-red-500 hover:bg-red-50"
                                  title="Rejeter"
                                >
                                  <UserRoundX className="w-3.5 h-3.5" />
                                  <span className="hidden lg:inline">Rejeter</span>
                                </button>
                              </>
                            )}

                            {tabValue === 'approved' && (
                              <span className="badge badge-success badge-sm gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Approuvé
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===== Vue Cartes (mobile) ===== */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <div key={client.id} className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                        tabValue === 'pending'
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500'
                          : 'bg-gradient-to-br from-green-400 to-green-500'
                      }`}>
                        {getInitials(client.first_name, client.last_name, client.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sans nom'}
                        </p>
                        <p className="text-xs text-slate-400">ID: {client.id}</p>
                      </div>
                      {tabValue === 'approved' && (
                        <span className="badge badge-success badge-sm gap-1">
                          <CheckCircle className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email || '—'}</span>
                      </div>
                      {client.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{client.phone_number}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(client.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => openDetailModal(client)}
                        className="btn btn-sm btn-ghost flex-1 gap-1.5 text-slate-600"
                      >
                        <Eye className="w-4 h-4" />
                        Détails
                      </button>

                      {tabValue === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(client)}
                            disabled={actionLoading === client.id}
                            className="btn btn-sm flex-1 gap-1.5 bg-green-500 hover:bg-green-600 text-white border-none"
                          >
                            {actionLoading === client.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserRoundCheck className="w-3.5 h-3.5" />
                                Approuver
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openRejectModal(client)}
                            disabled={actionLoading === client.id}
                            className="btn btn-sm btn-outline flex-1 gap-1.5 border-red-200 text-red-500"
                          >
                            <UserRoundX className="w-3.5 h-3.5" />
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================================
          MODAL : DÉTAILS DU CLIENT
          ============================================================ */}
      {showDetailModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">

            {/* Header */}
            <div className={`p-5 flex items-center justify-between ${
              tabValue === 'pending' ? 'bg-amber-500' : 'bg-green-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(selectedClient.first_name, selectedClient.last_name, selectedClient.email)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedClient.full_name || `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() || 'Sans nom'}
                  </h2>
                  <p className="text-xs text-white/80">ID: {selectedClient.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Informations personnelles
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Nom complet</p>
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {selectedClient.full_name || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {selectedClient.email || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Téléphone</p>
                      <p className="text-sm font-medium text-slate-800">
                        {selectedClient.phone_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Adresse</p>
                      <p className="text-sm font-medium text-slate-800">
                        {selectedClient.address || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Date d'inscription</p>
                      <p className="text-sm font-medium text-slate-800">
                        {formatDate(selectedClient.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div className={`rounded-xl p-4 flex items-center gap-3 ${
                selectedClient.is_approved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                {selectedClient.is_approved ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Compte approuvé</p>
                      <p className="text-xs text-green-700">Ce client a accès à son espace.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">En attente d'approbation</p>
                      <p className="text-xs text-amber-700">Le client ne peut pas encore accéder à son espace.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Fermer
              </button>
              {!selectedClient.is_approved && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      openRejectModal(selectedClient)
                    }}
                    className="btn btn-sm btn-outline border-red-200 text-red-500 hover:bg-red-50 gap-1.5"
                  >
                    <UserRoundX className="w-4 h-4" />
                    Rejeter
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      handleApprove(selectedClient)
                    }}
                    className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-none gap-1.5"
                  >
                    <UserRoundCheck className="w-4 h-4" />
                    Approuver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL : CONFIRMATION DE REJET
          ============================================================ */}
      {showRejectModal && clientToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            <div className="p-5 bg-red-500 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserRoundX className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Rejeter le client</h2>
                  <p className="text-xs text-white/80">Cette action est irréversible</p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">
                  Vous êtes sur le point de <strong>rejeter</strong> la demande d'inscription de :
                </p>
                <p className="text-sm font-semibold text-red-900 mt-2">
                  {clientToReject.full_name || clientToReject.email}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Le compte sera désactivé et le client ne pourra pas se connecter.
                </p>
              </div>

              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="label-text text-sm font-semibold text-slate-700">
                    Raison du rejet <span className="text-slate-400">(optionnel)</span>
                  </span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Ex: Informations incomplètes, doublon, etc."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="textarea textarea-bordered w-full rounded-xl border-slate-200 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-ghost btn-sm"
                disabled={actionLoading === clientToReject.id}
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === clientToReject.id}
                className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none gap-2"
              >
                {actionLoading === clientToReject.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <UserRoundX className="w-4 h-4" />
                    Confirmer le rejet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ClientsApproval