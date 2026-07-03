import { motion } from "motion/react";
import { Map } from "lucide-react";
import ComplaintMap from "../ComplaintMap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { format, subDays, parseISO } from "date-fns";

export default function AdminOverview({ complaints, setActiveTab }: { complaints: any[], setActiveTab: any }) {
  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === "Submitted").length,
    underReview: complaints.filter(c => c.status === "Under Review").length,
    verified: complaints.filter(c => c.status === "Verified").length,
    forwarded: complaints.filter(c => c.status === "Forwarded to Department").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    closed: complaints.filter(c => c.status === "Closed").length,
    rejected: complaints.filter(c => c.status === "Rejected").length,
    today: complaints.filter(c => {
      const today = new Date().toISOString().split('T')[0];
      return c.date === today;
    }).length,
    activeUsers: complaints.reduce((acc, c) => {
      if (c.userId && !acc.includes(c.userId)) acc.push(c.userId);
      return acc;
    }, []).length, // Estimating active users by unique reporters
  };

  // Category Data
  const categoryCounts = complaints.reduce((acc: any, c: any) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.keys(categoryCounts).map(key => ({ name: key, count: categoryCounts[key] }));

  // Status Data
  const statusCounts = complaints.reduce((acc: any, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#EF4444', '#10B981'];

  // Trend Data (Last 7 days)
  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const displayStr = format(d, 'MMM dd');
    const count = complaints.filter(c => c.date === dateStr).length;
    return { name: displayStr, complaints: count };
  }).reverse();

  // Priority Analytics
  const getPriority = (c: any) => {
    const up = c.upvotes?.length || 0;
    const down = c.downvotes?.length || 0;
    const conf = (up + down) === 0 ? 0 : Math.round((up / (up + down)) * 100);
    if (conf >= 80 || up > 10) return "Critical";
    if (conf >= 50 || up > 5) return "High";
    if (up > 0) return "Medium";
    return "Low";
  };
  
  const priorityCounts = complaints.reduce((acc: any, c: any) => {
    const prio = getPriority(c);
    acc[prio] = (acc[prio] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.keys(priorityCounts).map(key => ({ name: key, value: priorityCounts[key] }));
  const PRIORITY_COLORS = { "Critical": "#ef4444", "High": "#f97316", "Medium": "#3b82f6", "Low": "#9ca3af" };

  // Department Performance (Resolutions by Dept)
  const departmentCounts = complaints.reduce((acc: any, c: any) => {
    if (c.department) {
      if (!acc[c.department]) acc[c.department] = { total: 0, resolved: 0 };
      acc[c.department].total += 1;
      if (c.status === "Resolved" || c.status === "Closed") {
        acc[c.department].resolved += 1;
      }
    }
    return acc;
  }, {});
  const departmentData = Object.keys(departmentCounts).map(key => ({ 
    name: key.length > 15 ? key.substring(0, 15) + "..." : key, 
    Resolved: departmentCounts[key].resolved,
    Pending: departmentCounts[key].total - departmentCounts[key].resolved
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Complaints", value: stats.total, color: "text-brand-navy dark:text-white" },
          { label: "Submitted", value: stats.submitted, color: "text-amber-500" },
          { label: "Under Review", value: stats.underReview, color: "text-amber-500" },
          { label: "Verified", value: stats.verified, color: "text-amber-600" },
          { label: "Forwarded", value: stats.forwarded, color: "text-blue-500" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, color: "text-emerald-500" },
          { label: "Closed", value: stats.closed, color: "text-emerald-600" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500" },
          { label: "Today's Complaints", value: stats.today, color: "text-purple-500" },
          { label: "Active Users", value: stats.activeUsers, color: "text-teal-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl">
            <p className="text-sm text-muted-foreground font-medium mb-2">{stat.label}</p>
            <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Complaints by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Complaint Trends (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="complaints" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Priority Analytics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(PRIORITY_COLORS as any)[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Department Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="Resolved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-brand-royal" /> Live Complaint Map
          </h2>
        </div>
        <div className="p-4 z-0 relative">
          <ComplaintMap complaints={complaints} zoom={4} center={[22.5937, 78.9629]} />
        </div>
      </div>
    </motion.div>
  );
}
