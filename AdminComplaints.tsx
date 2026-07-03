import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, Download, Eye, Settings, Users, ChevronLeft, ChevronRight, MoreVertical, CheckCircle, SearchCode, UserPlus, Building, PlayCircle, CheckSquare, XCircle, Ban, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../AuthProvider";

export default function AdminComplaints({ complaints, setSelectedComplaint }: { complaints: any[], setSelectedComplaint: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const { currentUser } = useAuth();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAction = async (e: React.MouseEvent, complaint: any, actionType: string) => {
    e.stopPropagation();
    setOpenDropdownId(null);

    let newStatus = complaint.status;
    let newProgress = complaint.progress || 10;
    
    switch (actionType) {
      case "Verify": newStatus = "Verified"; newProgress = 20; break;
      case "Mark Under Review": newStatus = "Under Review"; newProgress = 35; break;
      case "Forward to Department": newStatus = "Forwarded to Department"; newProgress = 50; break;
      case "Assign Officer": newStatus = "Officer Assigned"; newProgress = 60; break;
      case "Start Work": newStatus = "In Progress"; newProgress = 75; break;
      case "Mark Resolved": newStatus = "Resolved"; newProgress = 100; break;
      case "Close Complaint": 
        if (complaint.status !== "Resolved") {
          toast.error("Complaint must be marked Resolved before closing.");
          return;
        }
        newStatus = "Closed"; newProgress = 100; break;
      case "Reject Complaint": newStatus = "Rejected"; newProgress = 100; break;
      case "Request More Information": newStatus = "Request More Information"; break;
    }

    try {
      const docRef = doc(db, "complaints", complaint.docId);
      await updateDoc(docRef, {
        status: newStatus,
        progress: newProgress,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.email || "Admin",
      });

      await addDoc(collection(db, "admin_logs"), {
        complaintId: complaint.id,
        complaintDocId: complaint.docId,
        oldStatus: complaint.status,
        newStatus: newStatus,
        adminRemarks: `Status updated to ${newStatus}`,
        assignedOfficer: complaint.assignedOfficer || "",
        department: complaint.department || "",
        adminId: currentUser?.uid,
        adminEmail: currentUser?.email,
        timestamp: serverTimestamp()
      });

      toast.success(`Complaint marked as ${newStatus}`);
    } catch (error: any) {
      console.error("Firestore update failed:", error);
      toast.error(`Failed to update status: ${error.message || "Unknown error"}`);
    }
  };

  const calculateConfidence = (upvotes: any[], downvotes: any[]) => {
    const up = upvotes?.length || 0;
    const down = downvotes?.length || 0;
    const total = up + down;
    if (total === 0) return 0;
    return Math.round((up / total) * 100);
  };

  const getPriority = (c: any) => {
    const conf = calculateConfidence(c.upvotes, c.downvotes);
    if (conf >= 80 || (c.upvotes?.length || 0) > 10) return "Critical";
    if (conf >= 50 || (c.upvotes?.length || 0) > 5) return "High";
    if ((c.upvotes?.length || 0) > 0) return "Medium";
    return "Low";
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = c.id?.toLowerCase().includes(q) || 
                            c.title?.toLowerCase().includes(q) ||
                            c.location?.toLowerCase().includes(q) ||
                            c.fullName?.toLowerCase().includes(q) ||
                            c.mobileNumber?.includes(q);
      const matchesStatus = filterStatus === "All" || c.status === filterStatus;
      const matchesCategory = filterCategory === "All" || c.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [complaints, searchQuery, filterStatus, filterCategory]);

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const exportData = filteredComplaints.map(c => ({
      ID: c.id,
      Title: c.category === "Other" && c.otherCategory ? c.otherCategory : (c.title || c.category),
      Category: c.category,
      SpecificIssue: c.otherCategory || "",
      Status: c.status,
      Priority: getPriority(c),
      Citizen: c.fullName || "Anonymous",
      Mobile: c.mobileNumber || "N/A",
      Location: c.location,
      Date: c.date
    }));
    
  const handleExportCSV = () => {
    if (filteredComplaints.length === 0) return toast.error("No data to export");
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    XLSX.writeFile(wb, `complaints_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportExcel = () => {
    if (filteredComplaints.length === 0) return toast.error("No data to export");
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    XLSX.writeFile(wb, `complaints_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredComplaints.length === 0) return toast.error("No data to export");
    const doc = new jsPDF();
    doc.text("CivicConnect Complaints Report", 14, 15);
    const tableColumn = ["ID", "Category", "Specific Issue", "Status", "Priority", "Date"];
    const tableRows = filteredComplaints.map(c => [
      c.id.substring(0,8) + '...',
      c.category,
      c.otherCategory ? c.otherCategory.substring(0, 15) + '...' : "-",
      c.status,
      getPriority(c),
      c.date
    ]);
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`complaints_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search ID, Name, Mobile, Location..." 
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all text-sm" 
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters || filterStatus !== "All" || filterCategory !== "All" ? 'bg-brand-royal text-white border-brand-royal' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Filter className="w-4 h-4" /> Filters {(filterStatus !== "All" || filterCategory !== "All") && "(Active)"}
          </button>
          
          <div className="group relative">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 top-12 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">CSV</button>
              <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Excel</button>
              <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">PDF</button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 sm:right-auto sm:left-0 top-14 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 p-4"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => {setFilterStatus(e.target.value); setCurrentPage(1);}}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-royal"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Verified">Verified</option>
                      <option value="Forwarded to Department">Forwarded to Department</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Category</label>
                    <select 
                      value={filterCategory} 
                      onChange={(e) => {setFilterCategory(e.target.value); setCurrentPage(1);}}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-royal"
                    >
                      <option value="All">All Categories</option>
                      <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Public Safety">Public Safety</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button onClick={() => { setFilterStatus("All"); setFilterCategory("All"); setSearchQuery(""); setCurrentPage(1); }} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-bold transition-colors">Reset</button>
                    <button onClick={() => setShowFilters(false)} className="flex-1 bg-brand-royal hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">Apply</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-muted-foreground border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">ID & Details</th>
                <th className="px-6 py-4 font-medium">Citizen</th>
                <th className="px-6 py-4 font-medium">Community Trust</th>
                <th className="px-6 py-4 font-medium">Status & Priority</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No complaints found matching your filters.
                  </td>
                </tr>
              ) : paginatedComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-gray-500 mb-1">{c.id}</div>
                    <div className="font-medium text-brand-navy dark:text-white mb-1">
                      {c.category === "Other" && c.otherCategory ? c.otherCategory : (c.title || c.category)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{c.category}</span> • <span>{c.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div>{c.fullName || "Anonymous"}</div>
                    <div className="text-xs">{c.mobileNumber || "No phone"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${calculateConfidence(c.upvotes, c.downvotes) >= 70 ? 'text-emerald-600' : (calculateConfidence(c.upvotes, c.downvotes) >= 40 ? 'text-amber-500' : 'text-red-500')}`}>
                          {calculateConfidence(c.upvotes, c.downvotes)}% Score
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {(c.upvotes?.length || 0) + (c.downvotes?.length || 0)} votes
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full
                        ${c.status === "Resolved" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : 
                          c.status === "Under Review" || c.status === "Pending Review" ? "bg-amber-50 text-amber-500 dark:bg-amber-900/20" : 
                          c.status === "Rejected" ? "bg-red-50 text-red-500 dark:bg-red-900/20" : 
                          "bg-blue-50 text-blue-500 dark:bg-blue-900/20"}
                      `}>
                        {c.status}
                      </span>
                      <br />
                      <span className={`inline-block text-xs font-medium
                        ${getPriority(c) === "Critical" ? "text-red-500" :
                          getPriority(c) === "High" ? "text-orange-500" :
                          getPriority(c) === "Medium" ? "text-blue-500" :
                          "text-gray-500"}
                      `}>
                        Priority: {getPriority(c)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <Link to={`/track?id=${c.id}`} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-brand-navy dark:text-white" title="Public View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === c.id ? null : c.id);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-brand-navy dark:text-white"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        <AnimatePresence>
                          {openDropdownId === c.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 text-left"
                            >
                              <div className="py-2">
                                <button onClick={() => setSelectedComplaint(c)} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-gray-500" /> View Details
                                </button>
                                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                <button onClick={(e) => handleAction(e, c, 'Verify')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Verify
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Mark Under Review')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <SearchCode className="w-4 h-4 text-blue-500" /> Mark Under Review
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Assign Officer')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <UserPlus className="w-4 h-4 text-purple-500" /> Assign Officer
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Forward to Department')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <Building className="w-4 h-4 text-indigo-500" /> Forward to Department
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Start Work')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <PlayCircle className="w-4 h-4 text-orange-500" /> Start Work
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Mark Resolved')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <CheckSquare className="w-4 h-4 text-emerald-600" /> Mark Resolved
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Close Complaint')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <XCircle className="w-4 h-4 text-gray-500" /> Close Complaint
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Reject Complaint')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <Ban className="w-4 h-4 text-red-500" /> Reject Complaint
                                </button>
                                <button onClick={(e) => handleAction(e, c, 'Request More Information')} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                  <HelpCircle className="w-4 h-4 text-amber-500" /> Request More Info
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
