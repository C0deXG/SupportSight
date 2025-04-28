import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import Issues from './pages/Issues'
import Layout from './components/Layout'
import Login from './pages/Login'
import SharedProject from './pages/SharedProject'
import SharedIssue from './pages/SharedIssue'
import { AuthProvider, useAuth } from './lib/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/shared-project/:projectId" element={<SharedProject />} />
          <Route path="/share/issue/:issueId" element={<SharedIssue />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <Clients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/issues"
            element={
              <ProtectedRoute>
                <Layout>
                  <Issues />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  )
}

export default App
