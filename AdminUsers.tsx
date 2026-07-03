import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Shield, Ban, CheckCircle, Clock } from "lucide-react";
import { collection, onSnapshot, query, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";

import { PremiumInlineLoader } from '../ui/PremiumLoader';

export default function AdminUsers({ complaints }: { complaints: any[] }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "suspended" ? "active" : "suspended";
      await updateDoc(doc(db, "users", userId), {
        status: newStatus
      });
      toast.success(`User ${newStatus === "suspended" ? "suspended" : "activated"} successfully`);
    } catch (error) {
      toast.error("Failed to update user status");
      console.error(error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.mobileNumber?.includes(searchQuery)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Name, Email, Mobile..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all text-sm" 
          />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-muted-foreground border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Role & Status</th>
                <th className="px-6 py-4 font-medium">Activity</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <div className="mb-2"><PremiumInlineLoader /></div>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                const userComplaints = complaints.filter(c => c.userId === u.id);
                const isSuspended = u.status === "suspended";
                return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-navy dark:text-white mb-1">{u.fullName || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{u.id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{u.email || "No email"}</div>
                      <div className="text-xs">{u.mobileNumber || "No mobile"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-royal bg-brand-royal/10 px-2 py-0.5 rounded w-fit">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit">
                            Citizen
                          </span>
                        )}
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded w-fit">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded w-fit">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-bold text-brand-navy dark:text-white">{userComplaints.length}</span> Complaints Filed
                      </div>
                      {userComplaints.length > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Last: {userComplaints[0].date}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!u.isAdmin && (
                        <button 
                          onClick={() => handleToggleStatus(u.id, u.status || 'active')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'}`}
                        >
                          {isSuspended ? "Activate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
