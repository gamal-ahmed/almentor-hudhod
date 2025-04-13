
import { useEffect, useState } from "react";

// Reexport useIsMobile from use-mobile.tsx for backward compatibility
export { useIsMobile } from "./use-mobile";

// Also create a standalone hook for direct imports
export function useMobile() {
  return useIsMobile();
}
