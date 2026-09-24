// src/components/Navbar.jsx - ZonACha ERP - Header unique (site + logiciel)
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Users, Package, Building2, Tags, LogOut, UserCircle,
  Settings, Warehouse, ShoppingCart, Receipt, FileText, ChevronDown, ChevronUp, Menu, X,
  Bell, Moon, Sun, Shield, Clock, Calendar, TrendingUp, CreditCard, Boxes, AlertTriangle,
  Search, HelpCircle, History, Truck, ArrowLeftRight, DollarSign, Ruler, ClipboardCheck,
  MoveHorizontal, Calculator, PackageCheck, Layers, ArrowLeftRight as ReturnIcon,
  AlertOctagon, Wallet, BookOpen, PiggyBank, Cog, Database, BellRing, Printer, UserCog,
  CalendarClock, RefreshCw, Activity, Award, BarChart3, Edit, Eye, Landmark, Coins,
  ReceiptText, CalendarDays, CheckCircle, ClipboardList, Gauge, AlertCircle, Banknote,
  TrendingDown, ScrollText, Scale, FileSpreadsheet, Handshake, FileCheck, RotateCcw,
  Receipt as ReceiptIcon, CreditCard as CreditCardIcon, BarChart, Clipboard,
  AlertCircle as AlertCircleIcon, Archive, PackageOpen, Truck as TruckIcon, Map,
  UserCheck, Route, PackagePlus, PlusCircle, BadgeDollarSign, Barcode, Store, UserPlus,
  FilePlus, CreditCard as CreditCardPlus, Plus, Grid3x3, TableProperties,
  Sparkles, Zap
} from 'lucide-react';

import axiosInstance from './AxiosInstance';

const ROLE_CONFIG = {
  admin:        { label: 'Administrateur',  color: 'error',     icon: Shield,      level: 100 },
  gestionnaire: { label: 'Gestionnaire',    color: 'warning',   icon: UserCog,     level: 80  },
  vendeur:      { label: 'Vendeur',         color: 'primary',   icon: ShoppingBag, level: 60  },
  magasinier:   { label: 'Magasinier',      color: 'success',   icon: Package,     level: 70  },
  comptable:    { label: 'Comptable',       color: 'secondary', icon: Calculator,  level: 90  }
};

const Navbar = ({ content, mode, toggleColorMode }) => {
  const location = useLocation();
  const path = location.pathname || '/';
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState({
    'TABLEAU DE BORD': true, 'VENTES': true, 'PORTE-MONNAIE CLIENTS': false,
    'PRODUITS & STOCKS': true, 'ACHATS & FOURNISSEURS': false, 'FINANCES': true,
    'TRÉSORERIE': false, 'LIVRAISONS': false, 'PARAMÈTRES': false, 'MON ESPACE': false
  });
  const [userInitial, setUserInitial] = useState('U');
  const [userFullName, setUserFullName] = useState('Utilisateur');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [etablissement, setEtablissement] = useState(null);
  const [loadingEtab, setLoadingEtab] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  const [ventesImpayees, setVentesImpayees] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [commandesEnAttente, setCommandesEnAttente] = useState(0);
  const [stocksFaibles, setStocksFaibles] = useState(0);
  const [alertesStockCount, setAlertesStockCount] = useState(0);
  const [lotsExpirant, setLotsExpirant] = useState(0);
  const [inventairesEnCours, setInventairesEnCours] = useState(0);
  const [facturesImpayees, setFacturesImpayees] = useState(0);
  const [receptionsEnAttente, setReceptionsEnAttente] = useState(0);
  const [retoursEnAttente, setRetoursEnAttente] = useState(0);
  const [paiementsFournisseursEnAttente, setPaiementsFournisseursEnAttente] = useState(0);
  const [depensesEnAttente, setDepensesEnAttente] = useState(0);
  const [budgetsAlertes, setBudgetsAlertes] = useState(0);
  const [ecrituresBrouillon, setEcrituresBrouillon] = useState(0);
  const [tresorerieAlerte, setTresorerieAlerte] = useState(0);

  const getUserData = () => {
    try { const d = localStorage.getItem('User'); return d ? JSON.parse(d) : null; } catch { return null; }
  };

  const user = getUserData();
  const role = user?.role || 'vendeur';
  const userEmail = user?.email || '';
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const userName = firstName || lastName || user?.username || userEmail?.split('@')[0] || 'Utilisateur';

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const isAdmin = role === 'admin';
  const isGestionnaire = role === 'gestionnaire' || isAdmin;
  const isVendeur = role === 'vendeur';
  const isMagasinier = role === 'magasinier' || isGestionnaire;
  const isComptable = role === 'comptable' || isAdmin;

  useEffect(() => {
    if (firstName && lastName) {
      setUserInitial(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase());
      setUserFullName(`${firstName} ${lastName}`);
    } else if (userName) {
      setUserInitial(userName.charAt(0).toUpperCase());
      setUserFullName(userName);
    }
  }, [firstName, lastName, userName]);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.vendeur;
  const RoleIcon = roleConfig.icon;

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
    const baseURL = axiosInstance.defaults.baseURL || '';
    return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await axiosInstance.get('/etablissements/unique/');
        if (response.data) {
          setEtablissement(response.data);
          if (response.data.logo) setLogoUrl(getLogoUrl(response.data.logo));
        }
      } catch (e) { console.error('Erreur établissement:', e); }
      finally { setLoadingEtab(false); }
    };
    fetchEtablissement();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) return;
        if (isAdmin || isGestionnaire) { /* vos appels API */ }
      } catch (e) { console.error('Erreur chargement données:', e); }
    };
    loadData();
  }, [role, isAdmin, isGestionnaire]);

  const handleSectionToggle = (section) =>
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  const logoutUser = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem('Token');
    localStorage.removeItem('User');
    navigate('/');
  };

  // ============================================================
  // MENU SECTIONS
  // ============================================================
  const menuSections = [
    {
      name: 'TABLEAU DE BORD', icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', permission: true },
        { id: 'statistiques', text: 'Statistiques', icon: TrendingUp, path: '/statistiques', permission: isAdmin || isGestionnaire },
        { id: 'analyses', text: 'Analyses', icon: BarChart3, path: '/analyses', permission: isAdmin || isGestionnaire }
      ]
    },
    {
      name: 'VENTES', icon: ShoppingCart,
      items: [
        { id: 'ventes', text: 'Ventes', icon: ShoppingCart, path: '/ventes', permission: isAdmin || isGestionnaire || isVendeur, badge: ventesImpayees > 0 ? ventesImpayees : 0 },
        { id: 'nouvelle-vente', text: 'Nouvelle Vente', icon: PlusCircle, path: '/ventes/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-1', separator: true, permission: true },
        { id: 'clients', text: 'Clients', icon: Users, path: '/clients', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'nouveau-client', text: 'Nouveau Client', icon: UserPlus, path: '/clients/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-2', separator: true, permission: true },
        { id: 'devis', text: 'Devis', icon: FileText, path: '/devis', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'nouveau-devis', text: 'Nouveau Devis', icon: FilePlus, path: '/devis/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-3', separator: true, permission: true },
        { id: 'factures', text: 'Factures Clients', icon: Receipt, path: '/factures', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'paiements', text: 'Paiements Clients', icon: CreditCard, path: '/paiements', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'nouveau-paiement', text: 'Nouveau Paiement', icon: CreditCardPlus, path: '/paiements/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-4', separator: true, permission: true },
        { id: 'pos', text: 'Point de Vente', icon: ShoppingBag, path: '/point-de-vente', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'pos-scan', text: 'Scan & Vente', icon: Barcode, path: '/pos-scan', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'retours-clients', text: 'Retours Clients', icon: ReturnIcon, path: '/retours-clients', permission: isAdmin || isGestionnaire }
      ]
    },
    {
      name: 'PORTE-MONNAIE CLIENTS', icon: Wallet,
      items: [
        { id: 'wallets', text: 'Gestion des Porte-monnaie', icon: Wallet, path: '/wallets', permission: isAdmin || isGestionnaire },
        { id: 'wallet-deposit', text: 'Dépôt Client', icon: Plus, path: '/wallets/depot', permission: isAdmin || isGestionnaire },
        { id: 'wallet-transactions', text: 'Historique des Transactions', icon: History, path: '/wallets/transactions', permission: isAdmin || isGestionnaire },
        { id: 'wallet-pay', text: 'Paiement avec Porte-monnaie', icon: CreditCard, path: '/wallets/paiement', permission: isAdmin || isGestionnaire }
      ]
    },
    {
      name: 'PRODUITS & STOCKS', icon: Package,
      items: [
        { id: 'categories', text: 'Catégories', icon: Tags, path: '/categories', permission: isAdmin || isGestionnaire },
        { id: 'unites-mesure', text: 'Unités de Mesure', icon: Ruler, path: '/unites-mesure', permission: isAdmin },
        { id: 'produits', text: 'Produits', icon: Package, path: '/produits', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'add-stock-manual', text: 'Ajout Manuel Stock', icon: PackagePlus, path: '/add-stock-manual', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'stocks', text: 'Stocks', icon: Boxes, path: '/stocks', permission: isAdmin || isGestionnaire || isMagasinier, badge: stocksFaibles > 0 ? stocksFaibles : 0 },
        { id: 'entrepots', text: 'Entrepôts', icon: Warehouse, path: '/entrepots', permission: isAdmin || isGestionnaire },
        { id: 'lots', text: 'Lots', icon: Layers, path: '/lots', permission: isAdmin || isGestionnaire || isMagasinier, badge: lotsExpirant > 0 ? lotsExpirant : 0 },
        { id: 'mouvements-stock', text: 'Mouvements Stock', icon: MoveHorizontal, path: '/mouvements-stock', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'alertes-stock', text: 'Alertes Stock', icon: AlertOctagon, path: '/alertes-stock', permission: isAdmin || isGestionnaire, badge: alertesStockCount > 0 ? alertesStockCount : 0 },
        { id: 'inventaires', text: 'Inventaires', icon: ClipboardCheck, path: '/inventaires', permission: isAdmin || isGestionnaire, badge: inventairesEnCours > 0 ? inventairesEnCours : 0 },
        { id: 'transferts', text: 'Transferts', icon: ArrowLeftRight, path: '/transferts', permission: isAdmin || isGestionnaire }
      ]
    }
  ];

  if (isAdmin || isGestionnaire) {
    menuSections.splice(4, 0, {
      name: 'ACHATS & FOURNISSEURS', icon: ShoppingBag,
      items: [
        { id: 'fournisseurs', text: 'Fournisseurs', icon: Building2, path: '/fournisseurs', permission: isAdmin || isGestionnaire },
        { id: 'commandes-fournisseurs', text: 'Commandes Fournisseurs', icon: FileText, path: '/commandes-fournisseurs', permission: isAdmin || isGestionnaire, badge: commandesEnAttente > 0 ? commandesEnAttente : 0 },
        { id: 'receptions', text: 'Réceptions', icon: PackageCheck, path: '/receptions', permission: isAdmin || isGestionnaire, badge: receptionsEnAttente > 0 ? receptionsEnAttente : 0 },
        { id: 'retours-fournisseurs', text: 'Retours Fournisseurs', icon: RotateCcw, path: '/retours-fournisseurs', permission: isAdmin || isGestionnaire, badge: retoursEnAttente > 0 ? retoursEnAttente : 0 },
        { id: 'factures-fournisseurs', text: 'Factures Fournisseurs', icon: ReceiptIcon, path: '/factures-fournisseurs', permission: isAdmin || isGestionnaire || isComptable, badge: facturesImpayees > 0 ? facturesImpayees : 0 },
        { id: 'paiements-fournisseurs', text: 'Paiements Fournisseurs', icon: CreditCardIcon, path: '/paiements-fournisseurs', permission: isAdmin || isGestionnaire || isComptable, badge: paiementsFournisseursEnAttente > 0 ? paiementsFournisseursEnAttente : 0 },
        { id: 'dashboard-achats', text: 'Dashboard Achats', icon: BarChart, path: '/dashboard-achats', permission: isAdmin || isGestionnaire }
      ]
    });

    menuSections.splice(5, 0, {
      name: 'FINANCES', icon: DollarSign,
      items: [
        { id: 'dashboard-finances', text: 'Tableau de Bord Finances', icon: Gauge, path: '/dashboard-finances', permission: isAdmin || isComptable },
        { id: 'comptes-comptables', text: 'Plan Comptable', icon: Grid3x3, path: '/comptes-comptables', permission: isAdmin || isComptable },
        { id: 'ecritures-comptables', text: 'Écritures Comptables', icon: BookOpen, path: '/ecritures-comptables', permission: isAdmin || isComptable, badge: ecrituresBrouillon > 0 ? ecrituresBrouillon : 0 },
        { id: 'journal-comptable', text: 'Journal Comptable', icon: ScrollText, path: '/journal-comptable', permission: isAdmin || isComptable },
        { id: 'grand-livre', text: 'Grand Livre', icon: Scale, path: '/grand-livre', permission: isAdmin || isComptable },
        { id: 'balance-generale', text: 'Balance Générale', icon: TableProperties, path: '/balance-generale', permission: isAdmin || isComptable },
        { id: 'depenses', text: 'Dépenses', icon: TrendingDown, path: '/depenses', permission: isAdmin || isComptable, badge: depensesEnAttente > 0 ? depensesEnAttente : 0 },
        { id: 'budgets', text: 'Budgets', icon: PiggyBank, path: '/budgets', permission: isAdmin || isComptable, badge: budgetsAlertes > 0 ? budgetsAlertes : 0 },
        { id: 'rapports-financiers', text: 'Rapports Financiers', icon: FileSpreadsheet, path: '/rapports-financiers', permission: isAdmin || isComptable },
        { id: 'config-financiere', text: 'Configuration Financière', icon: Cog, path: '/config-financiere', permission: isAdmin },
        { id: 'separator-finances', separator: true, permission: true },
        { id: 'nouvelle-depense', text: 'Nouvelle Dépense', icon: PlusCircle, path: '/depenses/nouveau', permission: isAdmin || isComptable },
        { id: 'nouveau-budget', text: 'Nouveau Budget', icon: PlusCircle, path: '/budgets/nouveau', permission: isAdmin || isComptable },
        { id: 'nouvelle-ecriture', text: 'Nouvelle Écriture', icon: PlusCircle, path: '/ecritures-comptables/nouveau', permission: isAdmin || isComptable }
      ]
    });

    menuSections.splice(6, 0, {
      name: 'TRÉSORERIE', icon: Wallet,
      items: [
        { id: 'dashboard-tresorerie', text: 'Tableau de Bord Trésorerie', icon: Gauge, path: '/dashboard-tresorerie', permission: isAdmin || isComptable, badge: tresorerieAlerte > 0 ? tresorerieAlerte : 0 },
        { id: 'caisses', text: 'Caisses', icon: Banknote, path: '/caisses', permission: isAdmin || isComptable },
        { id: 'comptes-bancaires', text: 'Comptes Bancaires', icon: Landmark, path: '/comptes-bancaires', permission: isAdmin || isComptable },
        { id: 'mouvements-tresorerie', text: 'Mouvements Trésorerie', icon: Coins, path: '/mouvements-tresorerie', permission: isAdmin || isComptable },
        { id: 'frais', text: 'Frais & Dépenses', icon: ReceiptText, path: '/frais', permission: isAdmin || isComptable },
        { id: 'previsions', text: 'Prévisions', icon: CalendarDays, path: '/previsions', permission: isAdmin || isComptable },
        { id: 'rapprochement-bancaire', text: 'Rapprochement Bancaire', icon: CheckCircle, path: '/rapprochement-bancaire', permission: isAdmin || isComptable },
        { id: 'tresorerie-journaliere', text: 'Trésorerie Journalière', icon: ClipboardList, path: '/tresorerie-journaliere', permission: isAdmin || isComptable },
        { id: 'alertes-tresorerie', text: 'Alertes Trésorerie', icon: AlertCircleIcon, path: '/alertes-tresorerie', permission: isAdmin || isComptable }
      ]
    });

    menuSections.splice(7, 0, {
      name: 'LIVRAISONS', icon: Truck,
      items: [
        { id: 'livraisons', text: 'Livraisons', icon: TruckIcon, path: '/livraisons', permission: isAdmin || isGestionnaire },
        { id: 'tournees', text: 'Tournées', icon: Route, path: '/tournees', permission: isAdmin || isGestionnaire },
        { id: 'livreurs', text: 'Livreurs', icon: UserCheck, path: '/livreurs', permission: isAdmin || isGestionnaire },
        { id: 'suivi-livraisons', text: 'Suivi Livraisons', icon: Map, path: '/suivi-livraisons', permission: isAdmin || isGestionnaire }
      ]
    });

    menuSections.splice(8, 0, {
      name: 'PARAMÈTRES', icon: Settings,
      items: [
        { id: 'company-config', text: 'Configuration Établissement', icon: Building2, path: '/company-config', permission: isAdmin },
        { id: 'notifications', text: 'Notifications', icon: Bell, path: '/notifications', permission: isAdmin || isGestionnaire, badge: notificationsCount > 0 ? notificationsCount : 0 },
        { id: 'system-settings', text: 'Paramètres Système', icon: Cog, path: '/system-settings', permission: isAdmin },
        { id: 'document-templates', text: 'Modèles Documents', icon: Printer, path: '/document-templates', permission: isAdmin || isGestionnaire },
        { id: 'backups', text: 'Sauvegardes', icon: Database, path: '/backups', permission: isAdmin },
        { id: 'audit', text: "Journal d'audit", icon: History, path: '/audit', permission: isAdmin },
        { id: 'utilisateurs', text: 'Utilisateurs', icon: Users, path: '/utilisateurs', permission: isAdmin },
        { id: 'roles', text: 'Rôles & Permissions', icon: Shield, path: '/roles', permission: isAdmin }
      ]
    });
  }

  menuSections.push({
    name: 'MON ESPACE', icon: UserCircle,
    items: [
      { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
      { id: 'my-notifications', text: 'Mes Notifications', icon: BellRing, path: '/my-notifications', permission: true, badge: notificationsCount > 0 ? notificationsCount : 0 },
      { id: 'my-preferences', text: 'Mes Préférences', icon: Settings, path: '/my-preferences', permission: true },
      { id: 'support', text: 'Support', icon: HelpCircle, path: '/support', permission: true }
    ]
  });

  const visibleSections = menuSections
    .map(s => ({ ...s, items: s.items.filter(i => i.permission === true) }))
    .filter(s => s.items.length > 0);

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
      if (e.key === 'Escape') { setIsSearchOpen(false); setSearchQuery(''); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const searchResults = searchQuery.length > 1
    ? visibleSections.flatMap(s =>
        s.items.filter(i =>
          i.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(i => ({ ...i, section: s.name }))
      )
    : [];

  const renderMenuItem = (item, sectionName, isActive) => {
    if (item.separator) return <div key={item.id} className="border-t border-orange-200/60 my-2 mx-1"></div>;
    const ItemIcon = item.icon;
    const isNewItem = item.id?.startsWith('nouveau-');
    return (
      <Link
        key={item.id}
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
          ${isActive
            ? 'bg-orange-500 text-white shadow-md'
            : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'}
          ${isNewItem && !isActive ? 'border-l-2 border-orange-500 pl-3' : ''}
        `}
      >
        {ItemIcon && <ItemIcon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />}
        <span className="flex-1">{item.text}</span>
        {isNewItem && !isActive && <span className="badge badge-warning badge-xs">Nouveau</span>}
        {item.badge > 0 && (
          <span className={`badge badge-xs ${isActive ? 'badge-outline' : 'badge-error'}`}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-base-200">

      {/* ==================== RECHERCHE OVERLAY ==================== */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
          <div className="flex items-start justify-center pt-20 px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-orange-200">
              <div className="p-4 border-b border-orange-100">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-orange-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un menu, un produit, un client... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    autoFocus
                  />
                  <button onClick={() => setIsSearchOpen(false)} className="p-1 rounded-lg hover:bg-orange-50">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map(item => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.text}</p>
                        <p className="text-xs text-slate-400">{item.section}</p>
                      </div>
                    </Link>
                  ))
                ) : searchQuery.length > 1 ? (
                  <p className="text-center py-8 text-slate-400">Aucun résultat pour "{searchQuery}"</p>
                ) : (
                  <p className="text-center py-8 text-slate-400">Tapez pour rechercher</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          🎯 HEADER UNIQUE (site + logiciel) - 64px
          ================================================================ */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-orange-100 shadow-sm">
        <div className="px-3 sm:px-6 lg:pl-72">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

            {/* ---- GAUCHE : toggle + logo ZonACha ---- */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                title={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
              >
                {sidebarOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-orange-200 overflow-hidden bg-white shrink-0">
                  {!loadingEtab && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={etablissement?.nom || 'Logo ZonACha'}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Store className="w-6 h-6 text-orange-500" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-extrabold text-xl tracking-tight leading-none">
                    <span className="text-slate-900">Zon</span>
                    <span className="text-orange-500">Acha</span>
                  </h1>
                  <p className="text-orange-400 text-[10px] font-medium leading-tight">
                    Plus qu'une boutique, une expérience.
                  </p>
                </div>
                <span className="sm:hidden font-extrabold text-base">
                  <span className="text-slate-900">Zon</span>
                  <span className="text-orange-500">Acha</span>
                </span>
              </Link>
            </div>

            {/* ---- CENTRE : recherche globale ---- */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-2">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit, client, commande..."
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-11 pr-28 py-2.5 rounded-full border border-orange-200 bg-orange-50/40 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
                >
                  Rechercher
                </button>
              </div>
            </div>

            {/* ---- DROITE : actions logiciel ---- */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              {/* Recherche mobile */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Date / Heure (desktop large) */}
              <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 text-xs font-medium">{formattedDate}</span>
                <div className="w-px h-3 bg-slate-300"></div>
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 text-xs font-medium">{formattedTime}</span>
              </div>

              {/* Badge rôle */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                <RoleIcon className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-orange-700 text-xs font-semibold">{roleConfig.label}</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                <Bell className="w-5 h-5" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </button>

              {/* Thème */}
              <button
                onClick={toggleColorMode}
                className="p-2 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                title={mode === 'dark' ? "Mode clair" : "Mode sombre"}
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Menu utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-full hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm">
                    {userInitial || 'U'}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {userFullName?.split(' ')[0] || userName}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {roleConfig.label}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-orange-100 overflow-hidden">
                      <div className="p-4 bg-orange-500 text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                            {userInitial || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{userFullName || userName}</p>
                            <p className="text-xs text-white/80 truncate">{userEmail}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="badge badge-sm bg-white/20 border-none text-white">
                                {roleConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors">
                          <UserCircle className="w-5 h-5 text-slate-400" />
                          <span className="text-sm text-slate-700">Mon profil</span>
                        </Link>
                        <Link to="/my-preferences" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors">
                          <Settings className="w-5 h-5 text-slate-400" />
                          <span className="text-sm text-slate-700">Mes préférences</span>
                        </Link>
                        <Link to="/support" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors">
                          <HelpCircle className="w-5 h-5 text-slate-400" />
                          <span className="text-sm text-slate-700">Support</span>
                        </Link>
                        <div className="border-t border-orange-100 my-1"></div>
                        <button onClick={logoutUser}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-red-500">
                          <LogOut className="w-5 h-5" />
                          <span className="text-sm">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ================================================================
          📚 SIDEBAR DESKTOP (top-16)
          ================================================================ */}
      <aside className={`
        fixed left-0 top-16 bottom-0 z-30
        bg-white shadow-sm border-r border-orange-100
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
        hidden lg:block
      `}>
        <div className="h-full flex flex-col">

          {/* Logo + nom dans la sidebar */}
          <div className={`p-4 border-b border-orange-100 ${!sidebarOpen && 'text-center'} bg-orange-50/40`}>
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'} gap-3`}>
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                {!loadingEtab && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <Store className="w-6 h-6 text-white" />
                )}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <h2 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                    {etablissement?.nom ? (
                      <span>{etablissement.nom}</span>
                    ) : (
                      <><span>Zon</span><span className="text-orange-500">Acha</span></>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    {etablissement?.sigle || 'Zone Achat ERP'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Carte utilisateur */}
          <div className={`p-4 border-b border-orange-100 ${!sidebarOpen && 'text-center'}`}>
            <div className={`flex items-center ${!sidebarOpen && 'flex-col'} gap-3`}>
              <div className="avatar placeholder">
                <div className={`bg-orange-500 text-white rounded-xl ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'} shadow-sm ring-2 ring-orange-100`}>
                  <span className={`${sidebarOpen ? 'text-xl' : 'text-lg'} font-bold`}>{userInitial || 'U'}</span>
                </div>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-slate-800">{userFullName || userName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="badge badge-sm bg-orange-100 border-orange-200 text-orange-700">
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleConfig.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation sections */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleSections.map((section, idx) => {
              const SectionIcon = section.icon;
              const isOpen = openSections[section.name] || false;
              return (
                <div key={idx} className="mb-1">
                  <button
                    onClick={() => handleSectionToggle(section.name)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${!sidebarOpen && 'justify-center'}
                      ${isOpen
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'}
                    `}
                  >
                    <SectionIcon className="w-5 h-5 shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-xs font-bold tracking-wide uppercase">
                          {section.name}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </>
                    )}
                  </button>

                  {sidebarOpen && isOpen && (
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-orange-200 pl-4">
                      {section.items.map(item => renderMenuItem(item, section.name, path === item.path))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer sidebar */}
          <div className="p-4 border-t border-orange-100 bg-white">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">v2.1.0</span>
                </div>
                <span className="badge badge-sm bg-orange-100 border-orange-200 text-orange-700">ZonACha</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ================================================================
          📦 CONTENU PRINCIPAL (pt-16)
          ================================================================ */}
      <main className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
        <div className="p-4 sm:p-6">
          {content || (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">Aucun contenu à afficher</p>
            </div>
          )}
        </div>
      </main>

      {/* ================================================================
          📱 MENU MOBILE
          ================================================================ */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-2xl lg:hidden overflow-y-auto">
            <div className="relative overflow-hidden bg-orange-500 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm overflow-hidden">
                    {!loadingEtab && logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl"
                        onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <Store className="w-6 h-6 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-white leading-tight">
                      <span>Zon</span><span className="text-orange-200">Acha</span>
                    </h2>
                    <p className="text-white/80 text-xs">{roleConfig.label}</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  {userInitial || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{userFullName || userName}</p>
                  <p className="text-white/70 text-xs truncate">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Recherche mobile */}
            <div className="p-3 border-b border-orange-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  onFocus={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-200 bg-orange-50/40 text-sm"
                />
              </div>
            </div>

            <div className="py-4 px-3 space-y-1">
              {visibleSections.map((section, idx) => {
                const SectionIcon = section.icon;
                const isOpen = openSections[section.name] || false;
                return (
                  <div key={idx} className="mb-2">
                    <button
                      onClick={() => handleSectionToggle(section.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-xs font-bold uppercase text-slate-700">{section.name}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {isOpen && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-orange-200 pl-4">
                        {section.items.map(item => renderMenuItem(item, section.name, path === item.path))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;