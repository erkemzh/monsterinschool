/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ForgottenWingEngine } from './game/threeEngine';
import { GameHUD } from './components/GameHUD';
import { GddDossier } from './components/GddDossier';
import { PlayerStats, QuestState, GhostState } from './types/game';
import { horrorAudio } from './audio/horrorAudio';
import { Play, BookOpen, Volume2, Shield, Eye, Flame, Download } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'intro' | 'game' | 'gdd'>('intro');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ForgottenWingEngine | null>(null);

  // Stats & State
  const [stats, setStats] = useState<PlayerStats>({
    sanity: 100,
    stamina: 100,
    breath: 100,
    noise: 0,
    battery: 95,
    isFlashlightOn: true,
    isSprinting: false,
    isCrouching: false,
    isHoldingBreath: false,
    isHiding: false,
    bpm: 72,
  });

  const [ghostState, setGhostState] = useState<GhostState>('wandering');
  const [ghostDistance, setGhostDistance] = useState(25);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [heldThrowable, setHeldThrowable] = useState<string | null>('Химическая колба (стекло)');
  const [notification, setNotification] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isEscaped, setIsEscaped] = useState(false);
  const [brightness, setBrightness] = useState(1.4);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 1024
      );
    }
    return false;
  });

  const [quest, setQuest] = useState<QuestState>({
    hasChalk: false,
    hasSalt: false,
    hasKey: false,
    hasBellHammer: false,
    isPowerRestored: false,
    isRitualCompleted: false,
    canEscape: false,
  });

  const notificationTimeoutRef = useRef<number | null>(null);

  const showNotification = (text: string) => {
    setNotification(text);
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3800);
  };

  const startNewGame = () => {
    setIsGameOver(false);
    setIsEscaped(false);
    setViewMode('game');
    horrorAudio.init();
    horrorAudio.resume();
  };

  const downloadGameFile = () => {
    const link = document.createElement('a');
    link.href = '/the_forgotten_wing_game.html';
    link.download = 'the_forgotten_wing_game.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('« ФАЙЛ ИГРЫ СКАЧАН: the_forgotten_wing_game.html · ОТКРЫВАЕТСЯ В ЛЮБОМ БРАУЗЕРЕ »');
  };

  // Initialize Three.js engine when in 'game' mode
  useEffect(() => {
    if (viewMode !== 'game' || !containerRef.current) return;

    const engine = new ForgottenWingEngine(containerRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onGhostStateChange: (state, dist) => {
        setGhostState(state);
        setGhostDistance(dist);
      },
      onInteractPrompt: (prompt) => {
        setInteractPrompt(prompt);
      },
      onQuestUpdate: (newQuest) => {
        setQuest(newQuest);
      },
      onInventoryUpdate: (throwable) => {
        setHeldThrowable(throwable);
      },
      onGameOver: (escaped) => {
        if (escaped) {
          setIsEscaped(true);
        } else {
          setIsGameOver(true);
        }
      },
      onNotification: (text) => {
        showNotification(text);
      },
    });

    engineRef.current = engine;

    showNotification('[ НОЯБРЬ 1989 · ТРЕТИЙ ФЛИГЕЛЬ · ТЫ ОДИН ВО ТЬМЕ ]');

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [viewMode]);

  return (
    <div className="relative w-screen h-screen bg-zinc-950 overflow-hidden font-sans text-zinc-100 select-none">
      {/* 1. Intro Screen */}
      {viewMode === 'intro' && (
        <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 z-20 overflow-y-auto">
          {/* Background art backdrop */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none scale-105"
            style={{ backgroundImage: `url('/src/assets/images/abandoned_classroom_1791380679853.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-black/60 pointer-events-none" />
          <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />

          {/* Top Brand Bar */}
          <header className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-xl md:text-2xl font-bold tracking-wider text-red-500 uppercase">
                Проклятый Флигель
              </span>
              <span className="text-xs text-zinc-500 font-mono hidden sm:inline">· The Forgotten Wing</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadGameFile}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-2 transition-colors cursor-pointer"
                title="Скачать всю игру в виде одного автономного HTML-файла"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Скачать Игру (.html)
              </button>
              <button
                onClick={() => setViewMode('gdd')}
                className="px-4 py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-red-400" />
                Полный GDD Документ
              </button>
            </div>
          </header>

          {/* Main Hero Story */}
          <div className="relative z-10 max-w-2xl my-auto py-8">
            <div className="flex items-center gap-2 text-red-500 font-mono text-xs uppercase tracking-widest mb-3">
              <Flame className="w-4 h-4" />
              <span>Survival Horror Prototype · WebGL 3D</span>
            </div>
            <h1 className="font-cinzel text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-6">
              Тьма заперла тебя в школе.
            </h1>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
              Буллеры заманили тебя в заброшенный флигель и провели ритуал призыва. Сущность пробудилась и растерзала их за запертой дверью. Теперь ты один в кромешной тьме. 
            </p>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mb-8">
              Призрак не следует скриптам — он слышит твои шаги, проверяет шкафы и разбивает двери. Бросай колбы для отвлечения, прячься в шкафы и затаи дыхание, пока он проходит мимо.
            </p>

            {/* Controls Overview Card */}
            <div className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-lg p-4 mb-4 text-xs text-zinc-300 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <span className="text-zinc-500 block font-mono">Движение</span>
                <span className="font-semibold text-zinc-200">WASD / Стрелки</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-600/40 rounded p-1.5 -m-1">
                <span className="text-amber-400 block font-mono font-bold">Бег / Спринт</span>
                <span className="font-bold text-amber-200">[Shift] зажать · [Q] вкл</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-mono">Фонарик / Присед</span>
                <span className="font-semibold text-zinc-200">[F] Фонарь · [C] Сесть</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-mono">Действие / Шкаф</span>
                <span className="font-semibold text-zinc-200">[E] или ЛКМ</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-mono">Отвлечение шумом</span>
                <span className="font-semibold text-zinc-200">[R] / ПКМ Бросок</span>
              </div>
            </div>

            {/* Mobile Controls Notice Banner */}
            <div className="bg-zinc-900/60 border border-amber-500/30 rounded-lg px-4 py-2 mb-8 text-[11px] text-amber-200/90 font-mono flex items-center gap-2.5">
              <span className="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-300 font-bold uppercase shrink-0">
                📱 На телефоне
              </span>
              <span>
                Виджеты активны: 3D-джойстик ходьбы и бега (в край = спринт), тачпад поворота головы 360°, развороты 90°/180° и кнопки действий.
              </span>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={startNewGame}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest rounded shadow-2xl shadow-red-950 flex items-center gap-3 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Начать Игру (3D Хоррор)
              </button>

              <button
                onClick={downloadGameFile}
                className="px-6 py-4 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 text-amber-200 font-semibold text-sm uppercase tracking-widest rounded flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-950/40 hover:scale-105"
                title="Скачать готовую игру в одном автономном HTML-файле"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Скачать Файл Игры (.html)
              </button>

              <button
                onClick={() => setViewMode('gdd')}
                className="px-6 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm uppercase tracking-widest rounded flex items-center gap-2 cursor-pointer transition-colors"
              >
                <BookOpen className="w-4 h-4 text-red-400" />
                Изучить GDD
              </button>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <footer className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-4 font-mono">
            <span>Проект «Проклятый Флигель»</span>
            <span>Для лучшего погружения играйте в наушниках</span>
          </footer>
        </div>
      )}

      {/* 2. Interactive 3D Survival Horror Game */}
      {viewMode === 'game' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Container */}
          <div ref={containerRef} className="w-full h-full cursor-crosshair" />

          {/* Interactive HUD Layer */}
          <GameHUD
            stats={stats}
            ghostState={ghostState}
            ghostDistance={ghostDistance}
            quest={quest}
            interactPrompt={interactPrompt}
            heldThrowable={heldThrowable}
            notification={notification}
            brightness={brightness}
            onSetBrightness={(val) => {
              setBrightness(val);
              engineRef.current?.setBrightness(val);
            }}
            onToggleFlashlight={() => engineRef.current?.toggleFlashlight()}
            onToggleSprint={() => engineRef.current?.toggleSprint()}
            onSprintHoldStart={() => engineRef.current?.setSprinting(true)}
            onSprintHoldEnd={() => engineRef.current?.setSprinting(false)}
            onHoldBreathStart={() => {
              engineRef.current?.setHoldingBreath(true);
            }}
            onHoldBreathEnd={() => {
              engineRef.current?.setHoldingBreath(false);
            }}
            onThrowItem={() => engineRef.current?.throwCurrentItem()}
            onInteract={() => engineRef.current?.triggerInteraction()}
            onOpenGdd={() => setViewMode('gdd')}
            onDownloadGame={downloadGameFile}
            onRestart={startNewGame}
            isGameOver={isGameOver}
            isEscaped={isEscaped}
            showMobileControls={showMobileControls}
            onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
            onMove={(x, y) => engineRef.current?.setTouchMove(x, y)}
            onRotateCamera={(yaw, pitch) => engineRef.current?.rotateCamera(yaw, pitch)}
            onSnapRotate={(deg) => engineRef.current?.snapRotate(deg)}
            onToggleCrouch={() => engineRef.current?.toggleCrouch()}
          />
        </div>
      )}

      {/* 3. Detailed GDD Dossier View */}
      {viewMode === 'gdd' && (
        <div className="relative w-full h-full overflow-y-auto">
          <GddDossier 
            onStartGame={startNewGame}
            onClose={() => setViewMode('intro')}
            onDownloadGame={downloadGameFile}
          />
        </div>
      )}
    </div>
  );
}
