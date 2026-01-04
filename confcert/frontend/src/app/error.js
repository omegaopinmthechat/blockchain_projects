'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }) {
  const router = useRouter();
  
  useEffect(() => {
    console.error(error);
    
    // Check if it's a 404 error and redirect to not-found page
    if (error?.message?.includes('404') || 
        error?.message?.includes('Not Found') ||
        error?.digest?.includes('NEXT_NOT_FOUND')) {
      router.push('/not-found');
    }
  }, [error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-linear-to-br from-red-900 to-red-700 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">
          Something went wrong!
        </h1>
        
        <p className="text-red-400 mb-3 text-lg">
          {error.message || 'An unexpected error occurred'}
        </p>
        
        <p className="text-gray-500 text-sm mb-10">
          Don&apos;t worry, you can try again or go back to the homepage.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105">
              <Home className="w-5 h-5" />
              Go Home
            </button>
          </Link>
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-8">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
