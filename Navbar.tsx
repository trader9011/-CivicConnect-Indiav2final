import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Menu, X, Sun, Moon, LogOut, LayoutDashboard, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../theme-provider";
import { useAuth } from "../AuthProvider";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileDropdownOpen(false);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Submit Complaint", path: "/submit" },
    { name: "Track Status", path: "/track" },
    { name: "How It Works", path: "/#how-it-works" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 font-ui ${
        isScrolled
          ? "glass shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-brand-royal text-white p-2 rounded-xl group-hover:bg-brand-navy dark:group-hover:bg-white dark:group-hover:text-brand-navy transition-colors duration-300 shadow-sm group-hover:shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-brand-navy dark:text-white">
              CivicConnect<span className="text-brand-royal">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold transition-colors hover:text-brand-royal ${
                  location.pathname === link.path
                    ? "text-brand-royal"
                    : "text-brand-navy/70 dark:text-white/70"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-muted-foreground"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 pr-3 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-royal flex items-center justify-center text-white font-bold overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userProfile?.fullName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-brand-navy dark:text-white max-w-[100px] truncate">
                    {userProfile?.fullName || 'User'}
                  </span>
                </button>
                
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-bold text-brand-navy dark:text-white truncate">{userProfile?.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                      </div>
                      <div className="p-2">
                        <Link 
                          to="/dashboard" 
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-navy dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        {userProfile?.isAdmin && (
                          <Link 
                            to="/admin" 
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-royal hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Shield className="w-4 h-4" /> Admin Console
                          </Link>
                        )}
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login?redirect=/admin"
                  className="text-sm font-bold text-muted-foreground hover:text-brand-royal dark:hover:text-brand-royal transition-colors hidden lg:block"
                >
                  Admin Login
                </Link>
                <div className="hidden lg:block w-px h-5 bg-gray-200 dark:bg-gray-800"></div>
                <Link
                  to="/login"
                  className="text-sm font-bold text-brand-navy dark:text-white hover:text-brand-royal dark:hover:text-brand-royal transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-navy hover:bg-brand-royal text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
             <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-muted-foreground"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-brand-navy dark:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 w-full glass-card border-t border-gray-200/20 dark:border-gray-800/20 overflow-hidden"
          >
            <nav className="flex flex-col gap-4 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold text-brand-navy dark:text-white"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
              
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5" /> Dashboard
                  </Link>
                  {userProfile?.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-bold text-brand-royal dark:text-brand-saffron flex items-center gap-2"
                    >
                      <Shield className="w-5 h-5" /> Admin Console
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-lg font-bold text-red-600 dark:text-red-400 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-bold text-brand-navy dark:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    to="/login?redirect=/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-bold text-brand-navy dark:text-white"
                  >
                    Admin Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-brand-royal text-white text-center text-lg font-bold px-5 py-3 rounded-xl mt-2"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
