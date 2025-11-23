import React from 'react';
import { AUTHOR_INFO } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Creative Logo LHH */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner border-2 border-blue-300">
            <span className="text-primary font-black text-xl tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>
              LHH
            </span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold leading-tight uppercase">ỨNG DỤNG RA ĐỀ KIỂM TRA THEO CÔNG VĂN 7991</h1>
            <p className="text-xs text-blue-200 opacity-90">Tự động hoá - Chuẩn sư phạm</p>
          </div>
        </div>
        <div className="hidden md:block text-right text-xs text-blue-100">
           <p>Bản quyền thuộc về:</p>
           <p className="font-semibold">{AUTHOR_INFO}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;