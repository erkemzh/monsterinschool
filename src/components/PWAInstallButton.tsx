import React, { useState } from 'react';
import { Smartphone, Download, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed as standalone PWA app, show badge or hide
  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-700/60 rounded text-[10px] font-mono text-emerald-300">
        <Check className="w-3 h-3 text-emerald-400" />
        <span>УСТАНОВЛЕНО (PWA)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions fallback
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className="bg-gradient-to-r from-red-950/90 via-zinc-900/95 to-zinc-900/90 border border-red-800/80 rounded-xl p-3 shadow-2xl flex items-center justify-between gap-3 text-zinc-100">
          <div className="flex items-center gap-3">
            <img src="/pwa-192x192.png" alt="App Icon" className="w-11 h-11 rounded-lg border border-red-500/50 shadow-md object-cover shrink-0" />
            <div>
              <div className="font-bold text-xs tracking-wider uppercase text-red-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-red-400" />
                Играть как приложение
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Установите на телефон: работает без рамок браузера на весь экран
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950/60 transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalling ? 'Установка...' : 'Установить'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="px-2.5 py-1.5 bg-gradient-to-r from-red-900/90 to-zinc-900 hover:from-red-800 border border-red-600/80 rounded text-xs font-semibold uppercase tracking-wider text-red-200 hover:text-white flex items-center gap-1.5 transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          title="Установить игру как мобильное приложение (PWA)"
        >
          <Smartphone className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="hidden sm:inline">Приложение</span>
          <span className="sm:hidden">PWA</span>
        </button>
      )}

      {/* Mobile Installation Guide Modal (especially iOS Safari or manual guide) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border-2 border-red-800/80 p-5 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <img src="/pwa-192x192.png" alt="Icon" className="w-8 h-8 rounded-md border border-zinc-700 object-cover" />
                <h3 className="text-sm font-bold tracking-wider text-red-400 uppercase">
                  Установка на смартфон
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed">
                Чтобы запустить игру как отдельное полноэкранное мобильное приложение без рамок браузера:
              </p>

              {/* iOS Instructions */}
              <div className="p-3 bg-black/50 border border-zinc-800 rounded-lg space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  На iPhone / Safari:
                </div>
                <div className="flex items-start gap-2 pl-3">
                  <Share2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>1. Нажмите кнопку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх) внизу Safari.</span>
                </div>
                <div className="flex items-start gap-2 pl-3">
                  <PlusSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>2. Выберите пункт <strong>«На экран „Домой“»</strong>.</span>
                </div>
              </div>

              {/* Android Instructions */}
              <div className="p-3 bg-black/50 border border-zinc-800 rounded-lg space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  На Android / Chrome:
                </div>
                <p className="pl-3 leading-relaxed">
                  Нажмите на <strong>три точки</strong> меню браузера (справа вверху) и выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-200 tracking-wider uppercase transition cursor-pointer border border-zinc-700"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
};
