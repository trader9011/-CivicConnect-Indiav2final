import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Clock, CheckCircle2, AlertCircle, FileText, Activity, Users, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "../components/AuthProvider";
import { PremiumInlineLoader } from '../components/ui/PremiumLoader';

export default function TrackComplaint() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("id") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [complaintData, setComplaintData] = useState<any>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!currentUser) {
      toast.error("Please login to verify this complaint.");
      return;
    }
    if (!complaintData) return;
    
    // Check if already voted
    const hasUpvoted = complaintData.upvotes?.includes(currentUser.uid);
    const hasDownvoted = complaintData.downvotes?.includes(currentUser.uid);
    
    if (hasUpvoted || hasDownvoted) {
      toast.error("You have already provided feedback on this complaint.");
      return;
    }

    setIsVoting(true);
    try {
      const complaintRef = doc(db, "complaints", currentDocId!);
      const updateField = type === 'upvote' ? { upvotes: arrayUnion(currentUser.uid) } : { downvotes: arrayUnion(currentUser.uid) };
      
      await updateDoc(complaintRef, updateField);
      
      // Update local state
      setComplaintData(prev => ({
        ...prev,
        [type === 'upvote' ? 'upvotes' : 'downvotes']: [...(prev[type === 'upvote' ? 'upvotes' : 'downvotes'] || []), currentUser.uid]
      }));
      
      toast.success(type === 'upvote' ? "Thank you for confirming this issue." : "Thank you for your feedback.");
    } catch (error) {
      console.error("Voting error:", error);
      toast.error("Failed to submit feedback.");
    } finally {
      setIsVoting(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("id")) {
      const formEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(formEvent, searchParams.get("id")!);
    }
  }, [searchParams]);

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!currentDocId) return;
    
    let isInitialLoad = true;
    const unsubscribeComplaint = onSnapshot(doc(db, "complaints", currentDocId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Notify on subsequent updates
        if (!isInitialLoad) {
          setComplaintData((prev: any) => {
             if (prev) {
               let updatedFields = [];
               if (prev.status !== data.status) updatedFields.push(`status to ${data.status}`);
               if (prev.department !== data.department) updatedFields.push(`department to ${data.department}`);
               if (prev.assignedOfficer !== data.assignedOfficer) updatedFields.push(`officer to ${data.assignedOfficer}`);
               if (prev.adminRemarks !== data.adminRemarks) updatedFields.push(`remarks updated`);
               if (prev.progress !== data.progress) updatedFields.push(`progress to ${data.progress}%`);
               
               if (updatedFields.length > 0) {
                 toast.success(`Admin Update`, { description: `Updated ${updatedFields.join(', ')}` });
               }
             }
             return { ...data, docId: docSnap.id };
          });
        } else {
          setComplaintData({ ...data, docId: docSnap.id });
        }
        isInitialLoad = false;
      }
    }, (error) => {
      console.warn("Realtime listener failed:", error);
    });

    const qLogs = query(collection(db, "admin_logs"), where("complaintDocId", "==", currentDocId));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in descending order based on timestamp (newest first, though we might want to sort it in UI)
      logs.sort((a: any, b: any) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return bTime - aTime;
      });
      setTimelineLogs(logs);
    }, (error) => {
      console.warn("Realtime logs listener failed:", error);
    });

    return () => {
      unsubscribeComplaint();
      unsubscribeLogs();
    };
  }, [currentDocId]);

  const handleSearch = async (e: React.FormEvent, queryStr?: string) => {
    e.preventDefault();
    const queryToUse = queryStr || searchQuery;
    if (!queryToUse.trim()) return;

    setIsSearching(true);
    setHasResult(false);
    setCurrentDocId(null);
    // don't clear complaintData yet to avoid flickering if it's the same

    try {
      // First try to search by exact complaint ID
      let q = query(collection(db, "complaints"), where("id", "==", queryToUse.trim()));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // If not found by ID, try by mobile number
        q = query(collection(db, "complaints"), where("mobileNumber", "==", queryToUse.trim()));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        // Just take the first result for simplicity
        const firstDoc = querySnapshot.docs[0];
        setCurrentDocId(firstDoc.id);
        setHasResult(true);
      } else {
        setComplaintData(null);
        toast.error("No complaint found with that ID or Mobile Number.");
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search complaints.");
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400";
      case "Under Review":
      case "Verified":
      case "Assigned": return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400";
      default: return "bg-blue-50 border-blue-200 text-brand-royal dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400";
    }
  };

  const isAuthor = currentUser?.uid === complaintData?.userId;
  const upvotesCount = complaintData?.upvotes?.length || 0;
  const downvotesCount = complaintData?.downvotes?.length || 0;
  const totalVotes = upvotesCount + downvotesCount;
  const confidenceScore = totalVotes > 0 ? Math.round((upvotesCount / totalVotes) * 100) : 0;
  const hasVoted = currentUser && (complaintData?.upvotes?.includes(currentUser.uid) || complaintData?.downvotes?.includes(currentUser.uid));
  const supportersCount = complaintData?.supporters?.length || 0;

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50/50 dark:bg-background font-ui">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-brand-navy dark:text-white mb-4 tracking-tight">
            Track Your Complaint
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter your Complaint ID or registered Mobile Number to check the real-time status.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-xl shadow-brand-navy/5 border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-10 max-w-3xl mx-auto relative z-10"
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Complaint ID (e.g., CCI-2026-12345) or Mobile Number" 
                className="w-full pl-14 pr-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium text-lg placeholder:text-base placeholder:font-normal"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-brand-navy hover:bg-brand-royal text-white px-8 py-4 rounded-2xl font-bold transition-all md:w-auto w-full disabled:opacity-70 flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              {isSearching ? (
                 <PremiumInlineLoader />
              ) : "Track Status"}
            </button>
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div 
              key="skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Details Skeleton */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 animate-pulse">
                  <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mb-8"></div>
                  <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-8"></div>
                  <div className="space-y-6">
                    <div>
                      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="w-full h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div>
                      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="w-full h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Skeleton */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 animate-pulse">
                  <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-10"></div>
                  <div className="ml-4 space-y-10 border-l-2 border-gray-100 dark:border-gray-800 pl-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[43px] top-1 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {hasResult && !isSearching && complaintData && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Details Card */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FileText className="w-32 h-32" />
                  </div>
                  
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-sm font-bold mb-8 uppercase tracking-wider ${getStatusColor(complaintData.status)}`}>
                    <Activity className={`w-4 h-4 ${complaintData.status !== 'Resolved' ? 'animate-pulse' : ''}`} />
                    {complaintData.status}
                  </div>
                  
                  <h3 className="font-heading font-bold text-3xl text-brand-navy dark:text-white mb-8 tracking-tight">{complaintData.id}</h3>
                  
                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Category</p>
                      <p className="font-bold text-brand-navy dark:text-gray-200 flex items-center gap-2.5 text-lg">
                        <AlertCircle className="w-5 h-5 text-brand-royal" /> {complaintData.category}
                      </p>
                      {complaintData.category === "Other" && complaintData.otherCategory && (
                        <p className="text-sm text-brand-navy/70 dark:text-gray-400 mt-1 pl-7.5">{complaintData.otherCategory}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Location</p>
                      <p className="font-bold text-brand-navy dark:text-gray-200 flex items-center gap-2.5 text-lg">
                        <MapPin className="w-5 h-5 text-brand-royal" /> {complaintData.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Date Submitted</p>
                      <p className="font-bold text-brand-navy dark:text-gray-200 flex items-center gap-2.5 text-lg">
                        <Clock className="w-5 h-5 text-brand-royal" /> {complaintData.date}
                      </p>
                    </div>

                    {/* Active Uploads */}

                    {/* Community Verification Panel */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> Community Verification
                      </p>
                      
                      {totalVotes > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-muted-foreground">Confidence Score</span>
                            <span className={`text-lg font-bold ${confidenceScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : (confidenceScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}`}>
                              {confidenceScore}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: `${confidenceScore}%` }} />
                            <div className="h-full bg-red-500" style={{ width: `${100 - confidenceScore}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Based on {totalVotes} nearby citizen{totalVotes !== 1 && 's'}. {supportersCount > 0 && `(+${supportersCount} supporters)`}
                          </p>
                        </div>
                      )}

                      {!isAuthor && !hasVoted && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                          <p className="text-sm font-bold text-brand-navy dark:text-white mb-3">
                            Have you also observed this problem in your area?
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleVote('upvote')}
                              disabled={isVoting}
                              className="flex-1 bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 py-2.5 rounded-xl font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                              <ThumbsUp className="w-4 h-4" /> Yes
                            </button>
                            <button 
                              onClick={() => handleVote('downvote')}
                              disabled={isVoting}
                              className="flex-1 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 py-2.5 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                              <ThumbsDown className="w-4 h-4" /> No
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {(!isAuthor && hasVoted) && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-sm font-bold">
                          <CheckCircle2 className="w-4 h-4" /> You've verified this issue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="font-heading font-bold text-2xl text-brand-navy dark:text-white">Status Timeline</h3>
                    <div className="text-brand-royal font-bold">{complaintData.progress || 20}% Complete</div>
                  </div>

                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-12">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${complaintData.progress || 20}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${complaintData.progress === 100 ? (complaintData.status === 'Rejected' ? 'bg-red-500' : 'bg-emerald-500') : "bg-brand-royal"}`}
                    />
                  </div>
                  
                  <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 space-y-10">
                    {[
                      { id: "Submitted", progress: 10, desc: "Complaint received." },
                      { id: "Verified", progress: 20, desc: "Complaint confirmed genuine." },
                      { id: "Under Review", progress: 35, desc: "Admin is checking complaint." },
                      { id: "Forwarded to Department", progress: 50, desc: "Complaint officially forwarded." },
                      { id: "Officer Assigned", progress: 60, desc: "An officer has been assigned to handle this." },
                      { id: "In Progress", progress: 75, desc: "Department has started work." },
                      { id: "Resolved", progress: 100, desc: "The physical issue has actually been fixed on the ground." },
                      { id: "Closed", progress: 100, desc: "Final administrative closure." }
                    ].map((step, index) => {
                      // Determine status state based on current progress
                      const currentProgress = complaintData.progress || 10;
                      
                      let isCompleted = currentProgress > step.progress;
                      let isCurrent = currentProgress === step.progress;
                      let isFuture = currentProgress < step.progress;
                      
                      // Special logic for Resolved vs Closed since both are 100
                      if (currentProgress === 100) {
                        if (complaintData.status === "Closed") {
                          isCompleted = true; // all are completed
                          isCurrent = step.id === "Closed";
                          if (step.id !== "Closed") isCompleted = true;
                        } else if (complaintData.status === "Resolved") {
                          if (step.id === "Closed") {
                            isFuture = true;
                            isCompleted = false;
                            isCurrent = false;
                          } else if (step.id === "Resolved") {
                            isCurrent = true;
                            isCompleted = false;
                          } else {
                            isCompleted = true;
                          }
                        }
                      }
                      
                      // Handle rejected edge case
                      const isRejected = complaintData.status === "Rejected" && step.id === "Resolved";

                      // Find associated log for this step
                      const stepLog = timelineLogs.find(log => log.newStatus === step.id);
                      let displayDate = "";
                      let displayTime = "";
                      if (stepLog && stepLog.timestamp) {
                        const d = stepLog.timestamp.toDate();
                        displayDate = d.toLocaleDateString();
                        displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } else if (step.id === "Submitted") {
                        // Use original complaint date
                        displayDate = complaintData.date;
                        displayTime = "";
                      }

                      return (
                        <div key={step.id} className={`relative pl-10 ${isFuture ? 'opacity-40 grayscale' : ''}`}>
                          <div 
                            className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-brand-navy ${
                              isRejected ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]' :
                              isCompleted ? 'bg-emerald-500' :
                              isCurrent ? 'bg-brand-royal shadow-[0_0_0_4px_rgba(37,99,235,0.2)]' :
                              'bg-gray-200 dark:bg-gray-700'
                            }`} 
                          />
                          <p className={`text-sm font-bold mb-1 uppercase tracking-wider ${
                            isRejected ? 'text-red-600 dark:text-red-400' :
                            isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                            isCurrent ? 'text-brand-royal' :
                            'text-muted-foreground'
                          }`}>
                            {isRejected ? 'Rejected' : isCompleted ? 'Completed' : isCurrent ? 'Current Status' : 'Pending'}
                            {displayDate && <span className="ml-2 lowercase font-normal text-gray-500">{displayDate} {displayTime}</span>}
                          </p>
                          <h4 className="font-heading font-bold text-brand-navy dark:text-white text-xl mb-2">
                            {isRejected ? 'Rejected' : step.id}
                          </h4>
                          <p className="text-base text-muted-foreground">
                            {isRejected ? 'Your complaint was reviewed but could not be processed further.' : step.desc}
                          </p>
                          
                          {/* Log Details */}
                          {(stepLog || isCurrent) && (stepLog?.adminRemarks || complaintData.assignedOfficer || complaintData.department) && !isFuture && (
                             <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mt-3 text-sm space-y-2">
                               {(stepLog?.department || complaintData.department) && (
                                 <p><span className="font-bold">Department:</span> {stepLog?.department || complaintData.department}</p>
                               )}
                               {(stepLog?.assignedOfficer || complaintData.assignedOfficer) && (
                                 <div>
                                   <p><span className="font-bold">Officer Name:</span> {stepLog?.assignedOfficer || complaintData.assignedOfficer}</p>
                                   {(stepLog?.officerId || complaintData.officerId) && <p><span className="font-bold">Officer ID:</span> {stepLog?.officerId || complaintData.officerId}</p>}
                                   {(stepLog?.officerDesignation || complaintData.officerDesignation) && <p><span className="font-bold">Designation:</span> {stepLog?.officerDesignation || complaintData.officerDesignation}</p>}
                                   {(stepLog?.officerContact || complaintData.officerContact) && <p><span className="font-bold">Contact:</span> {stepLog?.officerContact || complaintData.officerContact}</p>}
                                 </div>
                               )}
                               {(stepLog?.adminRemarks || complaintData.adminRemarks) && (
                                 <div>
                                   <span className="font-bold">Remarks:</span>
                                   <p className="mt-1">{stepLog?.adminRemarks || complaintData.adminRemarks}</p>
                                 </div>
                               )}
                               {(stepLog?.resolutionProof || complaintData.resolutionProof) && (step.id === "Resolved" || step.id === "Closed") && (
                                 <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-800">
                                   <span className="font-bold">Resolution Proof:</span>
                                   <a href={stepLog?.resolutionProof || complaintData.resolutionProof} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                     View Document / Image
                                   </a>
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

              {/* Feedback Section */}
              {complaintData.status === "Closed" && isAuthor && !complaintData.feedback && (
                <div className="md:col-span-3 mt-8">
                  <div className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 text-center">
                    <h3 className="font-heading font-bold text-2xl text-brand-navy dark:text-white mb-4">Rate Your Experience</h3>
                    <p className="text-muted-foreground mb-6">How satisfied are you with the resolution of this issue?</p>
                    <div className="flex justify-center gap-2 mb-6">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={async () => {
                            const feedbackText = window.prompt("Please provide any additional feedback (optional):");
                            if (feedbackText !== null) {
                              try {
                                await import("firebase/firestore").then(({ updateDoc, doc, serverTimestamp }) => {
                                  updateDoc(doc(db, "complaints", currentDocId!), {
                                    feedback: { rating: star, comment: feedbackText, timestamp: serverTimestamp() }
                                  });
                                });
                                toast.success("Thank you for your feedback!");
                              } catch (e) {
                                toast.error("Failed to submit feedback.");
                              }
                            }
                          }}
                          className="p-2 hover:scale-110 transition-transform text-gray-300 hover:text-amber-400"
                        >
                          <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {complaintData.feedback && (
                 <div className="md:col-span-3 mt-8">
                  <div className="bg-white dark:bg-brand-navy rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10">
                    <h3 className="font-heading font-bold text-2xl text-brand-navy dark:text-white mb-4">Your Feedback</h3>
                    <div className="flex items-center gap-2 mb-4">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className={`w-6 h-6 ${star <= complaintData.feedback.rating ? 'text-amber-400' : 'text-gray-300'} fill-current`} viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                      ))}
                    </div>
                    {complaintData.feedback.comment && (
                      <p className="text-muted-foreground bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">{complaintData.feedback.comment}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
