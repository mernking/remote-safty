import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import Login from "./components/Login";
import Dashboard from "./components/pages/Dashboard";
import Sites from "./components/pages/Sites";
import SiteDetail from "./components/pages/SiteDetail";
import NewSite from "./components/pages/NewSite";
import Inspections from "./components/pages/Inspections";
import Incidents from "./components/pages/Incidents";
import ToolboxTalks from "./components/pages/ToolboxTalks";
import Reports from "./components/pages/Reports";
import Users from "./components/pages/Users";
import UserDetail from "./components/pages/UserDetail";
import NewUser from "./components/pages/NewUser";
import EditUser from "./components/pages/EditUser";
import SyncStatus from "./components/pages/SyncStatus";
import NewInspection from "./components/pages/NewInspection";
import NewIncident from "./components/pages/NewIncident";
import NewToolboxTalk from "./components/pages/NewToolboxTalk";
import InspectionDetail from "./components/pages/InspectionDetail";
import EditInspection from "./components/pages/EditInspection";
import IncidentDetail from "./components/pages/IncidentDetail";
import EditIncident from "./components/pages/EditIncident";
import ToolboxTalkDetail from "./components/pages/ToolboxTalkDetail";
import EditToolboxTalk from "./components/pages/EditToolboxTalk";
import Profile from "./components/pages/Profile";
import Layout from "./components/Layout";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SyncProvider } from "./context/SyncContext";
import NoAuthLayout from "./components/NoAuthLayout";
import Home from "./components/Home";
import Signup from "./components/Signup";
import BugReport from "./components/BugReport";
import Community from "./components/Community";
import Contact from "./components/Contact";
import Support from "./components/Support";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <NoAuthLayout>
            <Home />
          </NoAuthLayout>
        }
      />
      <Route
        path="/bug-report"
        element={
          <NoAuthLayout>
            <BugReport />
          </NoAuthLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <NoAuthLayout>
            <Contact />
          </NoAuthLayout>
        }
      />
      <Route
        path="/support"
        element={
          <NoAuthLayout>
            <Support />
          </NoAuthLayout>
        }
      />
      <Route
        path="/community"
        element={
          <NoAuthLayout>
            <Community />
          </NoAuthLayout>
        }
      />
      <Route
        path="/signup"
        element={
          <NoAuthLayout>
            <Signup />
          </NoAuthLayout>
        }
      />
      <Route
        path="/login"
        element={
          <NoAuthLayout>
            <Login />
          </NoAuthLayout>
        }
      />
      <Route
        path="/dashboard/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sites"
        element={
          <ProtectedRoute>
            <Layout>
              <Sites />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sites/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewSite />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sites/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SiteDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/inspections"
        element={
          <ProtectedRoute>
            <Layout>
              <Inspections />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/inspections/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewInspection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/inspections/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <InspectionDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/inspections/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditInspection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/incidents"
        element={
          <ProtectedRoute>
            <Layout>
              <Incidents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/incidents/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewIncident />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sites/:siteId/incidents/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewIncident />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/incidents/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <IncidentDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/incidents/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditIncident />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/toolbox-talks"
        element={
          <ProtectedRoute>
            <Layout>
              <ToolboxTalks />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/toolbox-talks/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewToolboxTalk />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/toolbox-talks/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ToolboxTalkDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/toolbox-talks/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditToolboxTalk />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/users/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewUser />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/users/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <UserDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/users/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditUser />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sync"
        element={
          <ProtectedRoute>
            <Layout>
              <SyncStatus />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
