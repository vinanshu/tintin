import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Title, Meta } from "react-head";
import { Eye, EyeOff, AlertTriangle, Lock, User, Loader2 } from "lucide-react";
import "./Login.css";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState({ show: false, title: "", message: "" });
  const [isLocked, setIsLocked] = useState(false);
  const [loginButtonText, setLoginButtonText] = useState("Login");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [securityData, setSecurityData] = useState(null);
  const [loadingSecurity, setLoadingSecurity] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clientIp, setClientIp] = useState("unknown");

  const MAX_ATTEMPTS = 3;
  const MAX_LOCKOUTS = 3;

  // Get client IP
  useEffect(() => {
    const getIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        if (!response.ok) throw new Error("Failed to fetch IP");
        const data = await response.json();
        setClientIp(data.ip);
      } catch (error) {
        console.log("Could not get IP:", error);
        // Generate a unique identifier for the user
        const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setClientIp(uniqueId);
      }
    };
    getIP();
  }, []);

  // Load security data when IP is available
  useEffect(() => {
    if (clientIp !== "unknown") {
      loadSecurityData();
    }
  }, [clientIp]);

  // Load security data
  const loadSecurityData = async () => {
    try {
      setLoadingSecurity(true);
      const now = Date.now();

      // Try to load from login_security table
      let data = null;
      try {
        const { data: securityData, error } = await supabase
          .from("login_security")
          .select("*")
          .eq("ip_address", clientIp)
          .single();

        if (error) {
          // If no record found, create one
          if (error.code === "PGRST116") {
            console.log("No security record found, creating new one");
            data = await createSecurityRecord();
          } else {
            console.error("Error loading security data:", error);
            data = await createSecurityRecord();
          }
        } else {
          data = securityData;
        }
      } catch (error) {
        console.error("Error accessing security data:", error);
        data = await createSecurityRecord();
      }

      // Set security data
      setSecurityData(data);
      
      // Handle security restrictions
      if (data?.brute_force_until && now < data.brute_force_until) {
        const remainingMs = data.brute_force_until - now;
        startBruteForceCountdown(remainingMs);
        showModal(
          "🚫 Login Blocked",
          `Login is blocked. Please wait ${formatMs(remainingMs)} before trying again.`
        );
        return;
      }

      if (data?.temp_until && now < data.temp_until) {
        const remaining = Math.ceil((data.temp_until - now) / 1000);
        lockLoginTemp(remaining);
        showModal(
          "⏳ Temporary Lock",
          `Too many failed attempts. Please wait ${remaining} seconds before retrying.`
        );
      } else {
        setIsLocked(false);
        setLoginButtonText("Login");
      }
    } catch (error) {
      console.error("Error in loadSecurityData:", error);
      // Initialize with default data
      const defaultData = {
        failed_attempts: 0,
        lockout_count: 0,
        temp_until: null,
        brute_force_until: null,
      };
      setSecurityData(defaultData);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const createSecurityRecord = async () => {
    try {
      const newRecord = {
        ip_address: clientIp,
        failed_attempts: 0,
        lockout_count: 0,
        temp_until: null,
        brute_force_until: null,
        last_attempt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("login_security")
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        console.error("Error creating security record:", error);
        return newRecord;
      }

      return data || newRecord;
    } catch (error) {
      console.error("Error in createSecurityRecord:", error);
      return {
        ip_address: clientIp,
        failed_attempts: 0,
        lockout_count: 0,
        temp_until: null,
        brute_force_until: null,
      };
    }
  };

  const updateSecurityRecord = async (updates) => {
    try {
      const supabaseUpdates = {
        ...updates,
        last_attempt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("login_security")
        .update(supabaseUpdates)
        .eq("ip_address", clientIp)
        .select()
        .single();

      if (!error && data) {
        setSecurityData(data);
        return data;
      }

      // If update fails, update local state
      const newData = { ...securityData, ...updates };
      setSecurityData(newData);
      return newData;
    } catch (error) {
      console.error("Error updating security record:", error);
      const newData = { ...securityData, ...updates };
      setSecurityData(newData);
      return newData;
    }
  };

  const formatMs = (ms) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const showModal = (title, message) => {
    setModal({ show: true, title, message });
  };

  const closeModal = () => {
    setModal({ show: false, title: "", message: "" });
  };

  const lockLoginTemp = async (seconds) => {
    setIsLocked(true);
    const now = Date.now();
    const tempUntil = now + seconds * 1000;

    await updateSecurityRecord({
      temp_until: tempUntil,
    });

    let remaining = seconds;
    setLoginButtonText(`Retry in ${remaining}s`);

    const interval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        setLoginButtonText(`Retry in ${remaining}s`);
      } else {
        clearInterval(interval);
        setIsLocked(false);
        updateSecurityRecord({
          temp_until: null,
          failed_attempts: 0,
        });
        setLoginButtonText("Login");
      }
    }, 1000);
  };

  const startBruteForceCountdown = (remainingMs) => {
    setIsLocked(true);
    
    const update = () => {
      remainingMs -= 1000;

      if (remainingMs <= 0) {
        updateSecurityRecord({
          brute_force_until: null,
          lockout_count: 0,
          failed_attempts: 0,
        });
        setIsLocked(false);
        setLoginButtonText("Login");
        if (modal.show) {
          closeModal();
        }
        return;
      }

      const formatted = formatMs(remainingMs);
      setLoginButtonText(`Blocked ${formatted}`);

      setTimeout(update, 1000);
    };

    update();
  };

  const triggerBruteForceBlock = async (seconds) => {
    const now = Date.now();
    const until = now + seconds * 1000;

    await updateSecurityRecord({
      brute_force_until: until,
      lockout_count: (securityData?.lockout_count || 0) + 1,
      failed_attempts: 0,
      temp_until: null,
    });

    startBruteForceCountdown(seconds * 1000);
    showModal(
      "🚫 Account Blocked",
      `Multiple lockouts detected. Login blocked for ${Math.ceil(seconds / 60)} minute(s).`
    );
  };

  const handleTempLockAndMaybeBruteForce = async (seconds) => {
    const newLockoutCount = (securityData?.lockout_count || 0) + 1;

    await updateSecurityRecord({
      lockout_count: newLockoutCount,
      failed_attempts: MAX_ATTEMPTS,
    });

    await lockLoginTemp(seconds);

    if (newLockoutCount >= MAX_LOCKOUTS) {
      await triggerBruteForceBlock(600); // 10 minutes
    }
  };

  // Login sequence with priority
  const handleLogin = async () => {
    if (loadingSecurity || loading) {
      showModal("Please wait", "System is initializing...");
      return;
    }

    if (!securityData) {
      showModal("System Error", "Security system not initialized.");
      return;
    }

    // Check brute force lock
    const now = Date.now();
    if (securityData.brute_force_until && now < securityData.brute_force_until) {
      const remainingMs = securityData.brute_force_until - now;
      showModal("🚫 Login Blocked", `Please wait ${formatMs(remainingMs)}`);
      return;
    }

    if (isLocked) {
      showModal("Please wait", "Temporary cooldown active.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      showModal("Missing fields", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    setLoginButtonText("Logging in...");

    try {
      let loginResult = null;
      
      // Try login types in priority order
      const loginTypes = [
        "recruitment",      // Original recruitment system
        "recruitment_personnel", // New recruitment personnel table
        "personnel",        // Personnel system
        "admin"            // Admin system
      ];

      // Try each login type until one succeeds
      for (const loginType of loginTypes) {
        loginResult = await authLogin(username, password, loginType);
        if (loginResult.success) {
          break;
        }
      }

      if (loginResult.success) {
        // Reset security attempts on successful login
        await updateSecurityRecord({
          failed_attempts: 0,
          lockout_count: 0,
          temp_until: null,
          brute_force_until: null,
        });

        showModal("Login Successful", "Redirecting to dashboard...");

        // Navigate based on user type and role
        setTimeout(() => {
          closeModal();
          const user = loginResult.user;
          console.log("Login successful, user data:", user);

          // Handle routing based on user type
          if (user.user_type === "recruitment" || user.user_type === "recruitment_personnel") {
            // ALL recruitment users go to recruitment-dashboard
            navigate("/recruitment-dashboard");
          } else if (user.user_type === "admin") {
            if (user.role === "admin") {
              navigate("/admin");
            } else if (user.role === "inspector") {
              navigate("/InspectorDashboard");
            } else if (user.role === "employee") {
              navigate("/employee");
            } else {
              navigate("/admin");
            }
          } else if (user.user_type === "personnel") {
            if (user.isAdmin) {
              navigate("/admin");
            } else {
              navigate("/employee");
            }
          } else {
            navigate("/");
          }
        }, 1000);
      } else {
        // Handle failed login
        const newAttempts = (securityData?.failed_attempts || 0) + 1;
        const attemptsLeft = Math.max(0, MAX_ATTEMPTS - newAttempts);

        await updateSecurityRecord({
          failed_attempts: newAttempts,
        });

        setPassword("");
        setShake(true);
        setTimeout(() => setShake(false), 400);

        if (newAttempts >= MAX_ATTEMPTS) {
          await handleTempLockAndMaybeBruteForce(30);
          showModal("Too many attempts", "Account locked for 30 seconds.");
        } else {
          showModal(
            "Invalid credentials",
            loginResult.message || `Invalid username or password. Attempts left: ${attemptsLeft}`
          );
        }

        setLoginButtonText("Login");
      }
    } catch (error) {
      console.error("Login error:", error);
      showModal("System Error", "Unable to login. Please try again.");
      setLoginButtonText("Login");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // Update welcome message for recruitment
  const updateWelcomeMessage = () => {
    return (
      <div className="login-header">
        <h2>Bureau of Fire Protection Villanueva</h2>
        <p>Recruitment and Personnel Portal</p>
        <p className="login-subtitle">Secure Login System</p>
        <div className="login-info-text">
          <small>• Recruitment Officers & Personnel</small>
          <small>• Administrative Staff</small>
          <small>• Use your assigned credentials</small>
        </div>
      </div>
    );
  };

  if (loadingSecurity) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="loading-spinner">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <h2>Loading Security Settings...</h2>
          <p>Please wait while we initialize the login system</p>
        </div>
      </div>
    );
  }

  // Check if user is blocked by brute force protection
  const isBruteForceBlocked = securityData?.brute_force_until && Date.now() < securityData.brute_force_until;
  
  return (
    <div className="login-container">
      <Title>BFP Villanueva - Recruitment & Personnel Portal</Title>
      <Meta name="robots" content="noindex, nofollow" />
      <Meta name="description" content="Secure login portal for Bureau of Fire Protection Villanueva recruitment and personnel system" />

      <div className={`login-box ${shake ? "shake" : ""}`}>
        {updateWelcomeMessage()}

        <div className="input-group">
          <User className="input-icon" size={18} />
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            placeholder=" "
            disabled={isLocked || isBruteForceBlocked || loadingSecurity || loading}
            autoComplete="username"
            aria-label="Username"
          />
          <label htmlFor="username">Username</label>
        </div>

        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            placeholder=" "
            disabled={isLocked || isBruteForceBlocked || loadingSecurity || loading}
            autoComplete="current-password"
            aria-label="Password"
          />
          <label htmlFor="password">Password</label>
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={isLocked || isBruteForceBlocked || loadingSecurity || loading}
            tabIndex={0}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          className={`login-button ${isLocked || loading || isBruteForceBlocked ? "disabled" : ""}`}
          onClick={handleLogin}
          disabled={
            isLocked ||
            isBruteForceBlocked ||
            loadingSecurity ||
            loading ||
            !username.trim() ||
            !password.trim()
          }
          aria-label="Login button"
        >
          {loginButtonText}
        </button>

        <div className="login-footer">
          <small className="security-notice">
            <Lock size={12} /> Secure Login System
          </small>
          <small className="help-text">
            Contact system administrator for assistance
          </small>
        </div>
      </div>

      {modal.show && (
        <div className="modal-overlay-log" onClick={closeModal}>
          <div className="modal-content-log" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-log">
              <AlertTriangle className="modal-icon-log" size={24} />
              <h3>{modal.title}</h3>
            </div>
            <div className="modal-body-log">
              <p>{modal.message}</p>
            </div>
            <div className="modal-footer-log">
              <button 
                className="modal-button-log" 
                onClick={closeModal}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;