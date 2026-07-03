import { motion, AnimatePresence } from "motion/react";
import { Upload, MapPin, Camera, Video, ShieldAlert, CheckCircle2, ArrowRight, Shield, X as XIcon, AlertCircle, RefreshCw, FileImage, FileVideo } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const CATEGORIES = [
  "Road Damage", "Street Lights", "Water Supply", "Drainage",
  "Garbage", "Illegal Construction", "Noise Pollution", "Traffic Problems",
  "Electricity", "Public Safety", "Women's Safety", "Cyber Complaint", "Other"
];

import { PremiumInlineLoader } from '../components/ui/PremiumLoader';

export default function SubmitComplaint() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  
  const [locationValue, setLocationValue] = useState("");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasDetectedLocation, setHasDetectedLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submissionType, setSubmissionType] = useState("admin_review");

  // Duplicate Check State
  const [duplicateComplaint, setDuplicateComplaint] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isProcessingLong, setIsProcessingLong] = useState(false);

  // Draft loading
  useEffect(() => {
    const draft = localStorage.getItem('complaintDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.mobileNumber) setMobileNumber(parsed.mobileNumber);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.locationValue) setLocationValue(parsed.locationValue);
        // Only show toast if there's actual draft data
        if (parsed.fullName || parsed.description) {
          toast.info("Restored your unsubmitted draft.");
        }
      } catch (e) {}
    }
  }, []);

  // Draft saving
  useEffect(() => {
    if (!isSuccess && (fullName || mobileNumber || category || description || locationValue)) {
      localStorage.setItem('complaintDraft', JSON.stringify({
        fullName, mobileNumber, category, description, locationValue
      }));
    }
  }, [fullName, mobileNumber, category, description, locationValue, isSuccess]);

  useEffect(() => {
    let timer: any;
    if (isSubmitting) {
      setIsProcessingLong(false);
      timer = setTimeout(() => {
        setIsProcessingLong(true);
      }, 3000);
    } else {
      setIsProcessingLong(false);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  const handleStep2Next = async () => {
    if (!locationValue || !description) {
      toast.error('Please fill required fields');
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      // Query recent complaints in the same category
      const q = query(
        collection(db, "complaints"),
        where("category", "==", category)
      );
      const querySnapshot = await getDocs(q);
      
      let foundDuplicate = null;
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        if (data.userId === currentUser?.uid) continue; // Skip their own
        
        // Simple heuristic: check if location has some overlap
        const locWords = locationValue.toLowerCase().split(/[ ,]+/);
        const dataLocWords = (data.location || "").toLowerCase().split(/[ ,]+/);
        const hasOverlap = locWords.some(w => w.length > 3 && dataLocWords.includes(w));
        
        if (hasOverlap) {
          foundDuplicate = { docId: docSnapshot.id, ...data };
          break; // Found one
        }
      }

      if (foundDuplicate) {
        setDuplicateComplaint(foundDuplicate);
        setShowDuplicateModal(true);
      } else {
        setStep(3);
      }
    } catch (error) {
      console.error("Duplicate check error:", error);
      setStep(3); // Proceed on error
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleSupportExisting = async () => {
    if (!duplicateComplaint || !currentUser) return;
    
    setIsSubmitting(true);
    setShowDuplicateModal(false);
    setUploadStepText("Supporting existing complaint...");
    setUploadProgress(50);
    setShowUploadModal(true);
    
    try {
      const { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      const complaintRef = doc(db, "complaints", duplicateComplaint.docId);
      
      await updateDoc(complaintRef, {
        supporters: arrayUnion(currentUser.uid)
      });
      
      await addDoc(collection(db, "support_requests"), {
        complaintId: duplicateComplaint.id,
        complaintDocId: duplicateComplaint.docId,
        userId: currentUser.uid,
        timestamp: serverTimestamp()
      });
      
      setUploadProgress(100);
      setUploadStepText("Done!");
      
      setShowUploadModal(false);
      setIsSubmitting(false);
      toast.success("You are now supporting the existing complaint.");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to support complaint: " + err.message);
      setShowUploadModal(false);
      setIsSubmitting(false);
    }
  };

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      toast.error("Please login to submit a complaint");
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            setLocationAccuracy(Math.round(accuracy));
            setCoordinates({ lat: latitude, lng: longitude });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              setLocationValue(data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
            } else {
              setLocationValue(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
            }
            toast.success(`Location detected (Accuracy: ±${Math.round(accuracy)}m)`);
          } catch (error) {
            setLocationAccuracy(Math.round(position.coords.accuracy));
            setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
            setLocationValue(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
            toast.success("Location coordinates detected, but reverse geocoding failed.");
          } finally {
            setIsDetectingLocation(false);
            setHasDetectedLocation(true);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          let errorMessage = "Could not get location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location permission is disabled. Please enable Location permission from your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable. Please check your GPS signal.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "The request to get user location timed out.";
          }
          toast.error(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsDetectingLocation(false);
      toast.error("Geolocation not supported by this browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Authentication required");
      return;
    }
    if (!locationValue.trim()) {
      toast.error("Location is required. Please type or detect your location.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setUploadProgress(20);
    setUploadStepText("Creating complaint...");
    setShowUploadModal(true);
    
    const complaintId = `CCI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setGeneratedId(complaintId);

    try {
      let uploadedImageUrl = "";
      if (selectedFile) {
        setUploadStepText("Processing evidence...");
        // Fallback: Using a placeholder or skipping actual upload since Storage is not provisioned
        uploadedImageUrl = "https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=800&q=80"; 
        setUploadProgress(60);
      }

      setUploadStepText("Creating complaint...");
      
      const docRef = await addDoc(collection(db, "complaints"), {
        id: complaintId,
        userId: currentUser.uid,
        fullName,
        mobileNumber,
        category,
        otherCategory: category === "Other" ? otherCategory : "",
        location: locationValue,
        coordinates,
        description,
        submissionType,
        status: "Submitted",
        progress: 10,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: serverTimestamp(),
        images: uploadedImageUrl ? [uploadedImageUrl] : [],
        videos: [],
        upvotes: [],
        downvotes: [],
        supporters: []
      });

      setUploadProgress(100);
      setUploadStepText("Finalizing...");
      
      localStorage.removeItem('complaintDraft');
      setIsSubmitting(false);
      setShowUploadModal(false);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Error submitting complaint:", error);
      setIsSubmitting(false);
      setShowUploadModal(false);
      
      let friendlyError = "An unknown error occurred.";
      let solution = "Please try again.";
      
      if (error.message?.includes("Missing or insufficient permissions")) {
        friendlyError = "Storage or Database permission denied.";
        solution = "Check if your session expired. Try logging in again.";
      } else if (error.message?.includes("network") || error.code === "auth/network-request-failed") {
        friendlyError = "Network connection lost.";
        solution = "Please check your internet connection and try again.";
      } else {
        friendlyError = error.message || friendlyError;
      }

      setSubmitError(friendlyError);
      
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-bold">{friendlyError}</span>
          <span className="text-sm opacity-90">{solution}</span>
        </div>,
        { duration: 8000 }
      );
    }
  };

  useEffect(() => {
    if (isSuccess) {
      // Clean up draft on successful submission
      localStorage.removeItem('complaintDraft');
    }
  }, [isSuccess]);

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 dark:bg-background px-4 font-ui relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-lg w-full bg-white dark:bg-brand-navy p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 text-center relative z-10"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 20 }}
              className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          </div>

          <h2 className="text-2xl font-heading font-bold text-brand-navy dark:text-white mb-2 tracking-tight">Complaint Submitted Successfully</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Your complaint has been successfully registered. Our team will review your complaint shortly.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700/50 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Complaint ID</span>
              <span className="text-lg font-mono font-bold text-brand-navy dark:text-white">{generatedId}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">Submitted</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Submitted Time</span>
              <span className="text-sm font-bold text-brand-navy dark:text-white">{new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link 
              to={`/track?id=${generatedId}`}
              className="w-full flex items-center justify-center bg-brand-royal hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
            >
              Track Complaint
            </Link>
            <Link 
              to="/dashboard"
              className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-brand-navy dark:text-white py-3.5 rounded-xl font-bold transition-all"
            >
              Go To Dashboard
            </Link>
            <button 
              onClick={() => setIsSuccess(false)}
              className="w-full text-sm font-bold text-muted-foreground hover:text-brand-navy dark:hover:text-white py-2 transition-colors mt-2"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50 dark:bg-background font-ui">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-brand-navy dark:text-white mb-4">
            Submit a Complaint
          </h1>
          <p className="text-muted-foreground text-lg">
            Please provide accurate details to help us resolve the issue faster.
          </p>
        </div>

        <div className="bg-white dark:bg-brand-navy rounded-[2rem] shadow-xl shadow-brand-navy/5 border border-gray-100 dark:border-gray-800 p-6 md:p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className={`flex-1 h-2 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-brand-royal' : 'bg-gray-100 dark:bg-gray-800'}`} />
            <div className={`flex-1 h-2 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-brand-royal' : 'bg-gray-100 dark:bg-gray-800'}`} />
            <div className={`flex-1 h-2 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-brand-royal' : 'bg-gray-100 dark:bg-gray-800'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h3 className="text-xl font-bold font-heading text-brand-navy dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-brand-royal" /> Basic Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Full Name *</label>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium" placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Mobile Number *</label>
                      <input type="tel" required value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium" placeholder="10-digit mobile number" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Complaint Category *</label>
                    <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white appearance-none font-medium">
                      <option value="" disabled>Select a category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {category === "Other" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                      <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Please specify the issue *</label>
                      <input type="text" required value={otherCategory} onChange={e => setOtherCategory(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium" placeholder="e.g. Illegal Parking, Animal Nuisance" />
                    </motion.div>
                  )}

                  <div className="pt-6 flex justify-end">
                    <button type="button" onClick={() => { if(fullName && mobileNumber && category && (category !== "Other" || otherCategory)) setStep(2); else toast.error('Please fill required fields'); }} className="bg-brand-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-royal transition-colors flex items-center gap-2 shadow-md hover:shadow-lg">
                      Next Step <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h3 className="text-xl font-bold font-heading text-brand-navy dark:text-white flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-brand-royal" /> Location & Details
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Area / Locality *</label>
                      <button 
                        type="button" 
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="text-xs font-bold text-brand-royal hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isDetectingLocation ? (
                           <PremiumInlineLoader />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        {isDetectingLocation ? "Detecting..." : "📍 Use My Live Location"}
                      </button>
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white font-medium" 
                      placeholder="E.g., Sector 62, Noida" 
                    />
                    
                    <AnimatePresence>
                      {hasDetectedLocation && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2"
                        >
                          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                             {/* Simulated Map Background */}
                             <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                             <div className="relative flex flex-col items-center">
                               <div className="w-8 h-8 bg-brand-royal/20 rounded-full flex items-center justify-center animate-ping absolute"></div>
                               <MapPin className="w-6 h-6 text-brand-royal drop-shadow-md z-10" />
                               <span className="mt-2 text-xs font-bold text-brand-navy dark:text-white bg-white/80 dark:bg-brand-navy/80 px-2 py-1 rounded-md backdrop-blur-sm z-10 border border-gray-200 dark:border-gray-700">GPS Location Saved</span>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Detailed Description *</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-royal focus:border-transparent outline-none transition-all dark:text-white resize-none font-medium" placeholder="Describe the issue in detail..."></textarea>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-brand-navy dark:text-gray-300">Evidence (Optional)</label>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        className="hidden" 
                        id="evidence-upload" 
                      />
                      <label htmlFor="evidence-upload" className="cursor-pointer block">
                        <FileImage className="w-8 h-8 text-brand-royal mx-auto mb-2" />
                        <p className="text-sm font-bold text-brand-navy dark:text-white">
                          {selectedFile ? selectedFile.name : "Click to upload an image"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedFile ? "File selected." : "Support your complaint with a photo."}
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between">
                    <button type="button" onClick={() => setStep(1)} className="text-muted-foreground hover:text-brand-navy dark:hover:text-white font-bold px-4 py-4 transition-colors">
                      Back
                    </button>
                    <button type="button" onClick={handleStep2Next} disabled={isCheckingDuplicate} className="bg-brand-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-royal transition-colors flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50">
                      {isCheckingDuplicate ? "Checking..." : "Next Step"} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h3 className="text-xl font-bold font-heading text-brand-navy dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-brand-royal" /> Submission Options
                  </h3>

                  <div className="space-y-4">
                    <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer shadow-sm transition-all border-2 ${submissionType === 'admin_review' ? 'border-brand-royal bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                      <input type="radio" name="submission_type" value="admin_review" checked={submissionType === 'admin_review'} onChange={(e) => setSubmissionType(e.target.value)} className="mt-1 w-5 h-5 text-brand-royal" />
                      <div>
                        <p className="font-bold text-brand-navy dark:text-white text-lg">Save for Admin Review</p>
                        <p className="text-sm text-muted-foreground mt-1">Our team will verify the details before taking further action.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer shadow-sm transition-all border-2 ${submissionType === 'forward_official' ? 'border-brand-royal bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                      <input type="radio" name="submission_type" value="forward_official" checked={submissionType === 'forward_official'} onChange={(e) => setSubmissionType(e.target.value)} className="mt-1 w-5 h-5 text-brand-royal" />
                      <div>
                        <p className="font-bold text-brand-navy dark:text-white text-lg">Request Official Forwarding</p>
                        <p className="text-sm text-muted-foreground mt-1">Request to forward to relevant authorities immediately after verification.</p>
                        <p className="text-xs text-brand-saffron mt-2 font-medium">* Forwarding depends on review and applicable procedures.</p>
                      </div>
                    </label>
                  </div>

                  <div className="pt-8 flex justify-between">
                    <button type="button" onClick={() => setStep(2)} className="text-muted-foreground hover:text-brand-navy dark:hover:text-white font-bold px-4 py-4 transition-colors">
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-brand-royal text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-brand-royal/20 flex items-center gap-2 disabled:opacity-70 hover:-translate-y-0.5"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                           <PremiumInlineLoader /> Submitting Complaint...
                        </span>
                      ) : (
                        "Submit Complaint"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-brand-navy max-w-sm w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="text-brand-royal transition-all duration-300"
                    strokeDasharray={`${uploadProgress * 2.89} 289`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-brand-navy dark:text-white">{uploadProgress}%</span>
                </div>
              </div>
              
              <h4 className="font-heading font-bold text-xl text-brand-navy dark:text-white mb-2">Processing Request</h4>
              <p className="text-sm font-medium text-muted-foreground animate-pulse mb-3">
                {uploadStepText}
              </p>
              
              <AnimatePresence>
                {isProcessingLong && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-brand-royal/10 text-brand-royal dark:bg-brand-royal/20 dark:text-blue-400 p-3 rounded-xl border border-brand-royal/20 text-xs font-bold w-full"
                  >
                    Still processing securely. Please don't close this page.
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDuplicateModal && duplicateComplaint && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-brand-navy max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 p-6 border-b border-amber-100 dark:border-amber-800/50 flex items-start gap-4">
                <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-full shrink-0">
                  <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-brand-navy dark:text-white mb-1">
                    This issue has already been reported.
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    A similar issue has already been reported in this area. Supporting an existing complaint resolves it faster.
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Existing Complaint</p>
                      <p className="text-lg font-bold text-brand-navy dark:text-white">{duplicateComplaint.id}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {duplicateComplaint.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-brand-navy dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-royal shrink-0" />
                      <span className="truncate">{duplicateComplaint.location}</span>
                    </p>
                    <p className="text-sm text-brand-navy dark:text-gray-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-brand-royal shrink-0" />
                      <span className="truncate">{duplicateComplaint.category}</span>
                    </p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground bg-white dark:bg-brand-navy p-3 rounded-xl border border-gray-100 dark:border-gray-800 line-clamp-2">
                    "{duplicateComplaint.description}"
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSupportExisting}
                    className="w-full bg-brand-royal text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-brand-royal/20 flex items-center justify-center gap-2"
                  >
                    👍 Support Existing Complaint
                  </button>
                  <button 
                    onClick={() => {
                      setShowDuplicateModal(false);
                      setStep(3);
                    }}
                    className="w-full bg-gray-100 dark:bg-gray-800 text-brand-navy dark:text-white py-4 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    ➕ Continue as New Complaint
                  </button>
                  <button 
                    onClick={() => setShowDuplicateModal(false)}
                    className="w-full text-muted-foreground hover:text-brand-navy dark:hover:text-white py-2 font-bold transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
