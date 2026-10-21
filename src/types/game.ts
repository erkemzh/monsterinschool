export type GameState = 'intro' | 'playing' | 'hiding' | 'caught' | 'escaped' | 'gdd';

export type GhostState = 'wandering' | 'investigating' | 'stalking' | 'hunt';

export interface InventoryItem {
  id: string;
  name: string;
  nameRu: string;
  type: 'throwable' | 'relic' | 'tool' | 'key' | 'battery';
  icon: string;
  description: string;
}

export interface PlayerStats {
  sanity: number; // 0 - 100
  stamina: number; // 0 - 100
  breath: number; // 0 - 100 (while holding breath)
  noise: number; // 0 - 100 (current acoustic signature)
  battery: number; // 0 - 100
  isFlashlightOn: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isHoldingBreath: boolean;
  isHiding: boolean;
  bpm: number; // heartbeat
}

export interface QuestState {
  hasChalk: boolean; // Classroom
  hasSalt: boolean; // Chem lab
  hasKey: boolean; // Library
  hasBellHammer: boolean; // Boiler room
  isPowerRestored: boolean; // Fuse box in basement
  isRitualCompleted: boolean; // Occult circle activated
  canEscape: boolean;
  // Floor 2 & NPCs progression
  hasMasterKey?: boolean; // Key from watchman to Director's office & safe
  hasSafeOpened?: boolean; // Director's office safe opened
  metAlexey?: boolean; // Talked to student Alexey
  metWatchman?: boolean; // Talked to night watchman Misha
  metGhostGirl?: boolean; // Encountered ghost Tanya
  currentFloor?: 1 | 2; // Floor level player is on
}

export interface DialogueOption {
  text: string;
  response: string;
  giveItem?: {
    id: string;
    name: string;
    type: 'key' | 'battery' | 'sanity';
  };
}

export interface NPCData {
  id: string;
  name: string;
  title: string;
  role: 'student' | 'watchman' | 'ghost_girl';
  floor: 1 | 2;
  roomName: string;
  position: [number, number, number];
  portraitUrl: string;
  dialogue: {
    intro: string;
    options: DialogueOption[];
  };
  hasGivenItem?: boolean;
}

export interface DoorData {
  id: string;
  name: string;
  roomName: string;
  isOpen: boolean;
  isBarricaded: boolean;
  barricadeHealth: number; // 0 to 100
  position: [number, number, number];
  rotation: number;
  floor?: 1 | 2;
  isLocked?: boolean;
}

export interface ClosetData {
  id: string;
  roomName: string;
  position: [number, number, number];
  isOpen: boolean;
  isPlayerInside: boolean;
  floor?: 1 | 2;
}

export interface ThrowableObject {
  id: string;
  name: string;
  type: 'beaker' | 'globe' | 'mug' | 'book';
  position: [number, number, number];
  isHeld: boolean;
  floor?: 1 | 2;
}

export interface SoundDisturbance {
  position: [number, number, number];
  intensity: number;
  time: number;
}
