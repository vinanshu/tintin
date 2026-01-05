import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSidebar } from "./SidebarContext";

const Sidebar = () => {
  const { isSidebarCollapsed, toggleSidebar, expandSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState({});
  const location = useLocation();
  const sidebarRef = useRef(null);

  const dropdownSections = [
    {
      id: "personnel",
      title: "Personnel Records",
      icon: "👥",
      items: [
        {
          href: "/personnelProfile",
          icon: "📁",
          text: "Personnel Profile (201 Files)",
        },
        { href: "/leaveRecords", icon: "🗄️", text: "Leave Records" },
        { href: "/clearanceRecords", icon: "💾", text: "Clearance Records" },
      ],
    },
    {
      id: "morale",
      title: "Morale & Welfare",
      icon: "❤️",
      items: [
        {
          href: "/medicalRecords",
          icon: "🩺",
          text: "Medical Records of Employees",
        },
        {
          href: "/awardsCommendations",
          icon: "🏅",
          text: "Awards & Commendations",
        },
      ],
    },
    {
      id: "hr",
      title: "HR Management",
      icon: "🧑‍🤝‍🧑",
      items: [
        { href: "/promotion", icon: "📈", text: "Qualified for Promotion" },
        {
          href: "/recruitmentPersonnel",
          icon: "👥",
          text: "Recruited Personnel",
        },
        { href: "/trainings", icon: "🎓", text: "Trainings" },
        { href: "/placement", icon: "📍", text: "Placement (≥ 2 Years)" },
        { href: "/history", icon: "⏳", text: "History" },
      ],
    },
  ];

  // Check if mobile and set initial state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile, auto-expand on desktop
      if (mobile && !isSidebarCollapsed) {
        toggleSidebar();
      } else if (!mobile && isSidebarCollapsed) {
        toggleSidebar();
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile && 
          sidebarRef.current && 
          !sidebarRef.current.contains(e.target) && 
          !e.target.closest('.floating-menu-btn') &&
          !isSidebarCollapsed) {
        toggleSidebar();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isSidebarCollapsed, toggleSidebar]);

  useEffect(() => {
    const currentPath = location.pathname;
    setActiveTab(currentPath);
  }, [location.pathname]);

  const isTabActive = (href) => activeTab === href;

  const handleTabClick = (e, href) => {
    // Auto-close on mobile after clicking a link
    if (isMobile && !isSidebarCollapsed) {
      setTimeout(() => toggleSidebar(), 300);
    }
  };

  const handleDropdownClick = (sectionId) => {
    if (isMobile) {
      setIsDropdownOpen(prev => ({
        ...prev,
        [sectionId]: !prev[sectionId]
      }));
    }
  };

  // Floating menu button click handler
  const handleMenuButtonClick = () => {
    toggleSidebar();
  };

  // Don't show floating button on desktop when sidebar is expanded
  const showFloatingButton = isMobile || (isSidebarCollapsed && !isMobile);

  return (
    <>
      {/* Floating Menu Button - Show only when needed */}
      {showFloatingButton && (
        <button 
          className="floating-menu-btn"
          onClick={handleMenuButtonClick}
          aria-label={isSidebarCollapsed ? "Show menu" : "Hide menu"}
        >
          {isSidebarCollapsed ? (
            <>
              <span className="menu-icon">☰</span>
              <span className="menu-text">Menu</span>
            </>
          ) : (
            <>
              <span className="close-icon">✕</span>
              <span className="menu-text">Close</span>
            </>
          )}
        </button>
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}
      >
        <div className="sidebar-inner">
          <h2>Admin</h2>
          <a
            href="/admin"
            className="no-hover"
            onClick={(e) => handleTabClick(e, "/admin")}
          >
            <img
              src="/src/assets/logo-bfp.jpg"
              alt="Logo"
              className="sidebar-logo"
            />
            <span className="station-name">Villanueva FireStation</span>
          </a>
          
          <a
            href="/admin"
            onClick={(e) => handleTabClick(e, "/admin")}
            className={`sidebar-link ${isTabActive("/admin") ? "active" : ""}`}
          >
            🖥️ <span>Admin Dashboard</span>
          </a>
          
          {/* Regular tabs */}
          <a
            href="/leaveManagement"
            onClick={(e) => handleTabClick(e, "/leaveManagement")}
            className={`sidebar-link ${isTabActive("/leaveManagement") ? "active" : ""}`}
          >
            🗓️ <span>Leave Management</span>
          </a>
          
          <a
            href="/inventoryControl"
            onClick={(e) => handleTabClick(e, "/inventoryControl")}
            className={`sidebar-link ${isTabActive("/inventoryControl") ? "active" : ""}`}
          >
            📦 <span>Inventory Control</span>
          </a>
          
          <a
            href="/clearanceSystem"
            onClick={(e) => handleTabClick(e, "/clearanceSystem")}
            className={`sidebar-link ${isTabActive("/clearanceSystem") ? "active" : ""}`}
          >
            🪪 <span>Clearance System</span>
          </a>
          
          <a
            href="/personnelRegister"
            onClick={(e) => handleTabClick(e, "/personnelRegister")}
            className={`sidebar-link ${isTabActive("/personnelRegister") ? "active" : ""}`}
          >
            🧑‍💼 <span>Personnel Register</span>
          </a>
          
          <a
            href="/personnelRecentActivity"
            onClick={(e) => handleTabClick(e, "/personnelRecentActivity")}
            className={`sidebar-link ${isTabActive("/personnelRecentActivity") ? "active" : ""}`}
          >
            🕓 <span>Personnel Recent Activity</span>
          </a>

          {/* Dropdown sections */}
          {dropdownSections.map((section) => (
            <div 
              key={section.id} 
              className={`dropdown-section ${section.id}-records ${isDropdownOpen[section.id] ? 'active' : ''}`}
              onClick={() => isMobile && handleDropdownClick(section.id)}
            >
              <div className="dropdown-toggle">
                {section.icon} <span>{section.title}</span>
                <span className="arrow">▼</span>
              </div>

              {/* Dropdown content */}
              {(!isSidebarCollapsed || isMobile) && (
                <div className="dropdown-content">
                  {section.items.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className={`dropdown-item ${isTabActive(item.href) ? "active" : ""}`}
                      onClick={(e) => handleTabClick(e, item.href)}
                    >
                      {item.icon} <span>{item.text}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          <a 
            href="/logout" 
            className="sidebar-link logout-link"
            onClick={(e) => handleTabClick(e, "/logout")}
          >
            🚪 <span>Logout</span>
          </a>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobile && !isSidebarCollapsed && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default Sidebar;