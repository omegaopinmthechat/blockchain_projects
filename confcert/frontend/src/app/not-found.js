import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-blue-50 to-purple-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-purple-200">
          <div className="w-20 h-20 bg-linear-to-br from-purple-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold text-purple-900 mb-3">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-purple-800 mb-3">
            Page Not Found
          </h2>
          
          <p className="text-purple-700 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          
          <p className="text-purple-600 text-sm mb-8">
            It might have been moved or deleted.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-400 text-purple-700 hover:bg-purple-50 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>
        
        <p className="text-center text-purple-600 text-sm mt-4">
          Need help? Check our documentation or contact support.
        </p>
      </div>
    </div>
  );
}
