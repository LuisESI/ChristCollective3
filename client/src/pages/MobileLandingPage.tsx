import { useEffect } from "react";
import { useLocation } from "wouter";
import { isNativeApp } from "@/lib/platform";

export default function MobileLandingPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isNativeApp()) {
      setLocation("/feed");
    }
  }, [setLocation]);

  return null;
}
