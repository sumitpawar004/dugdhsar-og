import React from 'react';
import { useRouter } from '../router/RouterContext';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-24 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-[#FAF6EE] p-10 rounded-3xl border border-[#D8C9AD] shadow-sm">
          <span className="text-6xl font-serif text-[#C2A36C] font-bold block mb-2">404</span>
          <h1 className="text-2xl font-serif text-[#263D30] font-semibold mb-3">
            Meadow Path Not Found
          </h1>
          <p className="text-xs text-[#302C26]/75 leading-relaxed mb-6">
            The page you requested may have moved or does not exist in our heritage dairy records.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-[#263D30] text-[#FAF6EE] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="bg-[#F8F4EC] text-[#263D30] border border-[#D8C9AD] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#FAF6EE]"
            >
              Explore Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
