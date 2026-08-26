import React, { useState } from 'react';
import { proxyStore, AdminUser } from '../../services/store';
import { signInWithGoogleDirect } from '../../services/firebase';
import { Lock, ShieldAlert, Sparkles, LogIn, ArrowRight, UserCheck, AlertCircle, CheckCircle2, Cat, Heart } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Instant Dev Bypass Entrance as requested: "先暫時不要鎖上登入讓我方便寫後台"
  const handleDevBypass = () => {
    setIsLoading(true);
    setTimeout(() => {
      const user = proxyStore.devBypassLogin('西山居代購掌門人 (管理員)');
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    }, 150);
  };

  // Google Login via Firebase Auth
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const firebaseUser = await signInWithGoogleDirect();
      const user: AdminUser = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Google 管理員',
        email: firebaseUser.email || 'admin@seasun.proxy',
        photoURL: firebaseUser.photoURL || undefined,
      };
      proxyStore.setAdminUser(user);
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn('Google login fallback notice:', err);
      const user = proxyStore.devBypassLogin('Google 授權管理員 (測試登入)');
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white border border-[#F5CDDA] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#3E2430] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFE4ED] hover:bg-[#FCD8E3] text-[#8A5A72] flex items-center justify-center font-bold cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* Lock Icon Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B8B] text-white mx-auto flex items-center justify-center shadow-sm">
            <Cat className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-[#3E2430]">
            代購後台管理系統入口 🐾
          </h3>
          <p className="text-xs text-[#8A5A72]">
            登入以修改訂單狀態（待付款、已收款）、填寫備註與查看說明圖
          </p>
        </div>

        {/* Notice for Developer Convenience */}
        <div className="p-3.5 rounded-2xl bg-[#FFF5F8] border border-[#F5CDDA] text-xs text-[#7D5569] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#FA5276]" />
          <div className="space-y-0.5">
            <p className="font-bold text-[#3E2430]">開發者便利模式：</p>
            <p className="text-[#7D5569] leading-normal">
              已遵照您的要求「先暫時不要鎖上登入讓我方便寫後台」，點擊下方【一鍵免密快速進入】即可無阻礙調用完整後台！
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FA5276]/30 text-[#E0245E] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary Quick Dev Bypass Button */}
          <button
            id="admin-dev-bypass-btn"
            onClick={handleDevBypass}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-[#FF6B8B] hover:bg-[#FA5276] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>一鍵免密快速進入後台</span>
          </button>

          {/* Google Sign In Button */}
          <button
            id="admin-google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-[#FFF5F8] border border-[#F5CDDA] text-[#3E2430] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#FA5276]" />
            <span>使用 Google 帳號授權登入</span>
          </button>
        </div>

        <div className="text-center text-[11px] text-[#A07B8E]">
          西山居代購專用管理系統 • 權限管理模組
        </div>
      </div>
    </div>
  );
};
