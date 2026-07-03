import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, MapPin, Clock, FileImage, Video, Save, User, Navigation, Building, Activity, Settings, Trash2 } from "lucide-react";
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { useAuth } from "../AuthProvider";
import ComplaintMap from "../ComplaintMap";

export default function ComplaintDetailsModal({ selectedComplaint, setSelectedComplaint }: { selectedComplaint: any, setSelectedComplaint: any }) {
  const [newStatus, setNewStatus] = useState(selectedComplaint.status);
  const [adminRemarks, setAdminRemarks] = useState(selectedComplaint.adminRemarks || "");
  const [assignedOfficer, setAssignedOfficer] = useState(selectedComplaint.assignedOfficer || "");
  const [officerId, setOfficerId] = useState(selectedComplaint.officerId || "");
  const [officerDesignation, setOfficerDesignation] = useState(selectedComplaint.officerDesignation || "");
  const [officerContact, setOfficerContact] = useState(selectedComplaint.officerContact || "");
  const [department, setDepartment] = useState(selectedComplaint.department || "");
  const [resolutionProof, setResolutionProof] = useState(selectedComplaint.resolutionProof || "");
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!selectedComplaint) return;
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, "admin_logs"), where("complaintDocId", "==", selectedComplaint.docId));
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logs.sort((a: any, b: any) => {
          const aTime = a.timestamp?.toMillis() || 0;
          const bTime = b.timestamp?.toMillis() || 0;
          return bTime - aTime;
        });
        setTimelineLogs(logs);
      } catch (err) {
        console.error("Failed to fetch admin logs", err);
      }
    };
    fetchLogs();
  }, [selectedComplaint?.docId]);

  const handleUpdateStatus = async (statusOverride?: string) => {
    if (!selectedComplaint) return;
    
    const finalStatus = statusOverride || newStatus;
    
    if (finalStatus !== selectedComplaint.status && !adminRemarks.trim()) {
      toast.error("Admin remarks are required for all status updates.");
      return;
    }

    if (finalStatus === "Closed" && selectedComplaint.status !== "Resolved") {
      toast.error("Complaint must be marked Resolved before closing.");
      return;
    }

    try {
      const docRef = doc(db, "complaints", selectedComplaint.docId);
      
      let newProgress = selectedComplaint.progress || 10;
      if (finalStatus === "Submitted") newProgress = 10;
      else if (finalStatus === "Verified") newProgress = 20;
      else if (finalStatus === "Under Review") newProgress = 35;
      else if (finalStatus === "Request More Information") newProgress = selectedComplaint.progress;
      else if (finalStatus === "Forwarded to Department") newProgress = 50;
      else if (finalStatus === "Officer Assigned") newProgress = 60;
      else if (finalStatus === "In Progress") newProgress = 75;
      else if (finalStatus === "Resolved") newProgress = 100;
      else if (finalStatus === "Closed") newProgress = 100;
      else if (finalStatus === "Rejected") newProgress = 100;

      let assignedTime = selectedComplaint.officerAssignedAt || null;
      if (assignedOfficer && assignedOfficer !== selectedComplaint.assignedOfficer) {
        assignedTime = serverTimestamp();
      }

      await updateDoc(docRef, {
        status: finalStatus,
        progress: newProgress,
        adminRemarks: adminRemarks.trim(),
        assignedOfficer: assignedOfficer || "",
        officerId: officerId || "",
        officerDesignation: officerDesignation || "",
        officerContact: officerContact || "",
        officerAssignedAt: assignedTime,
        department: department || "",
        resolutionProof: resolutionProof || "",
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.email || "Admin",
      });
      
      await addDoc(collection(db, "admin_logs"), {
        action: "UPDATE_COMPLAINT",
        complaintId: selectedComplaint.id,
        complaintDocId: selectedComplaint.docId,
        oldStatus: selectedComplaint.status,
        newStatus: finalStatus,
        adminRemarks: adminRemarks.trim(),
        assignedOfficer: assignedOfficer || "",
        officerId: officerId || "",
        officerDesignation: officerDesignation || "",
        officerContact: officerContact || "",
        department: department || "",
        resolutionProof: resolutionProof || "",
        adminId: currentUser?.uid,
        adminEmail: currentUser?.email,
        timestamp: serverTimestamp()
      });

      toast.success("Complaint updated successfully!");
      setSelectedComplaint(null);
    } catch (error: any) {
      console.error("Firestore update failed:", error);
      toast.error(`Failed to update status: ${error.message || "Unknown error"}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this complaint? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "complaints", selectedComplaint.docId));
      await addDoc(collection(db, "admin_logs"), {
        action: "DELETE_COMPLAINT",
        complaintId: selectedComplaint.id,
        adminId: currentUser?.uid,
        adminEmail: currentUser?.email,
        timestamp: serverTimestamp()
      });
      toast.success("Complaint deleted successfully");
      setSelectedComplaint(null);
    } catch (error) {
      toast.error("Failed to delete complaint");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed": return "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400";
      case "Rejected": return "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400";
      case "Under Review":
      case "Verified":
      case "Forwarded to Department":
      case "In Progress": return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400";
      default: return "bg-blue-50 border-blue-200 text-brand-royal dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSelectedComplaint(null)}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden bg-white dark:bg-brand-navy rounded-2xl shadow-2xl flex flex-col lg:flex-row border border-white/10"
      >
        <button 
          onClick={() => setSelectedComplaint(null)}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 p-6 md:p-8 border-r border-gray-100 dark:border-gray-800 overflow-y-auto space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedComplaint.status)}`}>
                <Activity className="w-3 h-3" />
                {selectedComplaint.status}
              </span>
              <span className="px-2.5 py-1 bg-brand-royal/10 text-brand-royal text-xs font-bold rounded-md">
                {selectedComplaint.category === "Other" && selectedComplaint.otherCategory ? selectedComplaint.otherCategory : selectedComplaint.category}
              </span>
              <span className="text-xs text-muted-foreground font-mono">ID: {selectedComplaint.id}</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-brand-navy dark:text-white mb-4">
              {selectedComplaint.title || "Complaint Details"}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedComplaint.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedComplaint.date}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/50 space-y-4">
              <h3 className="font-bold flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <User className="w-4 h-4" /> Citizen Details
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Name</p>
                  <p className="font-medium text-brand-navy dark:text-white">{selectedComplaint.fullName || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Mobile</p>
                  <p className="font-medium text-brand-navy dark:text-white">{selectedComplaint.mobileNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/50 space-y-4">
              <h3 className="font-bold flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Building className="w-4 h-4" /> Official Details
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Assigned Department</p>
                  <p className="font-medium text-brand-navy dark:text-white">{selectedComplaint.department || "Not Assigned"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Assigned Officer</p>
                  <p className="font-medium text-brand-navy dark:text-white">{selectedComplaint.assignedOfficer || "Not Assigned"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-brand-navy dark:text-white">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
              {selectedComplaint.description || "No description provided."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-brand-navy dark:text-white">Exact Location & Map</h3>
              {selectedComplaint.coordinates?.lat && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedComplaint.coordinates.lat},${selectedComplaint.coordinates.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-brand-royal bg-brand-royal/10 px-3 py-1.5 rounded-lg hover:bg-brand-royal/20 transition-colors">
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              )}
            </div>
            {selectedComplaint.coordinates?.lat ? (
              <div className="h-64 rounded-xl overflow-hidden relative">
                <ComplaintMap complaints={[selectedComplaint]} center={[selectedComplaint.coordinates.lat, selectedComplaint.coordinates.lng]} zoom={15} />
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs px-2 py-1 rounded shadow-sm z-10 font-mono">
                  {selectedComplaint.coordinates.lat.toFixed(6)}, {selectedComplaint.coordinates.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-xl">Location coordinates not available for this complaint.</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-brand-navy dark:text-white">Evidence</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedComplaint.images?.map((url: string, idx: number) => (
                <a href={url} target="_blank" rel="noopener noreferrer" key={`img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <img src={url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-md">
                    <FileImage className="w-3 h-3" />
                  </div>
                </a>
              ))}
              {selectedComplaint.videos?.map((url: string, idx: number) => (
                <a href={url} target="_blank" rel="noopener noreferrer" key={`vid-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <video src={url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-md">
                    <Video className="w-3 h-3" />
                  </div>
                </a>
              ))}
              {(!selectedComplaint.images?.length && !selectedComplaint.videos?.length) && (
                <p className="text-sm text-muted-foreground col-span-4">No evidence uploaded.</p>
              )}
            </div>
          </div>

          {/* Admin Internal Timeline */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-brand-navy dark:text-white">Government Timeline</h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/50">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-8">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedComplaint.progress || 10}%` }}
                  className={`h-full rounded-full ${selectedComplaint.progress === 100 ? (selectedComplaint.status === 'Rejected' ? 'bg-red-500' : 'bg-emerald-500') : "bg-brand-royal"}`}
                />
              </div>
              <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-6">
                {[
                  { id: "Submitted", progress: 10, desc: "Complaint received" },
                  { id: "Verified", progress: 20, desc: "Complaint confirmed genuine" },
                  { id: "Under Review", progress: 35, desc: "Admin is checking complaint" },
                  { id: "Forwarded to Department", progress: 50, desc: "Sent to official department" },
                  { id: "Officer Assigned", progress: 60, desc: "Officer assigned to handle this" },
                  { id: "In Progress", progress: 75, desc: "Work started by assigned officer" },
                  { id: "Resolved", progress: 100, desc: "Physical issue has been fixed" },
                  { id: "Closed", progress: 100, desc: "Final closure" }
                ].map((step) => {
                  const currentProgress = selectedComplaint.progress || 10;
                  let isCompleted = currentProgress > step.progress;
                  let isCurrent = currentProgress === step.progress;
                  let isFuture = currentProgress < step.progress;
                  
                  if (currentProgress === 100) {
                    if (selectedComplaint.status === "Closed") {
                      isCompleted = true;
                      isCurrent = step.id === "Closed";
                      if (step.id !== "Closed") isCompleted = true;
                    } else if (selectedComplaint.status === "Resolved") {
                      if (step.id === "Closed") { isFuture = true; isCompleted = false; isCurrent = false; }
                      else if (step.id === "Resolved") { isCurrent = true; isCompleted = false; }
                      else { isCompleted = true; }
                    }
                  }
                  
                  const isRejected = selectedComplaint.status === "Rejected" && step.id === "Resolved";

                  const stepLog = timelineLogs.find(log => log.newStatus === step.id);
                  let displayDate = "";
                  let displayTime = "";
                  if (stepLog && stepLog.timestamp) {
                    const d = stepLog.timestamp.toDate();
                    displayDate = d.toLocaleDateString();
                    displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } else if (step.id === "Submitted") {
                    displayDate = selectedComplaint.date;
                  }

                  return (
                    <div key={step.id} className={`relative pl-8 ${isFuture ? 'opacity-40 grayscale' : ''}`}>
                      <div 
                        className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                          isRejected ? 'bg-red-500' :
                          isCompleted ? 'bg-emerald-500' :
                          isCurrent ? 'bg-brand-royal' :
                          'bg-gray-300 dark:bg-gray-600'
                        }`} 
                      />
                      <h4 className={`font-bold text-sm ${isCurrent ? 'text-brand-royal' : isRejected ? 'text-red-500' : 'text-brand-navy dark:text-white'}`}>
                        {isRejected ? 'Rejected' : step.id}
                        {displayDate && <span className="ml-2 font-normal text-xs text-gray-500">{displayDate} {displayTime}</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground">{isRejected ? 'Complaint was rejected' : step.desc}</p>
                      
                      {(stepLog || isCurrent) && (stepLog?.adminRemarks || selectedComplaint.assignedOfficer || selectedComplaint.department) && !isFuture && (
                         <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 mt-2 text-xs space-y-1">
                           {(stepLog?.department || selectedComplaint.department) && (
                             <p><span className="font-bold">Dept:</span> {stepLog?.department || selectedComplaint.department}</p>
                           )}
                           {(stepLog?.assignedOfficer || selectedComplaint.assignedOfficer) && (
                             <p><span className="font-bold">Officer:</span> {stepLog?.assignedOfficer || selectedComplaint.assignedOfficer}</p>
                           )}
                           {(stepLog?.adminRemarks || selectedComplaint.adminRemarks) && (
                             <div>
                               <span className="font-bold">Remarks:</span>
                               <p className="mt-0.5">{stepLog?.adminRemarks || selectedComplaint.adminRemarks}</p>
                             </div>
                           )}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[450px] p-6 md:p-8 bg-gray-50 dark:bg-gray-800/30 flex flex-col gap-6 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-bold text-brand-navy dark:text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-royal" /> Action Panel
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Change Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                >
                  <option value="Submitted">Submitted (10%)</option>
                  <option value="Verified">Verified (20%)</option>
                  <option value="Under Review">Under Review (35%)</option>
                  <option value="Request More Information">Request More Information</option>
                  <option value="Forwarded to Department">Forwarded to Department (50%)</option>
                  <option value="Officer Assigned">Officer Assigned (60%)</option>
                  <option value="In Progress">In Progress (75%)</option>
                  <option value="Resolved">Resolved (100%)</option>
                  <option value="Closed">Closed (Completed)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                >
                  <option value="">Select Department</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Roads">Roads</option>
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="Police">Police</option>
                  <option value="Women's Safety Cell">Women's Safety Cell</option>
                  <option value="Health Department">Health Department</option>
                  <option value="Traffic Police">Traffic Police</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Assign Officer</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    placeholder="Officer Name (e.g. Officer Sharma)"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="Officer ID"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={officerDesignation}
                      onChange={(e) => setOfficerDesignation(e.target.value)}
                      placeholder="Designation"
                      className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={officerContact}
                      onChange={(e) => setOfficerContact(e.target.value)}
                      placeholder="Contact Number"
                      className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {(newStatus === "Resolved" || newStatus === "Closed") && (
                <div>
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 block">Resolution Proof (Image/PDF URL)</label>
                  <input
                    type="url"
                    value={resolutionProof}
                    onChange={(e) => setResolutionProof(e.target.value)}
                    placeholder="https://example.com/proof.pdf"
                    className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Provide a link to before/after photos or official resolution document for the citizen.</p>
                </div>
              )}

              <div className="flex-1 min-h-[150px]">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Internal Notes / Remarks * (Required for Status Change)</label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Add official remarks, updates, or reason for rejection..."
                  className="w-full h-full min-h-[120px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm resize-none focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <button 
              onClick={() => handleUpdateStatus()}
              className="w-full bg-brand-royal hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-brand-royal/20 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleUpdateStatus('Resolved')}
                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                Mark Resolved
              </button>
              <button 
                onClick={() => handleUpdateStatus('Rejected')}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                Reject
              </button>
            </div>
            
            <div className="pt-2">
              <button 
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete Complaint
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
