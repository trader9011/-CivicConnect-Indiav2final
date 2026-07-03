import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Shield, Lock, Clock, CheckCircle2, Search, Zap, CheckCircle, FileText, Upload, UserCheck, BellRing, Activity } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "complaints"),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentComplaints(snapshot.docs.map(doc => doc.data()));
    }, (error) => {
      console.warn("Could not load recent complaints:", error);
    });
    return () => unsubscribe();
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Trust Bar */}
      <div className="bg-brand-navy text-white text-xs py-2 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center font-ui">
          <div className="flex space-x-6">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" /> Secure Platform</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-brand-emerald" /> Privacy Protected</span>
          </div>
          <div className="flex space-x-6">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 24×7 Support</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Fast Resolution Tracking</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-brand-navy/50 dark:to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-brand-royal/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-brand-saffron/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-brand-royal dark:text-blue-300 text-sm font-medium mb-6 border border-blue-100 dark:border-blue-800 font-ui shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-royal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-royal"></span>
                </span>
                Independent Citizen Platform
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-brand-navy dark:text-white leading-[1.1] mb-6">
                Raise Your Voice.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-royal to-blue-400">
                  Build a Better Community.
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl font-ui">
                Securely report local issues, upload evidence, track progress, and receive transparent updates from one simple, enterprise-grade platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 font-ui">
                <Link
                  to="/submit"
                  className="inline-flex items-center justify-center gap-2 bg-brand-royal hover:bg-blue-700 text-white px-8 py-4 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-brand-royal/25 hover:-translate-y-0.5"
                >
                  Submit Complaint
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/track"
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-brand-navy dark:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 px-8 py-4 rounded-full font-medium transition-all hover:shadow-sm"
                >
                  Track Complaint
                  <Search className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground font-ui">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-background bg-gray-200 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e2e8f0" alt="user" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-background bg-gray-300 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=cbd5e1" alt="user" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-background bg-gray-400 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rishi&backgroundColor=94a3b8" alt="user" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-background bg-brand-royal flex items-center justify-center text-white font-medium text-xs">+2k</div>
                </div>
                <p>Joined by thousands of<br/>active citizens.</p>
              </div>
            </motion.div>

            {/* Right Side - Visual / App Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto"
            >
              <div className="relative mx-auto w-full max-w-[360px] aspect-[1/2] rounded-[2.5rem] border-[8px] border-gray-900 bg-gray-50 dark:bg-gray-950 shadow-2xl overflow-hidden font-ui">
                {/* Status Bar */}
                <div className="w-full h-6 bg-transparent absolute top-0 left-0 flex justify-center z-20">
                  <div className="w-32 h-5 bg-gray-900 rounded-b-xl" />
                </div>
                
                {/* Mockup Screen Content (Realistic App View) */}
                <div className="h-full flex flex-col pt-10 pb-6 px-5 relative bg-white dark:bg-background">
                  {/* Mock Navbar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-royal text-white flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-brand-navy dark:text-white">CivicConnect</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=f1f5f9" alt="user" />
                    </div>
                  </div>
                  
                  {/* Mock Dashboard Card */}
                  <div className="bg-brand-navy rounded-2xl p-4 text-white mb-6 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-royal/20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
                    <p className="text-white/70 text-xs mb-1">Total Reports</p>
                    <h2 className="text-2xl font-bold font-display mb-4">12</h2>
                    <div className="flex gap-2">
                      <div className="bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 text-xs">8 Resolved</div>
                      <div className="bg-brand-saffron/20 text-brand-saffron rounded-lg px-2 py-1 text-xs">4 Pending</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <h3 className="font-semibold text-sm mb-4 text-brand-navy dark:text-white">Recent Activity</h3>
                  <div className="flex-1 space-y-3 overflow-hidden relative">
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-background to-transparent z-10" />
                    {recentComplaints.length > 0 ? recentComplaints.map((item, i) => {
                      let color = "text-brand-royal";
                      let bg = "bg-blue-50 dark:bg-blue-500/10";
                      if (item.status === "Resolved") { color = "text-emerald-500"; bg = "bg-emerald-50 dark:bg-emerald-500/10"; }
                      else if (item.status === "Under Review" || item.status === "Pending Review") { color = "text-brand-saffron"; bg = "bg-amber-50 dark:bg-amber-500/10"; }

                      return (
                        <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Activity className={`w-4 h-4 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-brand-navy dark:text-white truncate">{item.category}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.status}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-sm text-center text-muted-foreground mt-4">No recent activity</div>
                    )}
                  </div>

                  {/* Submit FAB */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                    <div className="bg-brand-royal text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold">
                      <span className="text-lg leading-none">+</span> New Complaint
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-20 -left-6 lg:-left-12 glass-card p-4 rounded-2xl flex items-center gap-3 z-30"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="font-ui">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Verified Complaint</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Just now</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-32 -right-4 lg:-right-8 glass-card p-4 rounded-2xl flex items-center gap-3 z-30"
              >
                <div className="w-10 h-10 rounded-full bg-brand-saffron/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-brand-saffron" />
                </div>
                <div className="font-ui">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Under Review</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: #CVC-8921</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-brand-navy/20 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-brand-navy dark:text-white mb-4">
              Simple. Transparent. Effective.
            </h2>
            <p className="text-muted-foreground text-lg font-ui">
              Our streamlined process ensures your voice is heard and action is taken in five easy steps.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Timeline connector (desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-100 via-brand-royal to-emerald-100 dark:from-blue-900/50 dark:via-brand-royal dark:to-emerald-900/50 -translate-y-1/2 z-0 opacity-50" />
            
            <div className="grid md:grid-cols-5 gap-6 relative z-10">
              {[
                { icon: FileText, title: "Submit", desc: "Fill details" },
                { icon: Upload, title: "Evidence", desc: "Add media" },
                { icon: UserCheck, title: "Review", desc: "Admin check" },
                { icon: BellRing, title: "Updates", desc: "Track status" },
                { icon: CheckCircle, title: "Resolve", desc: "Issue closed" },
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -8 }}
                  className="bg-white dark:bg-background p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-brand-royal/10 hover:border-brand-royal/30 transition-all text-center group"
                >
                  <div className="w-14 h-14 mx-auto bg-blue-50 dark:bg-blue-900/20 text-brand-royal rounded-2xl flex items-center justify-center mb-5 group-hover:bg-brand-royal group-hover:text-white transition-colors duration-300">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-ui text-brand-navy dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-ui">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        {/* Subtle gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-brand-royal/20 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to make a difference?
          </h2>
          <p className="text-blue-100/80 text-lg mb-10 max-w-2xl mx-auto font-ui">
            Join thousands of active citizens. It takes less than 2 minutes to report an issue and help improve your locality.
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center justify-center gap-2 bg-white text-brand-navy px-8 py-4 rounded-full font-bold text-lg transition-all hover:bg-gray-100 hover:scale-105 shadow-xl hover:shadow-2xl font-ui"
          >
            Start a Complaint
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

