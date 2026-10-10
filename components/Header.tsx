import React from 'react';
import { AUTHOR_INFO } from '../constants';
import AppLogo from './AppLogo';

interface HeaderProps {
  hasCustomKey?: boolean;
  onOpenSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ hasCustomKey = false, onOpenSettings }) => {
  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-xl sticky top-0 z-50 border-b border-blue-700/50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <AppLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold leading-tight tracking-tight uppercase text-white drop-shadow-sm">
                ỨNG DỤNG RA ĐỀ KIỂM TRA THEO CÔNG VĂN 7991
              </h1>
              <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GDPT 2018
              </span>
            </div>
            <p className="text-xs text-blue-200/90 font-medium flex items-center gap-2 mt-0.5">
              <span>Định dạng 3 dạng trắc nghiệm & tự luận</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-600/50 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-blue-100 font-medium">
              {hasCustomKey ? 'API Key riêng đã bật' : 'Chế độ: Sẵn sàng'}
            </span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition-colors"
              title="Cài đặt (Tuỳ chọn)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          <div className="hidden md:block text-right text-xs text-blue-200 border-l border-blue-700/60 pl-3">
             <p className="text-[10px] text-blue-300">Tác giả:</p>
             <p className="font-semibold text-white">{AUTHOR_INFO}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;