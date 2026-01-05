// components/RecruitmentDashboard.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import styles from "../styles/RecruitmentDashboard.module.css"; // Fixed import path
import { useNavigate } from "react-router-dom";
import { 
  User, FileText, Calendar, CheckCircle, Mail, Download, 
  Upload, Edit, LogOut, Phone, MapPin, Clock, Briefcase,
  X, Check, AlertCircle, Send, Save, Eye, Trash2, Plus,
  ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const RecruitmentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Document upload states
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showUploadSection, setShowUploadSection] = useState(false);
  
  // Schedule state
  const [schedule, setSchedule] = useState(null);
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  
  // Contact HR state
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactSubject, setContactSubject] = useState("Inquiry");
  
  // Update profile state
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    civil_status: "",
    contact_number: "",
    emergency_contact: "",
    emergency_contact_number: "",
    address: "",
    city: "",
    province: "",
    zip_code: "",
    educational_background: ""
  });

  // Document requirements
  const documentRequirements = [
    { type: "transcript", name: "Transcript of Records", required: true, maxSize: 10 },
    { type: "police_clearance", name: "Police Clearance", required: true, maxSize: 5 },
    { type: "medical_certificate", name: "Medical Certificate", required: true, maxSize: 5 },
    { type: "nbi_clearance", name: "NBI Clearance", required: true, maxSize: 5 },
    { type: "resume", name: "Resume/CV", required: true, maxSize: 5 },
    { type: "birth_certificate", name: "Birth Certificate", required: true, maxSize: 5 },
    { type: "cedula", name: "Community Tax Certificate", required: true, maxSize: 2 }
  ];

  useEffect(() => {
    if (user) {
      console.log("User from auth:", user);
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadCandidateData(),
        loadDocuments(),
        loadSchedule()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateData = async () => {
    try {
      console.log("Loading candidate data for user ID:", user?.id);
      
      // Try to find candidate using the numeric ID from auth
      let query = supabase
        .from("recruitment_personnel")
        .select("*");
      
      // Try multiple approaches to find the user
      if (user?.id) {
        // If user.id is numeric (like "5"), search in custom ID fields
        if (!isNaN(user.id)) {
          console.log("Searching with numeric ID:", user.id);
          query = query.or(`id.eq.${user.id},auth_user_id.eq.${user.id},numeric_id.eq.${user.id}`);
        } else {
          // If user.id is a UUID or string
          console.log("Searching with string ID:", user.id);
          query = query.or(`id.eq.${user.id},auth_user_id.eq.${user.id}`);
        }
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading candidate data:", error);
        setError("Failed to load profile. Please contact HR.");
        return;
      }
      
      if (data) {
        console.log("Candidate data found:", data);
        setCandidateData(data);
        setProfileForm({
          full_name: data.full_name || data.candidate || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          civil_status: data.civil_status || "",
          contact_number: data.contact_number || "",
          emergency_contact: data.emergency_contact || "",
          emergency_contact_number: data.emergency_contact_number || "",
          address: data.address || "",
          city: data.city || "",
          province: data.province || "",
          zip_code: data.zip_code || "",
          educational_background: data.educational_background || ""
        });
      } else {
        console.log("No candidate profile found. This is normal for new users.");
        // Auto-create a profile if none exists
        await createInitialProfile();
      }
    } catch (error) {
      console.error("Error in loadCandidateData:", error);
      setError("Connection error. Please try again.");
    }
  };

  const createInitialProfile = async () => {
    try {
      console.log("Creating initial profile for user:", user);
      
      const initialData = {
        candidate: user?.name || "New Candidate",
        full_name: user?.name || "New Candidate",
        username: user?.email || user?.username || "",
        auth_user_id: user?.id?.toString() || "",
        status: 'Pending',
        stage: 'Applied',
        application_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from("recruitment_personnel")
        .insert([initialData])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating profile:", error);
        return;
      }
      
      console.log("Initial profile created:", data);
      setCandidateData(data);
      
    } catch (error) {
      console.error("Error in createInitialProfile:", error);
    }
  };

  const loadDocuments = async () => {
    try {
      if (!candidateData?.id) {
        setDocuments([]);
        return;
      }
      
      const { data, error } = await supabase
        .from("recruitment_documents")
        .select("*")
        .eq("candidate_id", candidateData.id)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error loading documents:", error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error("Error in loadDocuments:", error);
      setDocuments([]);
    }
  };

  const loadSchedule = async () => {
    try {
      if (!candidateData?.id) return;
      
      const { data, error } = await supabase
        .from("recruitment_personnel")
        .select("schedule_date, schedule_location, schedule_notes")
        .eq("id", candidateData.id)
        .single();

      if (!error && data) {
        setSchedule(data);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  };

  // File upload handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload only PDF, DOC, DOCX, JPEG, or PNG files");
      return;
    }

    const requirement = documentRequirements.find(req => req.type === selectedDocument);
    if (requirement && file.size > requirement.maxSize * 1024 * 1024) {
      alert(`File size should be less than ${requirement.maxSize}MB for ${requirement.name}`);
      return;
    }

    setSelectedFile(file);
  };

  const uploadDocument = async () => {
    if (!selectedDocument || !selectedFile) {
      alert("Please select a document type and file");
      return;
    }

    if (!candidateData?.id) {
      alert("Please complete your profile first");
      return;
    }

    try {
      setUploading(true);
      
      // Get file extension
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      
      // Create unique filename
      const fileName = `${selectedDocument}_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `${candidateData.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recruitment-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        
        // Check if it's an RLS error
        if (uploadError.message.includes('policy') || uploadError.message.includes('security')) {
          alert("Permission error. Please contact admin to set up proper permissions.");
          return;
        }
        
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recruitment-documents')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from("recruitment_documents")
        .insert([{
          candidate_id: candidateData.id,
          candidate_name: candidateData.full_name || candidateData.candidate,
          document_type: selectedDocument,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          status: 'pending_review',
          uploaded_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error("Database insert error:", dbError);
        
        // Try to delete the uploaded file if database insert fails
        try {
          await supabase.storage
            .from('recruitment-documents')
            .remove([filePath]);
        } catch (cleanupError) {
          console.warn("Could not cleanup uploaded file:", cleanupError);
        }
        
        if (dbError.message.includes('policy') || dbError.message.includes('security')) {
          alert("Database permission error. Please contact admin to fix RLS policies.");
          return;
        }
        
        throw dbError;
      }

      console.log("Document uploaded successfully");

      // Refresh and reset
      await loadDocuments();
      setSelectedDocument("");
      setSelectedFile(null);
      setShowUploadSection(false);
      alert("✅ Document uploaded successfully! It will be reviewed by HR.");

    } catch (error) {
      console.error("Error uploading document:", error);
      alert(`❌ Failed to upload document: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId, fileUrl) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('recruitment-documents') + 1).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('recruitment-documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("recruitment_documents")
        .delete()
        .eq("id", documentId);

      if (dbError) throw dbError;

      await loadDocuments();
      alert("Document deleted successfully!");

    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  // Schedule display
  const formatSchedule = () => {
    if (!schedule || !schedule.schedule_date) {
      return "No schedule has been set for you yet. Please wait for HR to schedule your interview/assessment.";
    }

    const scheduleDate = new Date(schedule.schedule_date);
    const now = new Date();
    const isPast = scheduleDate < now;

    return (
      <div className={styles.scheduleDetails}>
        <div className={`${styles.scheduleStatus} ${isPast ? styles.past : styles.upcoming}`}>
          {isPast ? 'Past Schedule' : 'Upcoming Schedule'}
        </div>
        <div className={styles.scheduleItem}>
          <Calendar className={styles.scheduleIcon} />
          <div>
            <strong>Date & Time:</strong>
            <p>{scheduleDate.toLocaleDateString('en-PH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
        {schedule.schedule_location && (
          <div className={styles.scheduleItem}>
            <MapPin className={styles.scheduleIcon} />
            <div>
              <strong>Location:</strong>
              <p>{schedule.schedule_location}</p>
            </div>
          </div>
        )}
        {schedule.schedule_notes && (
          <div className={styles.scheduleItem}>
            <FileText className={styles.scheduleIcon} />
            <div>
              <strong>Notes:</strong>
              <p>{schedule.schedule_notes}</p>
            </div>
          </div>
        )}
        {!isPast && (
          <div className={styles.scheduleReminder}>
            <AlertCircle />
            <p>Please arrive 15 minutes before your scheduled time.</p>
          </div>
        )}
      </div>
    );
  };

  const sendMessageToHR = async () => {
    if (!contactMessage.trim()) {
      alert("Please enter your message");
      return;
    }

    if (!candidateData?.id) {
      alert("Please complete your profile before sending messages");
      return;
    }

    try {
      setSendingMessage(true);
      
      const { error } = await supabase
        .from("hr_messages")
        .insert([{
          candidate_id: candidateData.id,
          candidate_name: candidateData?.full_name || candidateData?.candidate || user?.name,
          candidate_email: candidateData?.username || user?.email || user?.username,
          subject: contactSubject,
          message: contactMessage,
          status: 'unread',
          priority: contactSubject.toLowerCase().includes('urgent') ? 'high' : 'normal'
        }]);

      if (error) throw error;

      alert("Your message has been sent to HR. We'll respond within 24-48 hours.");
      setContactMessage("");
      setContactSubject("Inquiry");
      setShowContactForm(false);

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const updateProfile = async () => {
    try {
      if (!profileForm.full_name.trim()) {
        alert("Full name is required");
        return;
      }

      if (!candidateData?.id) {
        alert("No profile found to update");
        return;
      }

      const updateData = {
        full_name: profileForm.full_name,
        date_of_birth: profileForm.date_of_birth || null,
        gender: profileForm.gender || null,
        civil_status: profileForm.civil_status || null,
        contact_number: profileForm.contact_number || null,
        emergency_contact: profileForm.emergency_contact || null,
        emergency_contact_number: profileForm.emergency_contact_number || null,
        address: profileForm.address || null,
        city: profileForm.city || null,
        province: profileForm.province || null,
        zip_code: profileForm.zip_code || null,
        educational_background: profileForm.educational_background || null,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from("recruitment_personnel")
        .update(updateData)
        .eq("id", candidateData.id);

      if (error) throw error;

      await loadCandidateData();
      setShowUpdateProfile(false);
      alert("Profile updated successfully!");

    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      case 'pending_review': return styles.statusPending;
      case 'needs_revision': return styles.statusRevision;
      default: return styles.statusDefault;
    }
  };

  const getDocumentName = (type) => {
    const req = documentRequirements.find(r => r.type === type);
    return req ? req.name : type.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={loadAllData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.recruitmentContainer}>
      {/* Header */}
      <header className={styles.recruitmentHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <User />
              </div>
              <div className={styles.headerTitles}>
                <h1>Recruitment Portal</h1>
                <p>Bureau of Fire Protection Villanueva</p>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={`${styles.statusBadge} ${styles[candidateData?.status?.toLowerCase() || 'pending']}`}>
                Status: {candidateData?.status || 'Pending'}
              </div>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <LogOut />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.bannerContent}>
          <h2>Welcome, {candidateData?.full_name || candidateData?.candidate || user?.name || "Candidate"}!</h2>
          <p>Track your application progress and access important information about your recruitment process.</p>
        </div>
      </div>

      <main className={styles.mainContent}>
        {/* Application Overview */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <h2>Application Overview</h2>
            <div className={styles.overviewDate}>
              Applied: {candidateData?.application_date ? 
                new Date(candidateData.application_date).toLocaleDateString('en-PH') : 
                'N/A'}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.blue}`}>
              <div className={styles.flex}>
                <div className={`${styles.statIcon} ${styles.blue}`}>
                  <Briefcase />
                </div>
                <div className={styles.statContent}>
                  <p>Position Applied</p>
                  <p>{candidateData?.position || "Firefighter Candidate"}</p>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.green}`}>
              <div className={styles.flex}>
                <div className={`${styles.statIcon} ${styles.green}`}>
                  <CheckCircle />
                </div>
                <div className={styles.statContent}>
                  <p>Current Stage</p>
                  <p>{candidateData?.stage || "Screening"}</p>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.purple}`}>
              <div className={styles.flex}>
                <div className={`${styles.statIcon} ${styles.purple}`}>
                  <FileText />
                </div>
                <div className={styles.statContent}>
                  <p>Documents Uploaded</p>
                  <p>{documents.length} / {documentRequirements.filter(d => d.required).length}</p>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.yellow}`}>
              <div className={styles.flex}>
                <div className={`${styles.statIcon} ${styles.yellow}`}>
                  <User />
                </div>
                <div className={styles.statContent}>
                  <p>Profile Complete</p>
                  <p>{Object.values(profileForm).filter(v => v && v.trim()).length > 5 ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column - Timeline & Contact */}
          <div>
            {/* Application Timeline */}
            <div className={styles.timelineCard}>
              <h3>Application Timeline</h3>
              <div className={styles.timelineContent}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Application Submitted</h4>
                    <p>{candidateData?.application_date ? 
                      new Date(candidateData.application_date).toLocaleDateString('en-PH') : 
                      'Pending'}</p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Initial Screening</h4>
                    <p>{candidateData?.stage === 'Screening' ? 'In Progress' : 'Pending'}</p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Interview</h4>
                    <p>{candidateData?.stage === 'Interview' ? 'Scheduled' : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.contactCard}>
              <h3>Your Information</h3>
              <div>
                <div className={styles.contactItem}>
                  <Mail className={styles.contactIcon} />
                  <div className={styles.contactDetails}>
                    <p>Email</p>
                    <p>{candidateData?.username || user?.username}</p>
                  </div>
                </div>
                
                {candidateData?.contact_number && (
                  <div className={styles.contactItem}>
                    <Phone className={styles.contactIcon} />
                    <div className={styles.contactDetails}>
                      <p>Contact Number</p>
                      <p>{candidateData.contact_number}</p>
                    </div>
                  </div>
                )}
                
                {candidateData?.address && (
                  <div className={styles.contactItem}>
                    <MapPin className={styles.contactIcon} />
                    <div className={styles.contactDetails}>
                      <p>Address</p>
                      <p>{candidateData.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Enhanced Features */}
          <div>
            {/* Upload Documents Section */}
            <div className={styles.actionsCard}>
              <div className={styles.sectionHeader}>
                <h3>Upload Documents</h3>
                <button 
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className={styles.toggleButton}
                >
                  {showUploadSection ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
              
              {showUploadSection && (
                <div className={styles.uploadSection}>
                  <div className={styles.documentSelection}>
                    <label>Select Document Type</label>
                    <select 
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      className={styles.documentSelect}
                    >
                      <option value="">Choose document type...</option>
                      {documentRequirements.map((req) => (
                        <option key={req.type} value={req.type}>
                          {req.name} {req.required ? '(Required)' : ''}
                        </option>
                      ))}
                    </select>
                    
                    {selectedDocument && (
                      <div className={styles.documentInfo}>
                        <p>
                          <strong>Max file size:</strong> {
                            documentRequirements.find(r => r.type === selectedDocument)?.maxSize || 5
                          }MB
                        </p>
                        <p>
                          <strong>Allowed formats:</strong> PDF, DOC, DOCX, JPEG, PNG
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.fileUploadArea}>
                    <input
                      type="file"
                      id="document-upload"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className={styles.fileInput}
                    />
                    <label htmlFor="document-upload" className={styles.fileLabel}>
                      <Upload className={styles.uploadIcon} />
                      <span>{selectedFile ? selectedFile.name : "Choose File"}</span>
                    </label>
                    
                    {selectedFile && (
                      <div className={styles.filePreview}>
                        <FileText />
                        <div>
                          <p className={styles.fileName}>{selectedFile.name}</p>
                          <p className={styles.fileSize}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button 
                          onClick={() => setSelectedFile(null)}
                          className={styles.removeFile}
                        >
                          <X />
                        </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={uploadDocument}
                      disabled={uploading || !selectedDocument || !selectedFile}
                      className={`${styles.uploadButton} ${styles.primary}`}
                    >
                      {uploading ? (
                        <>
                          <div className={styles.spinnerSmall}></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload />
                          Upload Document
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className={styles.quickActions}>
                <button className={`${styles.actionButton} ${styles.green}`} onClick={() => setShowScheduleDetails(!showScheduleDetails)}>
                  <div className={styles.actionContent}>
                    <Calendar className={`${styles.actionIcon} ${styles.green}`} />
                    <span className={styles.actionText}>View Schedule</span>
                  </div>
                  <span className={styles.arrowIcon}>→</span>
                </button>

                <button className={`${styles.actionButton} ${styles.purple}`} onClick={() => setShowContactForm(true)}>
                  <div className={styles.actionContent}>
                    <Mail className={`${styles.actionIcon} ${styles.purple}`} />
                    <span className={styles.actionText}>Contact HR</span>
                  </div>
                  <span className={styles.arrowIcon}>→</span>
                </button>

                <button className={`${styles.actionButton} ${styles.yellow}`} onClick={() => setShowUpdateProfile(true)}>
                  <div className={styles.actionContent}>
                    <Edit className={`${styles.actionIcon} ${styles.yellow}`} />
                    <span className={styles.actionText}>Update Profile</span>
                  </div>
                  <span className={styles.arrowIcon}>→</span>
                </button>
              </div>
            </div>

            {/* Schedule Display */}
            {showScheduleDetails && (
              <div className={styles.scheduleCard}>
                <h3>Your Schedule</h3>
                {formatSchedule()}
              </div>
            )}

            {/* Documents Status */}
            <div className={styles.documentsCard}>
              <h3>Document Status</h3>
              {documents.length > 0 ? (
                <div className={styles.documentsList}>
                  {documents.map((doc) => (
                    <div key={doc.id} className={styles.documentItem}>
                      <div className={styles.documentInfo}>
                        <FileText className={styles.documentIcon} />
                        <div>
                          <p className={styles.documentName}>{getDocumentName(doc.document_type)}</p>
                          <p className={styles.documentMeta}>
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()} • 
                            Size: {(doc.file_size / 1024 / 1024).toFixed(2)}MB
                          </p>
                        </div>
                      </div>
                      <div className={styles.documentActions}>
                        <span className={`${styles.documentStatus} ${getStatusColor(doc.status)}`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                        <div className={styles.actionButtons}>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewButton}
                            title="View Document"
                          >
                            <Eye />
                          </a>
                          <button
                            onClick={() => deleteDocument(doc.id, doc.file_url)}
                            className={styles.deleteButton}
                            title="Delete Document"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDocuments}>
                  <FileText className={styles.noDocsIcon} />
                  <p>No documents uploaded yet</p>
                  <p className={styles.subtext}>Upload your required documents to proceed with your application</p>
                </div>
              )}
            </div>

            {/* Required Documents Summary */}
            <div className={styles.requirementsCard}>
              <h3>Required Documents</h3>
              <div className={styles.requirementsList}>
                {documentRequirements.map((req) => {
                  const uploadedDoc = documents.find(d => d.document_type === req.type);
                  return (
                    <div key={req.type} className={styles.requirementItem}>
                      <div className={styles.requirementInfo}>
                        <div className={`${styles.requirementStatus} ${uploadedDoc ? styles.uploaded : styles.missing}`}>
                          {uploadedDoc ? <Check /> : <AlertCircle />}
                        </div>
                        <span className={styles.requirementName}>{req.name}</span>
                      </div>
                      <span className={styles.requirementSize}>{req.maxSize}MB max</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact HR Modal */}
      {showContactForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Contact HR Department</h3>
              <button onClick={() => setShowContactForm(false)} className={styles.closeButton}>
                <X />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.hrContactInfo}>
                <div className={styles.contactCard}>
                  <h4>HR Contact Information</h4>
                  <p><strong>Contact Person:</strong> {candidateData?.hr_contact_person || 'HR Department'}</p>
                  <p><strong>Email:</strong> {candidateData?.hr_contact_email || 'hr@bfp-villanueva.gov.ph'}</p>
                  <p><strong>Phone:</strong> {candidateData?.hr_contact_phone || '(088) 123-4567'}</p>
                  <p><strong>Office Hours:</strong> {candidateData?.hr_office_hours || 'Monday-Friday, 8:00 AM - 5:00 PM'}</p>
                </div>
              </div>
              
              <div className={styles.messageForm}>
                <div className={styles.formGroup}>
                  <label>Subject</label>
                  <select
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className={styles.subjectSelect}
                  >
                    <option value="Inquiry">General Inquiry</option>
                    <option value="Schedule">Schedule Related</option>
                    <option value="Documents">Document Submission</option>
                    <option value="Urgent">Urgent Matter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Your Message</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    onClick={sendMessageToHR}
                    disabled={sendingMessage || !contactMessage.trim()}
                    className={styles.sendButton}
                  >
                    {sendingMessage ? (
                      <>
                        <div className={styles.spinnerSmall}></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send />
                        Send Message
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowContactForm(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Profile Modal */}
      {showUpdateProfile && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.large}`}>
            <div className={styles.modalHeader}>
              <h3>Update Profile Information</h3>
              <button onClick={() => setShowUpdateProfile(false)} className={styles.closeButton}>
                <X />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.profileForm}>
                <div className={styles.formSection}>
                  <h4>Personal Information</h4>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                        placeholder="Juan Dela Cruz"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Civil Status</label>
                      <select
                        value={profileForm.civil_status}
                        onChange={(e) => setProfileForm({...profileForm, civil_status: e.target.value})}
                      >
                        <option value="">Select Status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="separated">Separated</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4>Contact Information</h4>
                  <div className={styles.formGroup}>
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      value={profileForm.contact_number}
                      onChange={(e) => setProfileForm({...profileForm, contact_number: e.target.value})}
                      placeholder="09123456789"
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Emergency Contact Name</label>
                      <input
                        type="text"
                        value={profileForm.emergency_contact}
                        onChange={(e) => setProfileForm({...profileForm, emergency_contact: e.target.value})}
                        placeholder="Emergency contact person"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Emergency Contact Number</label>
                      <input
                        type="tel"
                        value={profileForm.emergency_contact_number}
                        onChange={(e) => setProfileForm({...profileForm, emergency_contact_number: e.target.value})}
                        placeholder="09123456789"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4>Address Information</h4>
                  <div className={styles.formGroup}>
                    <label>Complete Address</label>
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                      rows={3}
                      placeholder="House No., Street, Barangay"
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>City/Municipality</label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                        placeholder="Villanueva"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Province</label>
                      <input
                        type="text"
                        value={profileForm.province}
                        onChange={(e) => setProfileForm({...profileForm, province: e.target.value})}
                        placeholder="Misamis Oriental"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        value={profileForm.zip_code}
                        onChange={(e) => setProfileForm({...profileForm, zip_code: e.target.value})}
                        placeholder="9000"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4>Educational Background</h4>
                  <div className={styles.formGroup}>
                    <textarea
                      value={profileForm.educational_background}
                      onChange={(e) => setProfileForm({...profileForm, educational_background: e.target.value})}
                      rows={4}
                      placeholder="Please provide details of your educational background:
• Elementary: School, Year Graduated
• High School: School, Year Graduated  
• College: School, Degree, Year Graduated
• Other trainings/certifications"
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button onClick={updateProfile} className={styles.saveButton}>
                    <Save />
                    Save Changes
                  </button>
                  <button onClick={() => setShowUpdateProfile(false)} className={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentDashboard;