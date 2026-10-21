import React from 'react';
import { 
  Heart, 
  Wind, 
  Footprints, 
  Zap, 
  Flashlight, 
  AlertTriangle, 
  Compass, 
  Key, 
  X, 
  Activity, 
  Radio, 
  ShieldAlert, 
  Volume2, 
  Battery, 
  Smartphone
} from 'lucide-react';
import { PlayerStats, QuestState, GhostState } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface TelemetryTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  ghostState: GhostState;
  ghostDistance: number;
  quest: QuestState;
  onToggleFlashlight: () => void;
}

export const TelemetryTabModal: React.FC<TelemetryTabModalProps> = ({
  isOpen,
  onClose,
  stats,
  ghostState,
  ghostDistance,
  quest,
  onToggleFlashlight,
}) => {
  if (!isOpen) return null;

  // Derive noise description
  const getNoiseLabel = (noise: number) => {
    if (noise < 15) return { text: 'БЕСШУМНО (Присед)', color: 'text-emerald-400', badge: 'bg-emerald-950 border-emerald-700' };
    if (noise < 40) return { text: 'УМЕРЕННЫЙ ШАГ', color: 'text-amber-400', badge: 'bg-amber-950 border-amber-700' };
    return { text: 'ГРОМКИЙ БЕГ (Монстр слышит!)', color: 'text-red-400', badge: 'bg-red-950 border-red-700' };
  };

  // Derive breath description
  const getBreathLabel = (breath: number, isHolding: boolean) => {
    if (isHolding) {
      if (breath < 25) return { text: 'КРИТИЧЕСКИЙ ВДОХ! ЗАДЫХАЕШЬСЯ!', color: 'text-red-400', alert: true };
      return { text: 'ЗАДЕРЖКА ДЫХАНИЯ (Скрытно в шкафу)', color: 'text-cyan-400', alert: false };
    }
    return { text: 'Нормальное дыхание', color: 'text-zinc-300', alert: false };
  };

  // Derive ghost alert
  const getGhostThreat = (state: GhostState, dist: number) => {
    if (dist < 8) return { label: 'КРИТИЧЕСКАЯ БЛИЗОСТЬ! ОН РЯДОМ!', color: 'text-red-500 animate-pulse', bg: 'bg-red-950/80 border-red-500' };
    if (state === 'hunt') return { label: 'ОХОТА! МОНСТР БЕЖИТ НА ТЕБЯ!', color: 'text-red-400', bg: 'bg-red-950/60 border-red-700' };
    if (state === 'investigating' || state === 'stalking') return { label: 'ПОИСК: Изучает коридор по шуму', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-700' };
    return { label: 'ПАТРУЛЬ: Бродит в отдалении', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800' };
  };

  const getCurrentObjective = (q: QuestState) => {
    if (!q.hasChalk) return '1. Найти оккультный мел в Кабинете Литературы (1 этаж)';
    if (!q.hasSalt) return '2. Найти соль очищения в Кабинете Химии (1 этаж)';
    if (!q.hasMasterKey && !q.hasKey) return '3. Подняться на 2-й этаж и найти сторожа дядю Мишу в Архиве';
    if (!q.hasKey) return '4. Открыть бронированный сейф в Кабинете Директора (2 этаж)';
    if (!q.hasBellHammer) return '5. Найти боёк пожарного звонка в Котельной (1 этаж)';
    if (!q.isPowerRestored) return '6. Включить главный рубильник электрощитка (1 этаж)';
    if (!q.isRitualCompleted) return '7. Активировать печать изгнания в пентаграмме';
    return '8. Главный выход отперт! Беги к выходу!';
  };

  const noiseInfo = getNoiseLabel(stats.noise);
  const breathInfo = getBreathLabel(stats.breath, stats.isHoldingBreath);
  const ghostThreat = getGhostThreat(ghostState, ghostDistance);
  const currentObjective = getCurrentObjective(quest);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md pointer-events-auto animate-fade-in select-none">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-950 border-2 border-red-900/90 rounded-2xl shadow-2xl shadow-red-950/60 overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-900/60 border border-red-500/60 flex items-center justify-center shadow">
              <Activity className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono tracking-wider text-red-300 uppercase flex items-center gap-1.5">
                <span>ВКЛАДКА: ДАТЧИКИ И КАРТА</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                  {quest.currentFloor === 2 ? '2 ЭТАЖ' : '1 ЭТАЖ'}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {quest.currentFloor === 2 ? 'Учебный корпус (Архив, Директор, Радиоузел, Медпункт)' : 'Нижний сектор (Литература, Химия, Библиотека, Котельная)'}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-red-950/80 active:bg-red-900 border border-zinc-700 hover:border-red-600 rounded-lg text-xs font-bold font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
            <span>В ИГРУ</span>
          </button>
        </div>

        {/* Content Body (Scrollable if needed on small phones) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-mono">
          
          {/* 1. ВОЗДУХ И ЗАДЕРЖКА ДЫХАНИЯ */}
          <div className={`p-3 rounded-xl border ${breathInfo.alert ? 'bg-red-950/50 border-red-600 animate-pulse' : 'bg-zinc-900/80 border-zinc-800'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>ЗАПАС ВОЗДУХА (ДЫХАНИЕ)</span>
              </div>
              <span className="text-sm font-bold text-cyan-300 tabular-nums">
                {Math.round(stats.breath)}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${stats.breath < 25 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-cyan-600 to-cyan-400'}`}
                style={{ width: `${Math.min(100, Math.max(0, stats.breath))}%` }}
              />
            </div>
            
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className={breathInfo.color}>{breathInfo.text}</span>
              <span className="text-zinc-500 text-[10px]">Кнопка [ВДОХ / ТИШЕ]</span>
            </div>
          </div>

          {/* 2. ГРОМКОСТЬ ШАГОВ (ШУМОМЕР) */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Footprints className="w-4 h-4 text-amber-400" />
                <span>ШУМОМЕР ШАГОВ (ГРОМКОСТЬ)</span>
              </div>
              <span className="text-sm font-bold text-amber-300 tabular-nums">
                {Math.round(stats.noise)}%
              </span>
            </div>

            {/* Noise bar with danger gradient */}
            <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-150 ${
                  stats.noise > 60 
                    ? 'bg-gradient-to-r from-amber-500 to-red-500 animate-pulse' 
                    : stats.noise > 30 
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, stats.noise))}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className={noiseInfo.color}>{noiseInfo.text}</span>
              <span className="text-zinc-500 text-[10px]">Присед снижает шум до 0%</span>
            </div>
          </div>

          {/* 3. ПУЛЬС И ВЫНОСЛИВОСТЬ (Два блока в ряд) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Пульс */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-red-400 font-bold">
                  <Heart className={`w-3.5 h-3.5 ${stats.bpm > 110 ? 'animate-heartbeat text-red-500' : ''}`} />
                  <span>ПУЛЬС (BPM)</span>
                </div>
              </div>
              <div className="text-2xl font-black text-red-400 tabular-nums my-0.5">
                {stats.bpm} <span className="text-xs font-normal text-zinc-500">уд/мин</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                {stats.bpm > 120 ? 'Смертельный страх!' : stats.bpm > 90 ? 'Учащённый пульс' : 'Спокойное состояние'}
              </p>
            </div>

            {/* Выносливость */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ВЫНОСЛИВОСТЬ</span>
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-400 tabular-nums my-0.5">
                {Math.round(stats.stamina)}%
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                {stats.isSprinting ? 'Расход на спринт...' : 'Восстанавливается шагом'}
              </p>
            </div>
          </div>

          {/* 4. ФОНАРИК И ЗАРЯД БАТАРЕИ */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg border ${stats.isFlashlightOn ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>
                <Flashlight className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-zinc-200">
                  Фонарик: {stats.isFlashlightOn ? 'ВКЛЮЧЁН' : 'ВЫКЛЮЧЕН'}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Заряд батареи: <span className="text-amber-400 font-bold">{Math.round(stats.battery)}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={onToggleFlashlight}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                stats.isFlashlightOn 
                  ? 'bg-amber-500 text-zinc-950 border-amber-300 hover:bg-amber-400' 
                  : 'bg-zinc-800 text-zinc-300 border-zinc-600 hover:bg-zinc-700'
              }`}
            >
              {stats.isFlashlightOn ? 'Выключить' : 'Включить'}
            </button>
          </div>

          {/* 5. СЕНСОР МОНСТРА (УГРОЗА) */}
          <div className={`p-3 rounded-xl border ${ghostThreat.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 font-bold text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>ДЕТЕКТОР АНОМАЛИИ</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Дистанция: ~{Math.round(ghostDistance)}м
              </span>
            </div>
            <div className={`text-xs font-bold ${ghostThreat.color}`}>
              {ghostThreat.label}
            </div>
          </div>

          {/* 6. ТЕКУЩИЕ ЦЕЛИ И ИНВЕНТАРЬ */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-300 font-bold mb-1.5">
              <Compass className="w-4 h-4 text-red-400" />
              <span>ТЕКУЩАЯ ЦЕЛЬ КВЕСТА:</span>
            </div>
            <div className="text-xs text-red-200 bg-black/60 p-2.5 rounded-lg border border-red-950">
              {currentObjective}
            </div>
          </div>

          {/* 7. PWA МОБИЛЬНОЕ ПРИЛОЖЕНИЕ (Установка) */}
          <div className="pt-1">
            <PWAInstallButton variant="banner" />
          </div>
        </div>

        {/* Footer Button: Return to Game */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:scale-[0.99] text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-950 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>ЗАКРЫТЬ ВКЛАДКУ И ПРОДОЛЖИТЬ ИГРУ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
