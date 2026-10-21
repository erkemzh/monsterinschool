import React, { useState } from 'react';
import { 
  Heart, 
  Volume2, 
  Zap, 
  Wind, 
  Flashlight, 
  BookOpen, 
  ShieldAlert, 
  Eye, 
  RotateCcw, 
  Hand,
  VolumeX,
  Compass,
  Footprints,
  Sun,
  Download,
  Smartphone,
  Activity
} from 'lucide-react';
import { PlayerStats, QuestState, GhostState } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';
import { MobileControls } from './MobileControls';
import { TelemetryTabModal } from './TelemetryTabModal';
import { PWAInstallButton } from './PWAInstallButton';

interface GameHUDProps {
  stats: PlayerStats;
  ghostState: GhostState;
  ghostDistance: number;
  quest: QuestState;
  interactPrompt: string | null;
  heldThrowable: string | null;
  notification: string | null;
  brightness: number;
  onSetBrightness: (val: number) => void;
  onToggleFlashlight: () => void;
  onToggleSprint?: () => void;
  onSprintHoldStart?: () => void;
  onSprintHoldEnd?: () => void;
  onHoldBreathStart: () => void;
  onHoldBreathEnd: () => void;
  onThrowItem: () => void;
  onInteract: () => void;
  onOpenGdd: () => void;
  onDownloadGame?: () => void;
  onRestart: () => void;
  isGameOver: boolean;
  isEscaped: boolean;
  onMove?: (x: number, y: number) => void;
  onRotateCamera?: (deltaYaw: number, deltaPitch: number) => void;
  onSnapRotate?: (degrees: number) => void;
  onToggleCrouch?: () => void;
  showMobileControls?: boolean;
  onToggleMobileControls?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  ghostState,
  ghostDistance,
  quest,
  interactPrompt,
  heldThrowable,
  notification,
  brightness,
  onSetBrightness,
  onToggleFlashlight,
  onToggleSprint,
  onSprintHoldStart,
  onSprintHoldEnd,
  onHoldBreathStart,
  onHoldBreathEnd,
  onThrowItem,
  onInteract,
  onOpenGdd,
  onDownloadGame,
  onRestart,
  isGameOver,
  isEscaped,
  onMove,
  onRotateCamera,
  onSnapRotate,
  onToggleCrouch,
  showMobileControls = false,
  onToggleMobileControls,
}) => {
  const [isMuted, setIsMuted] = useState(horrorAudio.getIsMuted());
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  const handleToggleMute = () => {
    const state = horrorAudio.toggleMute();
    setIsMuted(state);
  };

  const isHunt = ghostState === 'hunt';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Scanlines and film grain overlays */}
      <div className="absolute inset-0 scanlines opacity-60 pointer-events-none" />
      <div className="absolute inset-0 grain-overlay opacity-30 pointer-events-none" />

      {/* Hunt terror glitch effect */}
      {isHunt && (
        <div className="absolute inset-0 border-8 border-red-600/70 bg-red-950/20 hunt-glitch pointer-events-none transition-opacity duration-100" />
      )}

      {/* Sprint wind / rush edge overlay */}
      {stats.isSprinting && (
        <div className="absolute inset-0 border-4 border-amber-500/25 bg-black/10 pointer-events-none transition-opacity duration-150 animate-pulse" />
      )}

      {/* Closet Hiding View: narrow slats mask */}
      {stats.isHiding && (
        <div className="absolute inset-0 closet-mask pointer-events-none flex flex-col justify-between p-12">
          {/* Wooden cabinet frame bars */}
          <div className="w-full h-8 bg-black/90 border-b border-amber-950/40" />
          <div className="text-center py-2 bg-black/85 text-amber-400 font-mono text-xs uppercase tracking-widest border border-amber-950/60 rounded max-w-md mx-auto shadow-2xl">
            [ КАДР № 89 · ВЗГЛЯД СКВОЗЬ ЩЕЛИ ШКАФА · НЕ ДЫШИ ]
          </div>
          <div className="w-full h-8 bg-black/90 border-t border-amber-950/40" />
        </div>
      )}

      {/* Top Bar HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto gap-2">
        {/* Left: Quest Checklist (Compact on mobile) */}
        <div className="bg-black/75 backdrop-blur-md border border-zinc-800/80 rounded px-3 py-2 sm:px-4 sm:py-3 text-xs max-w-xs text-zinc-300 shadow-2xl hidden sm:block">
          <div className="flex items-center gap-2 font-cinzel text-red-400 font-bold tracking-wider uppercase mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>« АРХИВ 1974 · ПЕЧАТИ »</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className={`flex items-center justify-between ${quest.hasChalk ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span>1. Мел вызова (Литература)</span>
              <span>{quest.hasChalk ? 'НАЙДЕН' : '—'}</span>
            </div>
            <div className={`flex items-center justify-between ${quest.hasSalt ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span>2. Соль очищения (Химия)</span>
              <span>{quest.hasSalt ? 'НАЙДЕНА' : '—'}</span>
            </div>
            <div className={`flex items-center justify-between ${quest.hasKey ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span>3. Ключ директора (Библиотека)</span>
              <span>{quest.hasKey ? 'НАЙДЕН' : '—'}</span>
            </div>
            <div className={`flex items-center justify-between ${quest.hasBellHammer ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span>4. Боёк звонка (Котельная)</span>
              <span>{quest.hasBellHammer ? 'НАЙДЕН' : '—'}</span>
            </div>
            <div className={`flex items-center justify-between ${quest.isPowerRestored ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span>5. Рубильник котельной</span>
              <span>{quest.isPowerRestored ? 'ВКЛЮЧЕН' : 'ОТКЛ'}</span>
            </div>
            <div className={`flex items-center justify-between ${quest.isRitualCompleted ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span>6. Печать изгнания</span>
              <span>{quest.isRitualCompleted ? 'АКТИВНА' : '—'}</span>
            </div>
          </div>
        </div>

        {/* Center: Hunt Status Banner */}
        {isHunt && (
          <div className="animate-pulse bg-red-950/95 border-2 border-red-500 px-4 py-1.5 sm:px-6 sm:py-2.5 rounded text-center shadow-2xl shadow-red-950">
            <span className="font-cinzel text-red-300 text-xs sm:text-base font-black tracking-widest uppercase flex items-center gap-1.5 justify-center">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-spin" />
              « ТЕНЬ ПРОБУДИЛАСЬ! ОНА СЛЫШИТ ТЕБЯ! »
            </span>
          </div>
        )}

        {/* Right: Telemetry Tab, PWA Install, Brightness, Audio, GDD */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* TAB BUTTON: All Data (Air / Breath, Footsteps Noise, BPM, Battery, etc.) */}
          <button
            onClick={() => setIsTelemetryOpen(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-red-950/90 to-zinc-900 hover:from-red-900 border border-red-600/80 active:border-red-400 rounded text-xs font-semibold uppercase tracking-wider text-red-200 hover:text-white flex items-center gap-1.5 transition-all shadow-lg shadow-red-950/50 cursor-pointer"
            title="Открыть вкладку с датчиками: воздух, шум шагов, пульс, заряд батареи"
          >
            <Activity className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="font-mono font-bold">📊 ДАТЧИКИ</span>
            {(stats.breath < 30 || stats.noise > 60 || stats.battery < 20) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          {/* PWA Mobile App Install Button */}
          <PWAInstallButton />

          {/* Brightness / Gamma adjustment */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-black/60 border border-zinc-800 rounded text-xs text-zinc-300">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono text-zinc-400">Свет:</span>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.1"
              value={brightness}
              onChange={(e) => onSetBrightness(parseFloat(e.target.value))}
              className="w-14 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title="Регулировка яркости"
            />
          </div>

          <button
            onClick={handleToggleMute}
            className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded transition-colors"
            title="Звук"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {onToggleMobileControls && (
            <button
              onClick={onToggleMobileControls}
              className={`px-2 py-1.5 border rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
                showMobileControls
                  ? 'bg-amber-950/80 border-amber-500/90 text-amber-200 ring-1 ring-amber-500/50'
                  : 'bg-black/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
              title="Переключить мобильные виджеты (виртуальный джойстик, сенсорный обзор, кнопки)"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono">{showMobileControls ? 'ВИДЖЕТЫ: ВКЛ' : 'ВЫКЛ'}</span>
            </button>
          )}

          {onDownloadGame && (
            <button
              onClick={onDownloadGame}
              className="hidden lg:flex px-2 py-1.5 bg-black/60 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 rounded text-xs font-semibold uppercase tracking-wider items-center gap-1 transition-colors cursor-pointer"
              title="Скачать готовый автономный .html файл игры"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>HTML</span>
            </button>
          )}

          <button
            onClick={onOpenGdd}
            className="px-2.5 py-1.5 bg-black/60 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">GDD</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/85 border border-zinc-700/80 px-6 py-2 rounded shadow-2xl text-xs md:text-sm text-zinc-100 font-mono tracking-wide pointer-events-none transition-all">
          {notification}
        </div>
      )}

      {/* Reticle & Interaction Prompt in Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Reticle */}
        <div className={`w-2.5 h-2.5 rounded-full border border-white/60 transition-transform ${interactPrompt ? 'scale-150 bg-red-500 border-red-300' : 'bg-white/30'}`} />

        {/* Prompt tooltip */}
        {interactPrompt && (
          <div className="mt-4 px-4 py-1.5 bg-black/80 border border-zinc-600 rounded text-xs font-mono text-zinc-100 tracking-wider shadow-lg flex items-center gap-2 pointer-events-auto">
            <Hand className="w-3.5 h-3.5 text-red-400" />
            <span>{interactPrompt}</span>
          </div>
        )}
      </div>

      {/* Telemetry Tab Modal: Holds all data (Air / Breath, Steps Volume / Noise, BPM, Battery, Monster threat, Objectives) */}
      <TelemetryTabModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        stats={stats}
        ghostState={ghostState}
        ghostDistance={ghostDistance}
        quest={quest}
        onToggleFlashlight={onToggleFlashlight}
      />

      {/* Mobile On-Screen Widgets (Touch Joystick, Head Turn Lookpad, Snap Rotate, Mobile Actions) */}
      {showMobileControls && onMove && onRotateCamera && onSnapRotate && (
        <MobileControls
          onMove={onMove}
          onRotateCamera={onRotateCamera}
          onSnapRotate={onSnapRotate}
          onToggleFlashlight={onToggleFlashlight}
          onToggleSprint={onToggleSprint || (() => {})}
          onSprintHoldStart={onSprintHoldStart || (() => {})}
          onSprintHoldEnd={onSprintHoldEnd || (() => {})}
          onHoldBreathStart={onHoldBreathStart}
          onHoldBreathEnd={onHoldBreathEnd}
          onToggleCrouch={onToggleCrouch || (() => {})}
          onInteract={onInteract}
          onThrowItem={onThrowItem}
          isFlashlightOn={stats.isFlashlightOn}
          isSprinting={stats.isSprinting}
          isCrouching={stats.isCrouching}
          isHoldingBreath={stats.isHoldingBreath}
          canThrow={!!heldThrowable}
          hasInteractPrompt={!!interactPrompt}
          interactPromptText={interactPrompt}
        />
      )}

      {/* Bottom HUD: Status Bars & Quick Controls (Displayed on Desktop / when mobile widgets toggled off) */}
      {!showMobileControls && (
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-end md:items-center justify-between gap-4 pointer-events-auto">
          {/* Left: Vitals (Heart BPM, Breath, Noise, Flashlight) */}
          <div className="bg-black/75 backdrop-blur-md border border-zinc-800/80 rounded-lg p-3.5 flex items-center gap-5 text-xs shadow-2xl">
            {/* BPM */}
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 text-red-500 ${stats.bpm > 100 ? 'animate-heartbeat' : ''}`} />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Пульс</div>
                <div className="font-mono font-bold text-zinc-200 tabular-nums">
                  {stats.bpm} <span className="text-[10px] text-zinc-500 font-normal">BPM</span>
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-zinc-800" />

            {/* Noise Meter */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-mono mb-1">
                <span className="flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-amber-500" />
                  Шум
                </span>
                <span className="tabular-nums font-mono text-zinc-400">{Math.round(stats.noise)}%</span>
              </div>
              <div className="w-24 h-2 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-75 ${stats.noise > 60 ? 'bg-red-500' : stats.noise > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, stats.noise)}%` }}
                />
              </div>
            </div>

            <div className="w-px h-8 bg-zinc-800" />

            {/* Breath / Oxygen */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-mono mb-1">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  Воздух
                </span>
                <span className="tabular-nums font-mono text-zinc-400">{Math.round(stats.breath)}%</span>
              </div>
              <div className="w-24 h-2 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, stats.breath)}%` }}
                />
              </div>
            </div>

            <div className="w-px h-8 bg-zinc-800" />

            {/* Stamina / Sprint meter */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-mono mb-1">
                <span className="flex items-center gap-1">
                  <Footprints className={`w-3 h-3 ${stats.isSprinting ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
                  Выносливость
                </span>
                <span className="tabular-nums font-mono text-zinc-400">{Math.round(stats.stamina)}%</span>
              </div>
              <div className="w-24 h-2 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-75 ${
                    stats.isSprinting ? 'bg-amber-400 animate-pulse' : stats.stamina > 30 ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.min(100, stats.stamina)}%` }}
                />
              </div>
            </div>

            <div className="w-px h-8 bg-zinc-800" />

            {/* Battery */}
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${stats.battery > 20 ? 'text-amber-400' : 'text-red-500 animate-pulse'}`} />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Батарея</div>
                <div className="font-mono font-bold text-zinc-200 tabular-nums">
                  {Math.round(stats.battery)}%
                </div>
              </div>
            </div>
          </div>

          {/* Center / Right: Inventory & Action Triggers */}
          <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md border border-zinc-800/80 rounded-lg p-2 text-xs shadow-2xl">
            {/* Throwable item slot */}
            <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Предмет:</span>
              <span className="font-semibold text-zinc-200">
                {heldThrowable ? heldThrowable : 'Пусто'}
              </span>
            </div>

            {heldThrowable && (
              <button
                onClick={onThrowItem}
                className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-200 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Бросить [R]
              </button>
            )}

            {/* SPRINT BUTTON (Click/Touch or Key Shift/Q) */}
            <button
              onClick={onToggleSprint}
              onMouseDown={onSprintHoldStart}
              onMouseUp={onSprintHoldEnd}
              onTouchStart={onSprintHoldStart}
              onTouchEnd={onSprintHoldEnd}
              className={`px-3 py-1.5 border rounded font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                stats.isSprinting
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-lg shadow-amber-950/50 ring-1 ring-amber-400'
                  : stats.stamina < 10
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-500 opacity-60'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
              title="Зажмите Shift или нажмите Q для быстрого бега"
            >
              <Footprints className={`w-3.5 h-3.5 ${stats.isSprinting ? 'text-amber-400 animate-bounce' : 'text-zinc-400'}`} />
              <span>{stats.isSprinting ? 'Бег [АКТИВЕН]' : 'Бег [Shift / Q]'}</span>
            </button>

            <button
              onClick={onToggleFlashlight}
              className={`px-3 py-1.5 border rounded font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                stats.isFlashlightOn 
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-200' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <Flashlight className="w-3.5 h-3.5" />
              Фонарь [F]
            </button>

            <button
              onMouseDown={onHoldBreathStart}
              onMouseUp={onHoldBreathEnd}
              onTouchStart={onHoldBreathStart}
              onTouchEnd={onHoldBreathEnd}
              className={`px-3 py-1.5 border rounded font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                stats.isHoldingBreath
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              Затаить дыхание [Пробел]
            </button>

            <button
              onClick={onInteract}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded font-semibold text-xs transition-colors cursor-pointer"
            >
              Действие [E]
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn pointer-events-auto">
          <div className="w-20 h-20 rounded-full bg-red-950/60 border-2 border-red-600 flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-red-400 mb-2">[ ОБРЫВ КИНОПЛЁНКИ · 1989 ГОД ]</span>
          <h2 className="font-cinzel text-3xl md:text-5xl font-black text-red-600 tracking-wider uppercase mb-3">
            « ТЕНЬ ПОГЛОТИЛА ТЕБЯ »
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-md mb-8 leading-relaxed font-serif italic">
            «Твоё имя стёрто со страниц классного журнала. Твой шёпот навеки остался блуждать в безмолвных коридорах третьего флигеля...»
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Перемотать плёнку назад
            </button>
            <button
              onClick={onOpenGdd}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-red-400" />
              Досье Проекта GDD
            </button>
          </div>
        </div>
      )}

      {/* Escape Victory Screen */}
      {isEscaped && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn pointer-events-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center mb-6">
            <Eye className="w-10 h-10 text-emerald-400" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">[ ФИНАЛЬНЫЙ КАДР · РАССВЕТ ]</span>
          <h2 className="font-cinzel text-3xl md:text-5xl font-black text-emerald-400 tracking-wider uppercase mb-3">
            « ДВЕРИ РАСПАХНУЛИСЬ. ТЫ ЖИВ. »
          </h2>
          <p className="text-zinc-300 text-sm md:text-base max-w-lg mb-8 leading-relaxed font-serif italic">
            «Холодный рассветный туман коснулся твоего лица. Проклятие разрушено. Ты — единственный, кто вышел из этого флигеля живым.»
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Смотреть с начала
            </button>
            <button
              onClick={onOpenGdd}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-red-400" />
              Архив Проекта GDD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
