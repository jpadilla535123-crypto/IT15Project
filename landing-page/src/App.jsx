import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { canAccess } from './api/permissions'
import { DataProvider } from './api/data'
import { SystemStateProvider } from './components/dashboard/SystemState'
import ErrorBoundary from './components/common/ErrorBoundary'
import Landing from './pages/Landing'
import Services from './pages/Services'
import Venues from './pages/Venues'
import ContactUs from './pages/ContactUs'
import Dashboard from './pages/Dashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffCalendar from './pages/staff/StaffCalendar'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import EventCalendar from './pages/EventCalendar'
import EventManagement from './pages/EventManagement'
import EmployeeAssignments from './pages/EmployeeAssignments'
import VenueManagement from './pages/VenueManagement'
import SupplierManagement from './pages/SupplierManagement'
import EmployeeManagement from './pages/EmployeeManagement'
import BudgetManagement from './pages/BudgetManagement'
import Billing from './pages/Billing'
import PaymentReview from './pages/PaymentReview'
import Reports from './pages/Reports'

function GuardedRoute({ path, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/" replace />

  if (!canAccess(user.role, path)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF2B66]" />
      </div>
    )
  }

  return (
    <DataProvider>
      <SystemStateProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing user={user} />} />
            <Route path="/services" element={<Services />} />
            <Route path="/venues" element={<Venues user={user} />} />
            <Route path="/contact-us" element={<ContactUs user={user} />} />
            <Route path="/dashboard" element={<GuardedRoute path="/dashboard">{user?.role === 'Staff' ? <StaffDashboard user={user} /> : user?.role === 'Finance' ? <FinanceDashboard user={user} /> : <Dashboard user={user} />}</GuardedRoute>} />
            <Route path="/leads" element={<GuardedRoute path="/leads"><Leads user={user} /></GuardedRoute>} />
            <Route path="/clients" element={<GuardedRoute path="/clients"><Clients user={user} /></GuardedRoute>} />
            <Route path="/calendar" element={<GuardedRoute path="/calendar">{user?.role === 'Staff' ? <StaffCalendar user={user} /> : <EventCalendar user={user} />}</GuardedRoute>} />
            <Route path="/events" element={<GuardedRoute path="/events"><EventManagement user={user} /></GuardedRoute>} />
            <Route path="/assignments" element={<GuardedRoute path="/assignments"><EmployeeAssignments user={user} /></GuardedRoute>} />
            <Route path="/venues-mgmt" element={<GuardedRoute path="/venues-mgmt"><VenueManagement user={user} /></GuardedRoute>} />
            <Route path="/suppliers-mgmt" element={<GuardedRoute path="/suppliers-mgmt"><SupplierManagement user={user} /></GuardedRoute>} />
            <Route path="/employees-mgmt" element={<GuardedRoute path="/employees-mgmt"><EmployeeManagement user={user} /></GuardedRoute>} />
            <Route path="/budget" element={<GuardedRoute path="/budget"><BudgetManagement user={user} /></GuardedRoute>} />
            <Route path="/billing" element={<GuardedRoute path="/billing"><Billing user={user} /></GuardedRoute>} />
            <Route path="/payment-review" element={<GuardedRoute path="/payment-review"><PaymentReview user={user} /></GuardedRoute>} />
            <Route path="/reports" element={<GuardedRoute path="/reports"><Reports user={user} /></GuardedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </SystemStateProvider>
    </DataProvider>
  )
}