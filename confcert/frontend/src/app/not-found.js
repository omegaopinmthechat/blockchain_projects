'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-linear-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-8">
          <FileQuestion className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-8xl font-bold text-white mb-4">
          404
        </h1>
        
        <h2 className="text-3xl font-semibold text-gray-300 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-400 mb-3 text-lg">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        
        <p className="text-gray-500 text-sm mb-10">
          It might have been moved or deleted.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
              <Home className="w-5 h-5" />
              Go Home
            </button>
          </Link>
          
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
        
        <p className="text-center text-gray-600 text-sm mt-8">
          Need help? Check our documentation or contact support.
        </p>
      </div>
    </div>
  );
}
