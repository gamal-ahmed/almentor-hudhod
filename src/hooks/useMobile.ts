
import { useEffect, useState } from "react";

// Create a standalone hook for direct imports
export function useMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    const MOBILE_BREAKPOINT = 768;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);
  
  return !!isMobile;
}

// Re-export useIsMobile for backward compatibility
export { useIsMobile } from "./use-mobile";
