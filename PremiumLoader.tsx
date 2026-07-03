import { motion } from "motion/react";

export function PremiumLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-royal border-r-brand-saffron shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-4 border-transparent border-b-brand-saffron border-l-emerald-500 opacity-70"
        />
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-5 bg-brand-royal rounded-full blur-[8px] opacity-40"
        />
      </div>
      <motion.p 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm font-semibold text-brand-navy dark:text-gray-300 tracking-wider uppercase"
      >
        {text}
      </motion.p>
    </div>
  );
}

export function PremiumInlineLoader() {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white/50"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-1 rounded-full border-[1.5px] border-transparent border-b-white/80 border-l-white/40"
      />
    </div>
  );
}

export function PremiumPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background z-50">
      <PremiumLoader text={text} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="w-full flex gap-4 items-center p-4">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
      </div>
      <div className="w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-brand-navy p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="w-20 h-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}
