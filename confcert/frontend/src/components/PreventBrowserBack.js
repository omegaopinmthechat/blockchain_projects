"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PreventBrowserBack({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Push current state to history
    window.history.pushState(null, '', pathname);

    const handlePopState = (event) => {
      // Prevent default back navigation
      event.preventDefault();
      
      // Push the current state again to prevent back navigation
      window.history.pushState(null, '', pathname);
      
      // Show alert to user
      alert('Please use the Back button on the page interface instead of the browser back button.');
    };

    // Listen for popstate event (triggered by browser back/forward buttons)
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);

  return <>{children}</>;
}
