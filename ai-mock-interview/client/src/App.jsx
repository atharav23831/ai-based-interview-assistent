import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewHistory from './pages/InterviewHistory';
import InterviewReport from './pages/InterviewReport';
import Interview from './pages/Interview';
import Annotate from './pages/Annotate';
import { AuthContext } from './context/AuthContext';

// --- Protected Route ---
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};

// --- App ---
function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><InterviewHistory /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
            <Route path="/annotate" element={<ProtectedRoute><Annotate /></ProtectedRoute>} />
        </Routes>
    );
}

export default App;
