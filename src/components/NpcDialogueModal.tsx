import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Key, Zap, Shield, Sparkles, Check, ChevronRight } from 'lucide-react';
import { NPCData, DialogueOption } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';

interface NpcDialogueModalProps {
  npc: NPCData | null;
  onClose: () => void;
  onGiveItem: (item: { id: string; name: string; type: 'key' | 'battery' | 'sanity' }) => void;
}

export const NpcDialogueModal: React.FC<NpcDialogueModalProps> = ({
  npc,
  onClose,
  onGiveItem,
}) => {
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [claimedOptions, setClaimedOptions] = useState<string[]>([]);
  const [givenAlert, setGivenAlert] = useState<string | null>(null);

  useEffect(() => {
    if (npc) {
      setCurrentResponse(npc.dialogue.intro);
      setGivenAlert(null);
      horrorAudio.playNpcVoice(npc.role);
    }
  }, [npc]);

  if (!npc) return null;

  const handleSelectOption = (option: DialogueOption) => {
    horrorAudio.playNpcVoice(npc.role);
    setCurrentResponse(option.response);

    if (option.giveItem && !claimedOptions.includes(option.text)) {
      setClaimedOptions((prev) => [...prev, option.text]);
      onGiveItem(option.giveItem);
      setGivenAlert(`Получено: «${option.giveItem.name}»!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-zinc-950 border-2 border-red-900/90 rounded-2xl shadow-2xl shadow-red-950/80 overflow-hidden text-zinc-100 flex flex-col md:flex-row">
        
        {/* Left Column: Portrait & Identity */}
        <div className="w-full md:w-56 bg-zinc-900/90 p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col items-center justify-between text-center shrink-0">
          <div className="w-full flex flex-col items-center">
            {/* Portrait Frame */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-xl border-2 border-red-700/80 shadow-2xl overflow-hidden mb-3 group">
              <img 
                src={npc.portraitUrl} 
                alt={npc.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 border border-black/40 pointer-events-none" />
              {npc.role === 'ghost_girl' && (
                <div className="absolute inset-0 bg-cyan-500/20 mix-blend-screen animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Name & Title */}
            <h3 className="font-cinzel text-base md:text-lg font-black text-red-300 tracking-wide leading-tight">
              {npc.name}
            </h3>
            <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
              {npc.title}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              {npc.roomName} • {npc.floor === 1 ? '1 Этаж' : '2 Этаж'}
            </span>
          </div>

          {/* Quick status badge */}
          <div className="mt-3 w-full py-1.5 px-2 bg-black/60 rounded border border-zinc-800 text-[10px] font-mono text-amber-300 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ВЫЖИВШИЙ СОЮЗНИК</span>
          </div>
        </div>

        {/* Right Column: Dialogue and Choices */}
        <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" />
              <span>Диалог с персонажем</span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* NPC Dialogue Response Speech Bubble */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-h-[90px] shadow-inner text-xs md:text-sm font-mono leading-relaxed text-zinc-200">
            <p className="italic text-zinc-300">
              « {currentResponse} »
            </p>

            {givenAlert && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-600 rounded text-[11px] font-mono text-emerald-300 font-bold animate-bounce">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{givenAlert}</span>
              </div>
            )}
          </div>

          {/* Dialogue Choice Options */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
              Выберите тему разговора:
            </span>
            {npc.dialogue.options.map((opt, idx) => {
              const isClaimed = claimedOptions.includes(opt.text);
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition flex items-center justify-between gap-2 cursor-pointer ${
                    isClaimed
                      ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                      : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-700 hover:border-red-600 text-zinc-200 hover:text-white shadow'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`w-3.5 h-3.5 ${isClaimed ? 'text-zinc-600' : 'text-red-400'}`} />
                    <span>{opt.text}</span>
                  </div>

                  {opt.giveItem && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                      isClaimed 
                        ? 'bg-zinc-800 text-zinc-500 border-zinc-700' 
                        : 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse'
                    }`}>
                      {isClaimed ? 'ПОЛУЧЕНО' : 'ПОДАРОК'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Close Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider rounded-lg border border-zinc-700 transition cursor-pointer"
            >
              Завершить разговор [Esc]
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
