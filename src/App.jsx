import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { SidebarProvider } from "./components/SidebarContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";

// Admin Components
import AdminDashboard from "./components/admin/JSX/AdminDashboard";
import InventoryControl from "./components/admin/JSX/InventoryControl";
import LeaveManagement from "./components/admin/JSX/LeaveManagement";
import ClearanceSystem from "./components/admin/JSX/ClearanceSystem";
import PersonnelRegister from "./components/admin/JSX/PersonnelRegister";
import PersonnelProfile from "./components/admin/JSX/PersonnelProfile";
import LeaveRecords from "./components/admin/JSX/LeaveRecords";
import ClearanceRecords from "./components/admin/JSX/ClearanceRecords";
import MedicalRecords from "./components/admin/JSX/MedicalRecords";
import AwardsCommendations from "./components/admin/JSX/AwardsCommendations";
import Promotion from "./components/admin/JSX/Promotion";
import RecruitmentPersonnel from "./components/admin/JSX/RecruitmentPersonnel";
import Trainings from "./components/admin/JSX/Trainings";
import Placement from "./components/admin/JSX/Placement";
import History from "./components/admin/JSX/History";
import PersonnelRecentActivity from "./components/admin/JSX/PersonnelRecentActivity";

// Inspector Components
import InspectorSidebar from "./components/InspectorSidebar";
import InspectorDashboard from "./components/inspector/JSX/InspectorDashboard";
import InspectorInventoryControl from "./components/inspector/JSX/InspectorInventoryControl";
import InspectorEquipmentInspection from "./components/inspector/JSX/InspectorEquipmentInspection";
import InspectorInspectionReport from "./components/inspector/JSX/InspectorInspectionReport";
import InspectionHistory from "./components/inspector/JSX/InspectionHistory";

// Recruitment Components
import RecruitmentDashboard from "./components/admin/JSX/RecruitmentDashboard";

// Employee Components
import EmployeeDashboard from "./components/employee/JSX/EmployeeDashboard";
import EmployeeLeaveDashboard from "./components/employee/JSX/EmployeeLeaveDashboard";
import EmployeeLeaveRequest from "./components/employee/JSX/EmployeeLeaveRequest";

// Other imports
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HeadProvider } from "react-head";


function App() {
  return (
    <HeadProvider>
      <Router>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Login />} />

              {/* Admin-only routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventoryControl"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <InventoryControl />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaveManagement"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <LeaveManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clearanceSystem"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <ClearanceSystem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnelRegister"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <PersonnelRegister />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnelProfile"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <PersonnelProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaveRecords"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <LeaveRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clearanceRecords"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <ClearanceRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medicalRecords"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <MedicalRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/awardsCommendations"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <AwardsCommendations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/promotion"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <Promotion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitmentPersonnel"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <RecruitmentPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trainings"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <Trainings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/placement"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <Placement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <History />
                  </ProtectedRoute>
                }
              />

              {/* Recruitment Dashboard - for ALL recruitment users */}
              <Route
                path="/recruitment-dashboard"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["recruitment", "recruitment_personnel"]}
                  >
                    <RecruitmentDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Original recruitment route - redirect to dashboard */}
              <Route
                path="/recruitment"
                element={<Navigate to="/recruitment-dashboard" replace />}
              />
              
              <Route
                path="/recruitment/profile"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["recruitment", "recruitment_personnel"]}
                  >
                    <PersonnelProfile isRecruitment={true} />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/personnelRecentActivity"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["admin"]}
                    allowedRoles={["admin"]}
                  >
                    <PersonnelRecentActivity />
                  </ProtectedRoute>
                }
              />

              {/* Inspector routes - CORRECTED PATHS */}
              <Route
                path="/inspectorDashboard"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["inspector", "admin"]}
                    allowedRoles={["inspector", "admin"]}
                  >
                    <InspectorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspectorInventoryControl"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["inspector", "admin"]}
                    allowedRoles={["inspector", "admin"]}
                  >
                    <InspectorInventoryControl />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspectorEquipmentInspection"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["inspector", "admin"]}
                    allowedRoles={["inspector", "admin"]}
                  >
                    <InspectorEquipmentInspection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspectorInspectionReport"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["inspector", "admin"]}
                    allowedRoles={["inspector", "admin"]}
                  >
                    <InspectorInspectionReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/InspectionHistory"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["inspector", "admin"]}
                    allowedRoles={["inspector", "admin"]}
                  >
                    <InspectionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspector"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["inspector", "admin"]}
                    allowedRoles={["inspector", "admin"]}
                  >
                    <InspectorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Employee-only routes */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["personnel"]}
                    allowedRoles={["employee"]}
                  >
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employeeLeaveDashboard"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["personnel"]}
                    allowedRoles={["employee"]}
                  >
                    <EmployeeLeaveDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employeeLeaveRequest"
                element={
                  <ProtectedRoute 
                    allowedUserTypes={["personnel"]}
                    allowedRoles={["employee"]}
                  >
                    <EmployeeLeaveRequest />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer />
          </SidebarProvider>
        </AuthProvider>
      </Router>
    </HeadProvider>
  );
}

export default App;