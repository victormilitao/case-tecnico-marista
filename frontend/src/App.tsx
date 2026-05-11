import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { StudentLoginPage } from './pages/StudentLogin';
import { StudentDashboardPage } from './pages/StudentDashboard';
import { DashboardPage } from './pages/Dashboard';
import { StudentsPage } from './pages/Students';
import { RoomsPage } from './pages/Rooms';
import { AttendancePage } from './pages/Attendance';
import { AuditLogsPage } from './pages/AuditLogs';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/aluno/login" element={<StudentLoginPage />} />

            <Route element={<ProtectedRoute role="admin" />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/aluno" element={<StudentDashboardPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
