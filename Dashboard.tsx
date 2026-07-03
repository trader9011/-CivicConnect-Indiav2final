import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, MapPin, Clock, Search, LogOut, FileText, Bell, User, Settings, Filter, ChevronRight, Activity, CheckCircle2, Image as ImageIcon, Video, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { PremiumPageLoader, SkeletonCard } from "../components/ui/PremiumLoader";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("complaints");
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [showFilter, setShowFilter] = useState(false);
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "complaints"),
      where("userId", "==", currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Check for status changes in real-time
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const data = change.doc.data();
          const prevData = complaints.find((c) => c.docId === change.doc.id);
          
          if (prevData) {
            let updatedFields = [];
            if (prevData.status !== data.status) updatedFields.push(`status to ${data.status}`);
            if (prevData.department !== data.department) updatedFields.push(`department to ${data.department}`);
            if (prevData.assignedOfficer !== data.assignedOfficer) updatedFields.push(`officer to ${data.assignedOfficer}`);
            if (prevData.adminRemarks !== data.adminRemarks) updatedFields.push(`remarks updated`);
            if (prevData.progress !== data.progress) updatedFields.push(`progress to ${data.progress}%`);
            
            if (updatedFields.length > 0) {
              toast.success(`Admin Update for ${data.id}`, {
                description: `Updated ${updatedFields.join(', ')}`,
                duration: 6000,
              });
            }
          }
        }
      });

      const complaintsData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setComplaints(complaintsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate, activeTab]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400";
      case "Under Review":
      case "Verified":
      case "Assigned":
      case "Work In Progress":
        return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400";
      default:
        return "bg-blue-50 border-blue-200 text-brand-royal dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "Resolved") return <ShieldCheck className="w-3.5 h-3.5" />;
    if (status === "Under Review" || status === "Verified" || status === "Assigned" || status === "Work In Progress") return <Activity className="w-3.5 h-3.5" />;
    return null;
  };

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    underReview: complaints.filter(c => c.status === "Under Review").length,
    verified: complaints.filter(c => c.status === "Verified").length,
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pt-24 pb-12 font-ui">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header / Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 mt-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-brand-navy dark:text-white mb-2 tracking-tight">
              Welcome back, {userProfile?.fullName?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground text-lg">Manage your civic reports and track their progress securely.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/submit" className="bg-brand-royal hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
              + New Complaint
            </Link>
            <button className="p-3 bg-white dark:bg-gray-800 text-brand-navy dark:text-white rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative shadow-sm">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-3 bg-white dark:bg-gray-800 text-brand-navy dark:text-white rounded-full border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900 transition-colors shadow-sm" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {[
            { label: "Total Submitted", value: stats.total, icon: <FileText className="w-6 h-6 text-brand-navy dark:text-white" />, color: "text-brand-navy dark:text-white", bg: "bg-gray-100 dark:bg-gray-800" },
            { label: "Resolved", value: stats.resolved, icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />, color: "text-emerald-600", bg: "bg-emerald-100/50 dark:bg-emerald-900/30" },
            { label: "Under Review", value: stats.underReview, icon: <Activity className="w-6 h-6 text-brand-saffron" />, color: "text-brand-saffron", bg: "bg-amber-100/50 dark:bg-amber-900/30" },
            { label: "Verified", value: stats.verified, icon: <CheckCircle2 className="w-6 h-6 text-brand-royal" />, color: "text-brand-royal", bg: "bg-blue-100/50 dark:bg-blue-900/30" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-brand-navy p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-4xl font-heading font-bold ${stat.color} mb-1 tracking-tight`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-brand-navy rounded-[2rem] border border-gray-100 dark:border-gray-800 p-3 shadow-sm space-y-2 sticky top-32">
              <button 
                onClick={() => setActiveTab("complaints")}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold transition-all ${activeTab === "complaints" ? "bg-brand-royal text-white shadow-md shadow-brand-royal/20" : "text-brand-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <FileText className="w-5 h-5" /> My Complaints
              </button>
              <button 
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold transition-all ${activeTab === "profile" ? "bg-brand-royal text-white shadow-md shadow-brand-royal/20" : "text-brand-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <User className="w-5 h-5" /> Profile Settings
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "complaints" && (
                <motion.div key="complaints" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center justify-between relative">
                    <h2 className="text-2xl font-heading font-bold text-brand-navy dark:text-white">Recent Complaints</h2>
                    <div>
                      <button 
                        onClick={() => setShowFilter(!showFilter)}
                        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-brand-navy dark:hover:text-white transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <Filter className="w-4 h-4" /> {filterStatus !== "All" ? filterStatus : "Filter"}
                      </button>
                      
                      {/* Filter Dropdown */}
                      <AnimatePresence>
                        {showFilter && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
                          >
                            <div className="p-2 space-y-1">
                              {["All", "Under Review", "Verified", "Resolved", "Rejected"].map(status => (
                                <button
                                  key={status}
                                  onClick={() => { setFilterStatus(status); setShowFilter(false); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${filterStatus === status ? 'bg-brand-royal text-white' : 'text-brand-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isLoading ? (
                      // Skeleton Loading States
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <SkeletonCard key={idx} />
                        ))}
                      </div>
                    ) : complaints.filter(c => filterStatus === "All" || c.status === filterStatus).length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-brand-navy p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center flex flex-col items-center justify-center space-y-6"
                      >
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-heading font-bold text-brand-navy dark:text-white">No complaints found</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">{complaints.length === 0 ? "You haven't submitted any complaints. Report an issue to help improve your community." : "No complaints match your current filter criteria."}</p>
                        </div>
                        {filterStatus !== "All" && complaints.length > 0 && (
                          <button onClick={() => setFilterStatus("All")} className="bg-brand-royal hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 inline-block mt-4">
                            Clear Filters
                          </button>
                        )}
                        {complaints.length === 0 && (
                          <Link to="/submit" className="bg-brand-royal hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 inline-block mt-4">
                            Submit Your First Complaint
                          </Link>
                        )}
                      </motion.div>
                    ) : (
                      complaints.filter(c => filterStatus === "All" || c.status === filterStatus).map((complaint) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={complaint.id} 
                          className="bg-white dark:bg-brand-navy p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-mono font-bold tracking-widest text-brand-navy dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700/50">{complaint.id}</span>
                                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 border ${getStatusColor(complaint.status)}`}>
                                  {getStatusIcon(complaint.status)}
                                  {complaint.status}
                                </span>
                              </div>
                              <h3 className="font-heading font-bold text-xl text-brand-navy dark:text-white mb-3 group-hover:text-brand-royal transition-colors">{complaint.title}</h3>
                              
                              <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-muted-foreground mb-6">
                                <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-md"><FileText className="w-4 h-4" /> {complaint.category}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {complaint.location}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {complaint.date}</span>
                              </div>

                              {/* Uploaded Media Previews */}
                              {((complaint.images && complaint.images.length > 0) || (complaint.videos && complaint.videos.length > 0)) && (
                                <div className="mb-6 flex flex-wrap gap-3">
                                  {complaint.images?.map((img: string, idx: number) => (
                                    <div key={`img-${idx}`} className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden relative group/img">
                                      <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                  {complaint.videos?.map((vid: string, idx: number) => (
                                    <div key={`vid-${idx}`} className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center relative group/vid">
                                      <Video className="w-6 h-6 text-brand-royal" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">Video</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Community Stats */}
                              {((complaint.upvotes?.length > 0) || (complaint.supporters?.length > 0)) && (
                                <div className="mb-6 flex flex-wrap items-center gap-3">
                                  {complaint.upvotes?.length > 0 && (
                                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/50">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Community Verified ({complaint.upvotes.length})
                                    </span>
                                  )}
                                  {complaint.supporters?.length > 0 && (
                                    <span className="flex items-center gap-1.5 bg-brand-royal/10 text-brand-royal dark:bg-brand-royal/20 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-brand-royal/20">
                                      <Users className="w-3.5 h-3.5" /> Supported by {complaint.supporters.length} citizen{complaint.supporters.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Visual Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                  <span>Progress</span>
                                  <span className={complaint.progress === 100 ? "text-emerald-500" : "text-brand-royal"}>{complaint.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${complaint.progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${complaint.progress === 100 ? "bg-emerald-500" : "bg-brand-royal"}`}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center shrink-0">
                               <Link to={`/track?id=${complaint.id}`} className="flex items-center gap-2 text-brand-royal bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-5 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm">
                                View Full Details <ChevronRight className="w-4 h-4" />
                               </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white dark:bg-brand-navy rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 md:p-12 shadow-lg">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-heading font-bold text-brand-navy dark:text-white">Profile Information</h2>
                    <button className="text-muted-foreground hover:text-brand-royal transition-colors">
                      <Settings className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="animate-pulse space-y-8 max-w-xl">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 max-w-xl">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 text-brand-royal flex items-center justify-center text-3xl font-heading font-bold border-2 border-brand-royal/20 overflow-hidden">
                          {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            userProfile?.fullName?.charAt(0).toUpperCase() || <User className="w-10 h-10" />
                          )}
                        </div>
                        <button className="text-sm font-bold text-brand-royal hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">
                          Change Photo
                        </button>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="text-sm font-bold text-brand-navy dark:text-gray-300 mb-1.5 block">Full Name</label>
                          <input type="text" defaultValue={userProfile?.fullName || ''} className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 dark:text-white font-medium focus:ring-2 focus:ring-brand-royal outline-none transition-all" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-brand-navy dark:text-gray-300 mb-1.5 block">Email Address</label>
                          <input type="email" defaultValue={userProfile?.email || ''} disabled className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-brand-navy dark:text-gray-300 mb-1.5 block">Mobile Number</label>
                          <input type="tel" defaultValue={userProfile?.phoneNumber || ''} className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 dark:text-white font-medium focus:ring-2 focus:ring-brand-royal outline-none transition-all" placeholder="Add mobile number" />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button className="bg-brand-navy hover:bg-brand-royal text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
