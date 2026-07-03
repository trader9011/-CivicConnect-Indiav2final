import { Link } from "react-router-dom";
import { Shield, ArrowRight, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-navy dark:bg-[#060a12] text-white pt-24 pb-12 font-ui border-t border-brand-navy/10 dark:border-white/5 relative overflow-hidden">
      {/* Premium background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-brand-royal/50 to-transparent"></div>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-royal/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 lg:gap-16 mb-16">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group inline-flex">
              <div className="bg-brand-royal text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-brand-royal/20">
                <Shield className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight">
                CivicConnect<span className="text-brand-royal">.</span>
              </span>
            </Link>
            <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md">
              A modern, independent civic-tech platform empowering citizens to build better communities through transparent, secure, and efficient public grievance management.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2.5 bg-white/5 hover:bg-brand-royal rounded-xl text-gray-400 hover:text-white transition-all shadow-sm">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 bg-white/5 hover:bg-brand-royal rounded-xl text-gray-400 hover:text-white transition-all shadow-sm">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 bg-white/5 hover:bg-brand-royal rounded-xl text-gray-400 hover:text-white transition-all shadow-sm">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li><Link to="/submit" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Submit Complaint</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Track Status</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link></li>
              <li><Link to="/disclaimer" className="hover:text-white transition-colors text-brand-royal">Disclaimer Notice</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-6">Contact</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li>
                <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Support</span>
                <span className="text-white">+91 8625039431</span>
              </li>
              <li>
                <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Nashik Police Official</span>
                <a href="mailto:cp.nashik@mahapolice.gov.in" className="hover:text-white transition-colors">cp.nashik@mahapolice.gov.in</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Emergency Section */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h4 className="font-heading font-bold text-red-400 text-lg mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Emergency Help
            </h4>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              If you are facing an emergency, immediately contact the nearest emergency service instead of waiting for an online complaint.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="tel:112" className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
              🚓 Police <span className="text-brand-saffron">112</span>
            </a>
            <a href="tel:108" className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
              🚑 Ambulance <span className="text-brand-saffron">108</span>
            </a>
            <a href="tel:101" className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
              🚒 Fire <span className="text-brand-saffron">101</span>
            </a>
            <a href="tel:0253-2305200" className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
              Nashik Police <span className="text-brand-saffron">0253-2305200</span>
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">
              © {new Date().getFullYear()} CivicConnect India. All rights reserved.
            </p>
            <p className="text-xs font-medium text-gray-600">
              Designed & Conceptualized by <span className="text-gray-400">Mr. Aniket Maval</span>
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl max-w-xl text-center lg:text-left">
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              <strong className="text-white">Independent Platform:</strong> CivicConnect India is an independent citizen service technology platform and is <span className="text-brand-saffron">not affiliated with, endorsed by, or operated by any government authority.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
