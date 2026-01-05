import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Default to collapsed on mobile, expanded on desktop
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      const saved = sessionStorage.getItem("sidebarCollapsed");
      return saved ? JSON.parse(saved) : isMobile;
    }
    return true; // Start collapsed by default
  });

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      // Auto-collapse on mobile if it's expanded
      if (isMobile && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarCollapsed]);

  // Save sidebar state
  useEffect(() => {
    sessionStorage.setItem(
      "sidebarCollapsed",
      JSON.stringify(isSidebarCollapsed)
    );
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const expandSidebar = () => {
    setIsSidebarCollapsed(false);
  };

  const collapseSidebar = () => {
    setIsSidebarCollapsed(true);
  };

  const value = {
    isSidebarCollapsed,
    toggleSidebar,
    expandSidebar,
    collapseSidebar,
    setIsSidebarCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};