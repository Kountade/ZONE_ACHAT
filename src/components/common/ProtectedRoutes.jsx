// src/components/ProtectedRoutes.jsx
import { Outlet, Navigate, useLocation } from 'react-router-dom'

// ⭐ Redirection par défaut selon le rôle
const getHomeByRole = (role) => {
    switch (role) {
        case 'eleve':
            return '/releve-notes'
        case 'professeur':
        case 'enseignant':
            return '/emplois-temps'
        case 'surveillant':
            return '/surveillance-jour'
        case 'finance':
            return '/dashboard-finances'
        case 'vie_scolaire':
            return '/absences'
        default:
            return '/dashboard'
    }
}

// ⭐ Routes interdites par rôle (redirection automatique)
const FORBIDDEN_BY_ROLE = {
    eleve: ['/dashboard', '/statistiques'],
    professeur: ['/dashboard', '/statistiques'],
    enseignant: ['/dashboard', '/statistiques'],
    surveillant: ['/dashboard', '/statistiques'],
    finance: ['/dashboard', '/statistiques'],
    vie_scolaire: ['/dashboard', '/statistiques'],
}

const ProtectedRoute = () => {
    const token = localStorage.getItem('Token')
    const location = useLocation()

    // Pas connecté → login
    if (!token) {
        return <Navigate to="/" replace />
    }

    // Récupérer le rôle
    let user = null
    try {
        user = JSON.parse(localStorage.getItem('User') || 'null')
    } catch {
        user = null
    }
    const role = user?.role || null

    // ⭐ Si la route est interdite pour ce rôle → redirection
    const forbidden = FORBIDDEN_BY_ROLE[role] || []
    const isForbidden = forbidden.some(path =>
        location.pathname === path || location.pathname.startsWith(path + '/')
    )

    if (isForbidden) {
        return <Navigate to={getHomeByRole(role)} replace />
    }

    return <Outlet />
}

export default ProtectedRoute