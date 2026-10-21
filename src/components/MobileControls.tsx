import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Footprints, 
  Flashlight, 
  Wind, 
  Hand, 
  RotateCcw,
  ChevronDown,
  Bomb
} from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onRotateCamera: (deltaYaw: number, deltaPitch: number) => void;
  onSnapRotate: (degrees: number) => void;
  onToggleFlashlight: () => void;
  onToggleSprint: () => void;
  onSprintHoldStart: () => void;
  onSprintHoldEnd: () => void;
  onHoldBreathStart: () => void;
  onHoldBreathEnd: () => void;
  onToggleCrouch: () => void;
  onInteract: () => void;
  onThrowItem: () => void;
  isFlashlightOn: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isHoldingBreath: boolean;
  canThrow: boolean;
  hasInteractPrompt: boolean;
  interactPromptText?: string | null;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onRotateCamera,
  onSnapRotate,
  onToggleFlashlight,
  onToggleSprint,
  onSprintHoldStart,
  onSprintHoldEnd,
  onHoldBreathStart,
  onHoldBreathEnd,
  onToggleCrouch,
  onInteract,
  onThrowItem,
  isFlashlightOn,
  isSprinting,
  isCrouching,
  isHoldingBreath,
  canThrow,
  hasInteractPrompt,
  interactPromptText,
}) => {
  // Joystick state
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  const JOYSTICK_RADIUS = 52; // max distance stick can travel
  const SPRINT_THRESHOLD_RATIO = 0.8;

  // Sensory Direct-Touch Camera Look (No separate button!)
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef({ x: 0, y: 0 });
  const [touchLookFeedback, setTouchLookFeedback] = useState<{ x: number; y: number } | null>(null);

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (joystickTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsJoystickActive(true);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const updateJoystickPos = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - joystickCenterRef.current.x;
    const dy = clientY - joystickCenterRef.current.y;
    const dist = Math.hypot(dx, dy);

    let clampedDist = dist;
    const angle = Math.atan2(dy, dx);

    if (dist > JOYSTICK_RADIUS) {
      clampedDist = JOYSTICK_RADIUS;
    }

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });

    // Output normalized coordinates: x (-1..1, right/left), y (-1..1, forward/backward)
    const normalizedX = stickX / JOYSTICK_RADIUS;
    const normalizedY = stickY / JOYSTICK_RADIUS;
    onMove(normalizedX, normalizedY);
  }, [JOYSTICK_RADIUS, onMove]);

  const handleJoystickMove = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [updateJoystickPos]);

  const handleJoystickEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  }, [onMove]);

  // Direct Sensory Look (Touch anywhere on right half of screen without needing any button)
  const handleTouchLookStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (lookTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchLookFeedback({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchLookMove = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        setTouchLookFeedback({ x: touch.clientX, y: touch.clientY });

        // Natural smooth mobile touch camera rotation
        // dx turns yaw, dy turns pitch
        const sensitivity = 0.0036;
        onRotateCamera(dx * sensitivity, dy * sensitivity);
        break;
      }
    }
  }, [onRotateCamera]);

  const handleTouchLookEnd = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        setTouchLookFeedback(null);
        break;
      }
    }
  }, []);

  // Global touch listeners to prevent touch loss during swiping
  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickMove, { passive: false });
    window.addEventListener('touchend', handleJoystickEnd, { passive: false });
    window.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    window.addEventListener('touchmove', handleTouchLookMove, { passive: false });
    window.addEventListener('touchend', handleTouchLookEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchLookEnd, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
      window.removeEventListener('touchcancel', handleJoystickEnd);

      window.removeEventListener('touchmove', handleTouchLookMove);
      window.removeEventListener('touchend', handleTouchLookEnd);
      window.removeEventListener('touchcancel', handleTouchLookEnd);
    };
  }, [handleJoystickMove, handleJoystickEnd, handleTouchLookMove, handleTouchLookEnd]);

  const stickDist = Math.hypot(stickPos.x, stickPos.y);
  const isPushedToSprint = stickDist >= JOYSTICK_RADIUS * SPRINT_THRESHOLD_RATIO;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 touch-none">
      
      {/* 1. SEAMLESS SENSORY TOUCH-LOOK ZONE (Entire Right 65% of screen, No Buttons!) */}
      {/* User touches and drags anywhere on this area to rotate head naturally like in mobile FPS */}
      <div 
        onTouchStart={handleTouchLookStart}
        className="absolute top-0 right-0 bottom-0 w-[65%] pointer-events-auto cursor-grab active:cursor-grabbing z-10"
        style={{ touchAction: 'none' }}
      >
        {/* Subtle, unobtrusive touch feedback indicator under finger */}
        {touchLookFeedback && (
          <div 
            className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-75 z-40"
            style={{ left: touchLookFeedback.x, top: touchLookFeedback.y }}
          >
            <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-cyan-500/10 backdrop-blur-xs flex items-center justify-center animate-ping-once">
              <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-md shadow-cyan-400" />
            </div>
          </div>
        )}
      </div>

      {/* 2. LEFT: ANALOG MOVEMENT JOYSTICK */}
      <div className="absolute bottom-6 left-4 pointer-events-auto z-20">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          className={`relative w-34 h-34 rounded-full border-2 transition-colors flex items-center justify-center backdrop-blur-md shadow-2xl ${
            isPushedToSprint || isSprinting
              ? 'bg-amber-950/40 border-amber-500/80 shadow-amber-950/60'
              : isJoystickActive
              ? 'bg-zinc-900/60 border-cyan-500/60 shadow-cyan-950/50'
              : 'bg-black/50 border-zinc-700/60'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Outer Sprint Ring Indicator */}
          <div
            className={`absolute inset-1.5 rounded-full border border-dashed transition-opacity ${
              isPushedToSprint || isSprinting
                ? 'border-amber-400 opacity-90 animate-pulse'
                : 'border-zinc-700/40 opacity-30'
            }`}
          />

          {/* Compass markings */}
          <div className="absolute top-1 text-[8px] font-mono tracking-widest text-zinc-400 font-bold uppercase pointer-events-none">
            {isPushedToSprint ? 'БЕГ' : 'ВПЕРЁД'}
          </div>
          <div className="absolute bottom-1 text-[8px] font-mono text-zinc-600 pointer-events-none">НАЗАД</div>
          <div className="absolute left-1 text-[8px] font-mono text-zinc-600 pointer-events-none">ВЛ</div>
          <div className="absolute right-1 text-[8px] font-mono text-zinc-600 pointer-events-none">ПР</div>

          {/* Center deadzone */}
          <div className="w-10 h-10 rounded-full border border-zinc-800/80 pointer-events-none" />

          {/* Moving Thumb Stick */}
          <div
            className={`absolute w-13 h-13 rounded-full flex items-center justify-center shadow-xl border-2 transition-shadow pointer-events-none ${
              isPushedToSprint || isSprinting
                ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-zinc-950 shadow-amber-500/50 scale-105'
                : isJoystickActive
                ? 'bg-gradient-to-br from-cyan-600 to-zinc-800 border-cyan-300 text-white shadow-cyan-500/40'
                : 'bg-zinc-800/85 border-zinc-600 text-zinc-400'
            }`}
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
            }}
          >
            <Footprints className="w-5 h-5" />
          </div>
        </div>

        {/* Small Helper Badge */}
        <div className="mt-1 text-center pointer-events-none">
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded border border-zinc-800/60">
            {isPushedToSprint || isSprinting ? '⚡ СПРИНТ' : 'ХОДЬБА'}
          </span>
        </div>
      </div>

      {/* 3. RIGHT CORNER: COMPACT ACTION BUTTONS (Clean, no look buttons!) */}
      <div className="absolute bottom-6 right-4 flex flex-col items-end gap-2.5 pointer-events-auto z-20">
        
        {/* Quick Emergency 180 Turn (Compact panic button if running away) */}
        <button
          onClick={() => onSnapRotate(180)}
          className="px-2.5 py-1.5 bg-black/70 active:bg-red-950/80 hover:bg-zinc-900 border border-zinc-800 active:border-red-600 rounded-lg text-[10px] font-mono text-zinc-400 active:text-red-300 flex items-center gap-1 cursor-pointer transition shadow-md"
          title="Резко обернуться назад на 180 градусов"
        >
          <RotateCcw className="w-3 h-3 text-red-400" />
          <span>180° НАЗАД</span>
        </button>

        {/* Action Row */}
        <div className="flex items-center gap-2">
          
          {/* CROUCH BUTTON */}
          <button
            onClick={onToggleCrouch}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition cursor-pointer shadow-lg active:scale-95 ${
              isCrouching
                ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200'
                : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-400'
            }`}
            title="Присесть (бесшумно)"
          >
            <ChevronDown className={`w-4 h-4 ${isCrouching ? 'text-indigo-300' : 'text-zinc-400'}`} />
            <span className="text-[8px] font-mono uppercase font-bold mt-0.5 leading-none">
              {isCrouching ? 'СИДЯ' : 'ПРИСЕД'}
            </span>
          </button>

          {/* HOLD BREATH BUTTON */}
          <button
            onMouseDown={onHoldBreathStart}
            onMouseUp={onHoldBreathEnd}
            onTouchStart={onHoldBreathStart}
            onTouchEnd={onHoldBreathEnd}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition cursor-pointer shadow-lg active:scale-95 ${
              isHoldingBreath
                ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-cyan-900/50 scale-105'
                : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300'
            }`}
            title="Затаить дыхание при прятках в шкафу"
          >
            <Wind className={`w-4 h-4 ${isHoldingBreath ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
            <span className="text-[8px] font-mono uppercase font-bold mt-0.5 leading-none">
              {isHoldingBreath ? 'ТИШЕ!' : 'ВДОХ'}
            </span>
          </button>

          {/* FLASHLIGHT BUTTON */}
          <button
            onClick={onToggleFlashlight}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition cursor-pointer shadow-lg active:scale-95 ${
              isFlashlightOn
                ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-amber-900/40'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
            }`}
            title="Включить / Выключить фонарик"
          >
            <Flashlight className={`w-4 h-4 ${isFlashlightOn ? 'text-amber-300' : 'text-zinc-500'}`} />
            <span className="text-[8px] font-mono uppercase font-bold mt-0.5 leading-none">
              {isFlashlightOn ? 'СВЕТ' : 'ВЫКЛ'}
            </span>
          </button>

          {/* SPRINT BUTTON */}
          <button
            onClick={onToggleSprint}
            onMouseDown={onSprintHoldStart}
            onMouseUp={onSprintHoldEnd}
            onTouchStart={onSprintHoldStart}
            onTouchEnd={onSprintHoldEnd}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition cursor-pointer shadow-lg active:scale-95 ${
              isSprinting
                ? 'bg-amber-500 border-amber-200 text-zinc-950 font-black shadow-amber-500/50 scale-105'
                : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300'
            }`}
            title="Спринт / Быстрый бег"
          >
            <Footprints className={`w-4 h-4 ${isSprinting ? 'text-zinc-950' : 'text-amber-400'}`} />
            <span className="text-[8px] font-mono uppercase font-bold mt-0.5 leading-none">
              {isSprinting ? 'БЕГ!' : 'БЕГ'}
            </span>
          </button>

          {/* THROW BOMB (if available) */}
          {canThrow && (
            <button
              onClick={onThrowItem}
              className="w-12 h-12 bg-red-950/90 hover:bg-red-900 border-2 border-red-500 rounded-xl flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-xl text-red-200 animate-pulse"
              title="Бросить колбу"
            >
              <Bomb className="w-4 h-4 text-red-400" />
              <span className="text-[8px] font-mono uppercase font-bold mt-0.5 leading-none">БРОСОК</span>
            </button>
          )}

          {/* PRIMARY ACTION / INTERACT BUTTON [E] */}
          <button
            onClick={onInteract}
            className={`h-12 px-3.5 rounded-xl border-2 flex items-center gap-1.5 transition-all cursor-pointer shadow-xl font-bold uppercase tracking-wider text-xs active:scale-95 ${
              hasInteractPrompt
                ? 'bg-red-600 border-red-300 text-white animate-pulse shadow-red-700/60 ring-2 ring-red-500 scale-105'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
            }`}
            title="Открыть дверь, спрятаться в шкаф, взять предмет"
          >
            <Hand className={`w-4 h-4 ${hasInteractPrompt ? 'text-white animate-bounce' : 'text-zinc-400'}`} />
            <div className="text-left">
              <span className="block text-[11px] leading-tight">{hasInteractPrompt ? 'ДЕЙСТВИЕ' : 'ОБЫСК'}</span>
              {interactPromptText && (
                <span className="text-[8px] font-mono text-red-200 block truncate max-w-[85px] leading-none">
                  {interactPromptText}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Screen swipe hint (Subtle small hint in top center, fades out) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 hover:opacity-70 transition-opacity">
        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 bg-black/50 px-2 py-0.5 rounded-full border border-zinc-800">
          Сенсорный обзор: касайся и веди по экрану
        </span>
      </div>

    </div>
  );
};
