import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Footprints, 
  Flashlight, 
  Wind, 
  Hand, 
  RotateCcw, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  Flame, 
  Radio, 
  ChevronUp,
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

  const JOYSTICK_RADIUS = 54; // max distance stick can travel
  const SPRINT_THRESHOLD_RATIO = 0.78;

  // Look pad state
  const lookpadRef = useRef<HTMLDivElement | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef({ x: 0, y: 0 });
  const [isLooking, setIsLooking] = useState(false);

  // Smooth continuous turning via arrow buttons
  const turnRafRef = useRef<number | null>(null);
  const activeTurnDirRef = useRef<{ yaw: number; pitch: number } | null>(null);

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
    let angle = Math.atan2(dy, dx);

    if (dist > JOYSTICK_RADIUS) {
      clampedDist = JOYSTICK_RADIUS;
    }

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });

    // Output normalized coordinates: x (-1..1, right/left), y (-1..1, forward is negative z in three.js)
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

  // Lookpad touch handlers
  const handleLookStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (lookTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
    setIsLooking(true);
  };

  const handleLookMove = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };

        // Rotate camera head (sensitivity tuned for mobile touch screens)
        const sensitivity = 0.0038;
        onRotateCamera(dx * sensitivity, dy * sensitivity);
        break;
      }
    }
  }, [onRotateCamera]);

  const handleLookEnd = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        setIsLooking(false);
        break;
      }
    }
  }, []);

  // Window-level touchmove & touchend listeners so drag doesn't drop when finger leaves div
  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickMove, { passive: false });
    window.addEventListener('touchend', handleJoystickEnd, { passive: false });
    window.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    window.addEventListener('touchmove', handleLookMove, { passive: false });
    window.addEventListener('touchend', handleLookEnd, { passive: false });
    window.addEventListener('touchcancel', handleLookEnd, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
      window.removeEventListener('touchcancel', handleJoystickEnd);

      window.removeEventListener('touchmove', handleLookMove);
      window.removeEventListener('touchend', handleLookEnd);
      window.removeEventListener('touchcancel', handleLookEnd);
    };
  }, [handleJoystickMove, handleJoystickEnd, handleLookMove, handleLookEnd]);

  // Continuous smooth camera turn loop when holding arrow buttons
  const startContinuousTurn = (yawSpeed: number, pitchSpeed: number) => {
    activeTurnDirRef.current = { yaw: yawSpeed, pitch: pitchSpeed };
    if (!turnRafRef.current) {
      const loop = () => {
        if (activeTurnDirRef.current) {
          onRotateCamera(activeTurnDirRef.current.yaw, activeTurnDirRef.current.pitch);
          turnRafRef.current = requestAnimationFrame(loop);
        } else {
          turnRafRef.current = null;
        }
      };
      turnRafRef.current = requestAnimationFrame(loop);
    }
  };

  const stopContinuousTurn = () => {
    activeTurnDirRef.current = null;
    if (turnRafRef.current) {
      cancelAnimationFrame(turnRafRef.current);
      turnRafRef.current = null;
    }
  };

  const stickDist = Math.hypot(stickPos.x, stickPos.y);
  const isPushedToSprint = stickDist >= JOYSTICK_RADIUS * SPRINT_THRESHOLD_RATIO;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 touch-none">
      {/* 1. LEFT WIDGET: ANALOG MOVEMENT JOYSTICK */}
      <div className="absolute bottom-6 left-5 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          className={`relative w-36 h-36 rounded-full border-2 transition-colors flex items-center justify-center backdrop-blur-md shadow-2xl ${
            isPushedToSprint || isSprinting
              ? 'bg-amber-950/45 border-amber-500/80 shadow-amber-900/50'
              : isJoystickActive
              ? 'bg-zinc-900/70 border-cyan-500/60 shadow-cyan-950/40'
              : 'bg-black/55 border-zinc-700/60 hover:border-zinc-500'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Outer Sprint Ring Indicator */}
          <div
            className={`absolute inset-1.5 rounded-full border border-dashed transition-opacity ${
              isPushedToSprint || isSprinting
                ? 'border-amber-400 opacity-90 animate-pulse'
                : 'border-zinc-700/60 opacity-40'
            }`}
          />

          {/* Compass cross markings */}
          <div className="absolute top-1 text-[9px] font-mono tracking-widest text-zinc-400 font-bold uppercase pointer-events-none">
            {isPushedToSprint ? 'СПРИНТ' : 'ВПЕРЁД'}
          </div>
          <div className="absolute bottom-1 text-[9px] font-mono text-zinc-500 pointer-events-none">НАЗАД</div>
          <div className="absolute left-1.5 text-[9px] font-mono text-zinc-500 pointer-events-none">ВЛ</div>
          <div className="absolute right-1.5 text-[9px] font-mono text-zinc-500 pointer-events-none">ПР</div>

          {/* Center deadzone ring */}
          <div className="w-12 h-12 rounded-full border border-zinc-800/80 pointer-events-none" />

          {/* Moving Thumb Stick */}
          <div
            className={`absolute w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-2 transition-shadow pointer-events-none ${
              isPushedToSprint || isSprinting
                ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-zinc-950 shadow-amber-500/50 scale-105'
                : isJoystickActive
                ? 'bg-gradient-to-br from-cyan-600 to-zinc-800 border-cyan-300 text-white shadow-cyan-500/40'
                : 'bg-zinc-800/90 border-zinc-600 text-zinc-400'
            }`}
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
            }}
          >
            <Footprints className="w-5 h-5" />
          </div>
        </div>

        {/* Small Helper Badge */}
        <div className="mt-1.5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-zinc-800/60">
            {isPushedToSprint || isSprinting ? '⚡ БЕГ [СПРИНТ]' : 'ХОДЬБА (В КРАЙ = БЕГ)'}
          </span>
        </div>
      </div>

      {/* 2. RIGHT WIDGET: HEAD TURN / LOOKPAD & CAMERA ROTATION */}
      <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Quick Snap Turn and Smooth Arrows Bar */}
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-zinc-800/90 rounded-lg p-1 shadow-xl">
          <button
            onClick={() => onSnapRotate(90)}
            className="px-2.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 active:bg-red-950/70 border border-zinc-700 rounded text-[11px] font-mono text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
            title="Быстро повернуть голову влево на 90 градусов"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>90°Л</span>
          </button>

          {/* Smooth left turn button */}
          <button
            onMouseDown={() => startContinuousTurn(0.045, 0)}
            onMouseUp={stopContinuousTurn}
            onTouchStart={() => startContinuousTurn(0.045, 0)}
            onTouchEnd={stopContinuousTurn}
            onTouchCancel={stopContinuousTurn}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 active:bg-cyan-950 border border-zinc-700 rounded text-zinc-300 transition-colors"
            title="Зажмите для плавного поворота головы влево"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
          </button>

          {/* 180 Quick Turn (Turn Back) */}
          <button
            onClick={() => onSnapRotate(180)}
            className="px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900 active:bg-red-800 border border-red-700/80 rounded text-[11px] font-mono text-red-200 flex items-center gap-1 cursor-pointer font-bold transition-all shadow-md shadow-red-950/40"
            title="Резко обернуться назад на 180 градусов (быстрый побег)"
          >
            <span>180°</span>
          </button>

          {/* Smooth right turn button */}
          <button
            onMouseDown={() => startContinuousTurn(-0.045, 0)}
            onMouseUp={stopContinuousTurn}
            onTouchStart={() => startContinuousTurn(-0.045, 0)}
            onTouchEnd={stopContinuousTurn}
            onTouchCancel={stopContinuousTurn}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 active:bg-cyan-950 border border-zinc-700 rounded text-zinc-300 transition-colors"
            title="Зажмите для плавного поворота головы вправо"
          >
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => onSnapRotate(-90)}
            className="px-2.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 active:bg-red-950/70 border border-zinc-700 rounded text-[11px] font-mono text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
            title="Быстро повернуть голову вправо на 90 градусов"
          >
            <span>90°П</span>
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Look Touchpad Area */}
        <div
          ref={lookpadRef}
          onTouchStart={handleLookStart}
          className={`relative w-44 h-36 rounded-xl border-2 transition-all flex flex-col justify-between p-2.5 backdrop-blur-md shadow-2xl ${
            isLooking
              ? 'bg-zinc-900/75 border-cyan-400 shadow-cyan-950/50'
              : 'bg-black/60 border-zinc-700/70 hover:border-zinc-500'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Header prompt inside lookpad */}
          <div className="flex items-center justify-between pointer-events-none text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-1">
            <span className="flex items-center gap-1 text-cyan-300 font-semibold">
              <Radio className={`w-3 h-3 ${isLooking ? 'animate-pulse text-cyan-400' : ''}`} />
              ПОВОРОТ ГОЛОВЫ
            </span>
            <span className="text-[9px] text-zinc-500">СВАЙП</span>
          </div>

          {/* Center reticle and swipe guidance */}
          <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
            <div className={`w-6 h-6 rounded-full border border-dashed flex items-center justify-center ${
              isLooking ? 'border-cyan-400 scale-125' : 'border-zinc-600'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
            </div>
            <span className="text-[9px] font-mono text-zinc-500 mt-1.5 tracking-tight text-center">
              Води пальцем для обзора 360°
            </span>
          </div>

          {/* Vertical tilt helpers */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
            <button
              onMouseDown={() => startContinuousTurn(0, 0.035)}
              onMouseUp={stopContinuousTurn}
              onTouchStart={() => startContinuousTurn(0, 0.035)}
              onTouchEnd={stopContinuousTurn}
              onTouchCancel={stopContinuousTurn}
              className="px-2 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded text-[9px] font-mono text-zinc-300 flex items-center gap-1 pointer-events-auto"
              title="Взгляд вверх"
            >
              <ArrowUp className="w-3 h-3 text-zinc-400" />
              Вверх
            </button>
            <button
              onMouseDown={() => startContinuousTurn(0, -0.035)}
              onMouseUp={stopContinuousTurn}
              onTouchStart={() => startContinuousTurn(0, -0.035)}
              onTouchEnd={stopContinuousTurn}
              onTouchCancel={stopContinuousTurn}
              className="px-2 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded text-[9px] font-mono text-zinc-300 flex items-center gap-1 pointer-events-auto"
              title="Взгляд вниз"
            >
              <ArrowDown className="w-3 h-3 text-zinc-400" />
              Вниз
            </button>
          </div>
        </div>
      </div>

      {/* 3. CENTER-BOTTOM ACTION WIDGETS (Sprint, Interact, Flashlight, Breath, Crouch, Throw) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
        {/* INTERACT BUTTON: Primary large button */}
        <button
          onClick={onInteract}
          className={`h-14 px-4 rounded-xl border-2 flex items-center gap-2 transition-all cursor-pointer shadow-2xl font-bold uppercase tracking-wider text-xs active:scale-95 ${
            hasInteractPrompt
              ? 'bg-red-600 border-red-300 text-white animate-pulse shadow-red-700/60 ring-2 ring-red-500 scale-105'
              : 'bg-zinc-900/90 border-zinc-700 text-zinc-200 hover:border-zinc-500'
          }`}
          title="Открыть дверь, спрятаться в шкаф, взять предмет"
        >
          <Hand className={`w-5 h-5 ${hasInteractPrompt ? 'text-white animate-bounce' : 'text-zinc-400'}`} />
          <div className="text-left">
            <span className="block leading-none">{hasInteractPrompt ? 'ДЕЙСТВИЕ' : 'ОБЫСК [E]'}</span>
            {interactPromptText && (
              <span className="text-[9px] font-mono lowercase block text-red-200 truncate max-w-[100px] leading-tight">
                {interactPromptText}
              </span>
            )}
          </div>
        </button>

        {/* SPRINT TOGGLE / HOLD BUTTON */}
        <button
          onClick={onToggleSprint}
          onMouseDown={onSprintHoldStart}
          onMouseUp={onSprintHoldEnd}
          onTouchStart={onSprintHoldStart}
          onTouchEnd={onSprintHoldEnd}
          className={`h-14 px-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl ${
            isSprinting
              ? 'bg-amber-500 border-amber-200 text-zinc-950 font-black shadow-amber-500/50 scale-105 ring-2 ring-amber-400'
              : 'bg-zinc-900/85 border-zinc-700 text-zinc-300 hover:border-zinc-500'
          }`}
          title="Включить спринт / Быстрый бег"
        >
          <Footprints className={`w-4 h-4 ${isSprinting ? 'text-zinc-950 animate-bounce' : 'text-amber-400'}`} />
          <span className="text-[10px] font-mono font-bold uppercase mt-0.5 leading-none">
            {isSprinting ? 'БЕГ ВКЛ' : 'БЕГ'}
          </span>
        </button>

        {/* FLASHLIGHT BUTTON */}
        <button
          onClick={onToggleFlashlight}
          className={`h-14 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-colors cursor-pointer shadow-xl ${
            isFlashlightOn
              ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-amber-900/40'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
          }`}
          title="Включить / Выключить фонарик"
        >
          <Flashlight className={`w-4 h-4 ${isFlashlightOn ? 'text-amber-300' : 'text-zinc-500'}`} />
          <span className="text-[9px] font-mono uppercase mt-0.5 leading-none">
            {isFlashlightOn ? 'СВЕТ' : 'ВЫКЛ'}
          </span>
        </button>

        {/* HOLD BREATH BUTTON */}
        <button
          onMouseDown={onHoldBreathStart}
          onMouseUp={onHoldBreathEnd}
          onTouchStart={onHoldBreathStart}
          onTouchEnd={onHoldBreathEnd}
          className={`h-14 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl ${
            isHoldingBreath
              ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-cyan-900/50 scale-105'
              : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
          }`}
          title="Затаить дыхание при прятках в шкафу"
        >
          <Wind className={`w-4 h-4 ${isHoldingBreath ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
          <span className="text-[9px] font-mono uppercase mt-0.5 leading-none">
            {isHoldingBreath ? 'ТИШЕ!' : 'ВДОХ'}
          </span>
        </button>

        {/* CROUCH BUTTON */}
        <button
          onClick={onToggleCrouch}
          className={`h-14 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-colors cursor-pointer shadow-xl ${
            isCrouching
              ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200'
              : 'bg-zinc-900/80 border-zinc-700 text-zinc-400'
          }`}
          title="Присесть для бесшумного передвижения"
        >
          <ChevronUp className={`w-4 h-4 transition-transform ${isCrouching ? 'rotate-180 text-indigo-300' : 'text-zinc-400'}`} />
          <span className="text-[9px] font-mono uppercase mt-0.5 leading-none">
            {isCrouching ? 'СИДЯ' : 'СТОЯ'}
          </span>
        </button>

        {/* THROW ITEM BUTTON (if player has chemical flask) */}
        {canThrow && (
          <button
            onClick={onThrowItem}
            className="h-14 px-3.5 bg-red-950/90 hover:bg-red-900 border-2 border-red-500 rounded-xl flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xl shadow-red-950 text-red-200 animate-pulse"
            title="Бросить колбу для отвлечения монстра"
          >
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="text-[9px] font-mono font-bold uppercase mt-0.5 leading-none">
              БРОСОК
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
