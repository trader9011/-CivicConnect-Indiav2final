import { useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "motion/react";
import { useRef } from "react";

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ from, to, duration = 2, suffix = "", className = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView) {
      let startTime: number | null = null;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        // Easing out function
        const easeOutQuad = (t: number) => t * (2 - t);
        setCount(Math.floor(easeOutQuad(progress) * (to - from) + from));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setCount(to);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}
