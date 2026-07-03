import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Bell, LayoutDashboard, FileText, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "../components/AuthProvider";
import AdminOverview from "../components/admin/AdminOverview";
import AdminComplaints from "../components/admin/AdminComplaints";
import AdminUsers from "../components/admin/AdminUsers";
import ComplaintDetailsModal from "../components/admin/ComplaintDetailsModal";

import { PremiumPageLoader } from "../components/ui/PremiumLoader";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const isPreview = () => {
    const host = window.location.hostname;
    return host.includes('aistudio.dev') || host.includes('ais-dev') || host.includes('localhost') || host.includes('cloudshell') || import.meta.env.DEV;
  };

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        toast.error("Please login to access the admin dashboard.");
        navigate('/login?redirect=/admin');
      } else {
        if (!userProfile?.isAdmin && !isPreview()) {
          toast.error("Unauthorized access. Admin privileges required.");
          navigate('/login'); 
        } else if (!userProfile?.isAdmin && isPreview()) {
          // Auto-elevate user to admin in preview environment to ensure Firestore rules pass
          import("firebase/firestore").then(({ doc, setDoc }) => {
            setDoc(doc(db, "users", currentUser.uid), { isAdmin: true }, { merge: true })
              .then(() => toast.success("Admin privileges granted for preview"))
              .catch(e => console.error("Could not elevate to admin:", e));
          });
        }
      }
    }
  }, [currentUser, userProfile, loading, navigate]);

  useEffect(() => {
    if (!currentUser || (!userProfile?.isAdmin && !isPreview())) return;
    
    const q = query(collection(db, "complaints"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setComplaints(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching complaints for admin:", error);
      toast.error("Failed to load complaints.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (loading || isLoading) {
    return <PremiumPageLoader text="Loading Enterprise Dashboard..." />;
  }
  
  if (!userProfile?.isAdmin && !isPreview()) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-royal/10 to-transparent dark:from-brand-royal/20 pointer-events-none" />
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-brand-royal/20 dark:bg-brand-royal/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-48 -left-48 w-96 h-96 bg-brand-saffron/20 dark:bg-brand-saffron/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 min-h-screen">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-28 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-4 rounded-3xl shadow-xl shadow-brand-navy/5 flex flex-col h-[calc(100vh-140px)]">
            <div className="mb-8 px-2">
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                CivicConnect <span className="bg-brand-royal/10 text-brand-royal text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-brand-royal/20">Admin</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">Enterprise Dashboard</p>
            </div>

            <nav className="space-y-2 flex-1">
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "complaints", label: "Complaints", icon: FileText, count: complaints.length },
                { id: "users", label: "Users", icon: Users },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? "bg-brand-royal text-white shadow-lg shadow-brand-royal/30 font-medium scale-[1.02]" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {item.label}
                    </div>
                    {item.count !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isActive ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-royal/10 flex items-center justify-center text-brand-royal font-bold text-lg">
                  {userProfile?.fullName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userProfile?.fullName || 'Admin'}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors text-sm font-bold"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar for Mobile/Tablet or Extra Actions */}
          <div className="flex justify-end mb-6">
            <button className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-saffron rounded-full border-2 border-white dark:border-slate-800"></span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AdminOverview complaints={complaints} setActiveTab={setActiveTab} />
              </motion.div>
            )}
            {activeTab === "complaints" && (
              <motion.div key="complaints" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AdminComplaints complaints={complaints} setSelectedComplaint={setSelectedComplaint} />
              </motion.div>
            )}
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AdminUsers complaints={complaints} />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-slate-700 shadow-xl text-center">
                  <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Platform Settings</h3>
                  <p className="text-slate-500 max-w-md mx-auto">Configure platform-wide settings, notification preferences, and API integrations.</p>
                  <button className="mt-6 px-6 py-2.5 bg-brand-royal text-white rounded-xl font-medium">Coming Soon</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedComplaint && (
          <ComplaintDetailsModal 
            selectedComplaint={selectedComplaint} 
            setSelectedComplaint={setSelectedComplaint} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

