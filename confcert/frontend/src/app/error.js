'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 via-orange-50 to-red-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-red-200">
          <div className="w-20 h-20 bg-linear-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-red-900 mb-3">
            Something went wrong!
          </h1>
          
          <p className="text-red-700 mb-2">
            {error.message || 'An unexpected error occurred'}
          </p>
          
          <p className="text-red-600 text-sm mb-8">
            Don't worry, you can try again or go back to the homepage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            
            <Link href="/">
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-400 text-red-700 hover:bg-red-50 font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </Link>
          </div>
        </div>
        
        <p className="text-center text-red-600 text-xs mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
