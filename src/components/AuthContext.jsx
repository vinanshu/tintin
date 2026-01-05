import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🚀 AuthContext - Initializing auth...");
    checkSession();
  }, []);

  const checkSession = () => {
    console.log("🔍 checkSession called");
    try {
      setLoading(true);
      
      // Check all session types
      const sessionTypes = [
        { type: "admin", userKey: "adminUser", expiryKey: "adminSessionExpiry" },
        { type: "personnel", userKey: "personnelUser", expiryKey: "personnelSessionExpiry" },
        { type: "recruitment", userKey: "recruitmentUser", expiryKey: "recruitmentSessionExpiry" },
        { type: "recruitment_personnel", userKey: "recruitmentPersonnelUser", expiryKey: "recruitmentPersonnelSessionExpiry" }
      ];

      console.log("📦 localStorage contents:");
      let foundUser = null;
      let userType = null;
      let latestExpiry = 0;

      sessionTypes.forEach(session => {
        const userData = localStorage.getItem(session.userKey);
        const sessionExpiry = localStorage.getItem(session.expiryKey);

        if (userData && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry);
          console.log(`👤 Found ${session.type} session, expiry:`, expiryTime);
          
          if (Date.now() < expiryTime) {
            try {
              const parsedUser = JSON.parse(userData);
              console.log(`✅ Valid ${session.type} session for:`, parsedUser.username);
              
              if (expiryTime > latestExpiry) {
                foundUser = parsedUser;
                userType = session.type;
                latestExpiry = expiryTime;
              }
            } catch (parseError) {
              console.error(`❌ Failed to parse ${session.type} user JSON:`, parseError);
              localStorage.removeItem(session.userKey);
              localStorage.removeItem(session.expiryKey);
            }
          } else {
            console.log(`⏰ ${session.type} session expired`);
            localStorage.removeItem(session.userKey);
            localStorage.removeItem(session.expiryKey);
          }
        }
      });

      if (foundUser) {
        console.log("🎯 Setting user state:", foundUser.username, "type:", userType);
        setUser(foundUser);
      } else {
        console.log("❌ No valid session found");
        setUser(null);
      }
    } catch (error) {
      console.error("💥 Session check error:", error);
      setUser(null);
      clearAllSessions();
    } finally {
      console.log("🏁 checkSession completed, setting loading to false");
      setLoading(false);
    }
  };

  const clearAllSessions = () => {
    console.log("🧹 Clearing all sessions...");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminSessionExpiry");
    localStorage.removeItem("personnelUser");
    localStorage.removeItem("personnelSessionExpiry");
    localStorage.removeItem("recruitmentUser");
    localStorage.removeItem("recruitmentSessionExpiry");
    localStorage.removeItem("recruitmentPersonnelUser");
    localStorage.removeItem("recruitmentPersonnelSessionExpiry");
  };

  const clearOtherSessions = (currentType) => {
    console.log(`🧹 Clearing sessions except ${currentType}...`);
    
    const sessionsToClear = {
      admin: ["personnel", "recruitment", "recruitment_personnel"],
      personnel: ["admin", "recruitment", "recruitment_personnel"],
      recruitment: ["admin", "personnel", "recruitment_personnel"],
      recruitment_personnel: ["admin", "personnel", "recruitment"]
    };

    const typesToClear = sessionsToClear[currentType] || [];
    
    typesToClear.forEach(type => {
      switch(type) {
        case "admin":
          localStorage.removeItem("adminUser");
          localStorage.removeItem("adminSessionExpiry");
          break;
        case "personnel":
          localStorage.removeItem("personnelUser");
          localStorage.removeItem("personnelSessionExpiry");
          break;
        case "recruitment":
          localStorage.removeItem("recruitmentUser");
          localStorage.removeItem("recruitmentSessionExpiry");
          break;
        case "recruitment_personnel":
          localStorage.removeItem("recruitmentPersonnelUser");
          localStorage.removeItem("recruitmentPersonnelSessionExpiry");
          break;
      }
    });
  };

  // Helper function to determine role from position
  const determineRole = (position) => {
    if (!position) return "personnel";
    
    const pos = position.toLowerCase();
    if (pos.includes('admin') || pos.includes('head') || pos.includes('chief')) {
      return "admin";
    } else if (pos.includes('officer') || pos.includes('coordinator')) {
      return "officer";
    } else if (pos.includes('hr') || pos.includes('human resources')) {
      return "hr";
    } else if (pos.includes('interview')) {
      return "interviewer";
    } else if (pos.includes('recruitment')) {
      return "recruitment_officer";
    } else {
      return "personnel";
    }
  };

  // Helper function to get permissions based on role
  const getPermissions = (role) => {
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'view_reports', 'manage_applications'],
      officer: ['read', 'write', 'view_reports', 'manage_applications'],
      hr: ['read', 'write', 'manage_applications', 'schedule_interviews'],
      interviewer: ['read', 'write_interview_notes', 'rate_candidates'],
      recruitment_officer: ['read', 'write', 'manage_applications', 'view_reports', 'manage_candidates'],
      personnel: ['read']
    };
    
    return permissions[role] || permissions.personnel;
  };

  const login = async (username, password, userType = "admin") => {
    try {
      setLoading(true);
      console.log("🔐 Login attempt for:", username, "type:", userType);

      // Clear other session types when logging in
      clearOtherSessions(userType);

      let result = null;

      switch(userType) {
        case "admin":
          result = await loginAdmin(username, password);
          break;
        case "personnel":
          result = await loginPersonnel(username, password);
          break;
        case "recruitment":
        case "recruitment_personnel":
          // Both recruitment types use the same table
          result = await loginRecruitment(username, password, userType);
          break;
        default:
          return { success: false, message: "Invalid user type" };
      }

      if (result.success) {
        const userData = result.user;
        // Store session (24 hours)
        const sessionDuration = 24 * 60 * 60 * 1000;
        const sessionExpiry = Date.now() + sessionDuration;

        // Store based on user type
        switch(userType) {
          case "admin":
            localStorage.setItem("adminUser", JSON.stringify(userData));
            localStorage.setItem("adminSessionExpiry", sessionExpiry.toString());
            break;
          case "personnel":
            localStorage.setItem("personnelUser", JSON.stringify(userData));
            localStorage.setItem("personnelSessionExpiry", sessionExpiry.toString());
            break;
          case "recruitment":
            localStorage.setItem("recruitmentUser", JSON.stringify(userData));
            localStorage.setItem("recruitmentSessionExpiry", sessionExpiry.toString());
            break;
          case "recruitment_personnel":
            localStorage.setItem("recruitmentPersonnelUser", JSON.stringify(userData));
            localStorage.setItem("recruitmentPersonnelSessionExpiry", sessionExpiry.toString());
            break;
        }

        setUser(userData);
        console.log(`✅ ${userType} login successful:`, userData.username);
      }

      return result;
    } catch (error) {
      console.error("💥 Login error:", error);
      return { success: false, message: "Login failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  // Admin Login
  const loginAdmin = async (username, password) => {
    try {
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Admin query error:", error);
        return { success: false, message: "System error. Please try again." };
      }

      if (!adminUser) {
        console.error("Admin user not found");
        return { success: false, message: "Invalid username or password" };
      }

      // Plain text password comparison
      if (adminUser.password !== password) {
        console.error("Password mismatch");
        return { success: false, message: "Invalid username or password" };
      }

      // Update last login
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminUser.id);

      // Create user session
      const userData = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        user_type: "admin",
        isAdmin: adminUser.role === "admin",
        isInspector: adminUser.role === "inspector",
        personnel_id: adminUser.personnel_id,
        created_at: adminUser.created_at,
        last_login: new Date().toISOString(),
      };

      return { success: true, user: userData };
    } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, message: "Admin login failed" };
    }
  };

  // Personnel Login
  const loginPersonnel = async (username, password) => {
    try {
      const { data: personnel, error } = await supabase
        .from("personnel")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Personnel query error:", error);
        return { success: false, message: "System error. Please try again." };
      }

      if (!personnel) {
        console.error("Personnel not found");
        return { success: false, message: "Invalid username or password" };
      }

      // Plain text password comparison
      if (personnel.password !== password) {
        console.error("Password mismatch");
        return { success: false, message: "Invalid username or password" };
      }

      // Update last login
      await supabase
        .from("personnel")
        .update({ last_login: new Date().toISOString() })
        .eq("id", personnel.id);

      // Determine role based on admin status
      let role = "employee";
      let isAdmin = false;

      if (personnel.is_admin) {
        role = personnel.admin_role || "admin";
        isAdmin = true;
      }

      // Create user session
      const userData = {
        id: personnel.id,
        username: personnel.username,
        email: personnel.email,
        badge_number: personnel.badge_number,
        first_name: personnel.first_name,
        last_name: personnel.last_name,
        full_name: `${personnel.first_name} ${personnel.last_name}`,
        rank: personnel.rank,
        designation: personnel.designation,
        station: personnel.station,
        photo_url: personnel.photo_url,
        role: role,
        user_type: "personnel",
        isAdmin: isAdmin,
        admin_role: personnel.admin_role || "none",
        admin_level: personnel.admin_level || "none",
        can_manage_leaves: personnel.can_manage_leaves || false,
        can_manage_personnel: personnel.can_manage_personnel || false,
        can_approve_requests: personnel.can_approve_requests || false,
        can_approve_leaves: personnel.can_approve_leaves || false,
        permissions: personnel.permissions || [],
        created_at: personnel.created_at,
        last_login: new Date().toISOString(),
      };

      return { success: true, user: userData };
    } catch (error) {
      console.error("Personnel login error:", error);
      return { success: false, message: "Personnel login failed" };
    }
  };

  // Recruitment Login (uses recruitment_personnel table for both recruitment and recruitment_personnel)
  const loginRecruitment = async (username, password, requestedUserType = "recruitment") => {
    try {
      const { data: recruitmentUser, error } = await supabase
        .from("recruitment_personnel")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Recruitment query error:", error);
        return { success: false, message: "System error. Please try again." };
      }

      if (!recruitmentUser) {
        console.error("Recruitment user not found");
        return { success: false, message: "Invalid username or password" };
      }

      // Plain text password comparison
      if (recruitmentUser.password !== password) {
        console.error("Password mismatch");
        return { success: false, message: "Invalid username or password" };
      }

      // Update last login
      await supabase
        .from("recruitment_personnel")
        .update({ last_login: new Date().toISOString() })
        .eq("id", recruitmentUser.id);

      const role = determineRole(recruitmentUser.position);
      const permissions = getPermissions(role);

      // Determine user type based on requested type and user's position
      let userType = requestedUserType;
      
      // If it's recruitment_personnel but position suggests they're staff/recruiter, change to recruitment
      if (requestedUserType === "recruitment_personnel" && 
          (role === "admin" || role === "officer" || role === "hr" || role === "recruitment_officer")) {
        userType = "recruitment";
      }
      
      // If it's recruitment but position suggests they're a candidate, change to recruitment_personnel
      if (requestedUserType === "recruitment" && 
          (role === "personnel" || !recruitmentUser.position?.toLowerCase().includes('recruitment'))) {
        userType = "recruitment_personnel";
      }

      // Create user session
      const userData = {
        id: recruitmentUser.id,
        username: recruitmentUser.username,
        candidate: recruitmentUser.candidate,
        full_name: recruitmentUser.full_name,
        position: recruitmentUser.position,
        role: role,
        user_type: userType,
        stage: recruitmentUser.stage,
        status: recruitmentUser.status,
        permissions: permissions,
        photo_url: recruitmentUser.photo_url,
        resume_url: recruitmentUser.resume_url,
        contact_info: {
          contact_number: recruitmentUser.contact_number,
          emergency_contact: recruitmentUser.emergency_contact,
          emergency_contact_number: recruitmentUser.emergency_contact_number,
          address: recruitmentUser.address,
          city: recruitmentUser.city,
          province: recruitmentUser.province,
          zip_code: recruitmentUser.zip_code
        },
        personal_info: {
          date_of_birth: recruitmentUser.date_of_birth,
          gender: recruitmentUser.gender,
          civil_status: recruitmentUser.civil_status,
          educational_background: recruitmentUser.educational_background
        },
        schedule_info: {
          schedule_date: recruitmentUser.schedule_date,
          schedule_location: recruitmentUser.schedule_location,
          schedule_notes: recruitmentUser.schedule_notes
        },
        hr_contact: {
          hr_contact_person: recruitmentUser.hr_contact_person,
          hr_contact_email: recruitmentUser.hr_contact_email,
          hr_contact_phone: recruitmentUser.hr_contact_phone,
          hr_office_hours: recruitmentUser.hr_office_hours
        },
        application_date: recruitmentUser.application_date,
        interview_date: recruitmentUser.interview_date,
        is_admin: role === "admin",
        is_hr: role === "hr",
        is_interviewer: role === "interviewer",
        is_recruitment_officer: role === "recruitment_officer" || role === "officer",
        created_at: recruitmentUser.created_at,
        last_login: new Date().toISOString(),
      };

      return { success: true, user: userData };
    } catch (error) {
      console.error("Recruitment login error:", error);
      return { success: false, message: "Recruitment login failed" };
    }
  };

  const logout = () => {
    console.log("🚪 Logging out...");
    clearAllSessions();
    setUser(null);
    navigate("/");
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkSession,
    hasRole: (requiredRole) => user?.role === requiredRole,
    hasPermission: (permission) => user?.permissions?.includes(permission) || false,
    isAdmin: user?.isAdmin || user?.is_admin || false,
    isPersonnel: user?.user_type === "personnel",
    isRecruitment: user?.user_type === "recruitment",
    isRecruitmentPersonnel: user?.user_type === "recruitment_personnel",
    getUserType: () => user?.user_type,
    getRole: () => user?.role,
    getPermissions: () => user?.permissions || []
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};