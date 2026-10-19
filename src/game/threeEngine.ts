import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { DoorData, ClosetData, QuestState, GhostState } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';
import {
  getSovietWallTexture,
  getParquetFloorTexture,
  getChalkboardTexture,
  getPeriodicTableTexture,
  getSovietPosterTexture,
  getLockerTexture,
  getBookshelfTexture,
  getOccultAltarTexture,
} from './proceduralTextures';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: {
    sanity: number;
    stamina: number;
    breath: number;
    noise: number;
    battery: number;
    isFlashlightOn: boolean;
    isSprinting: boolean;
    isCrouching: boolean;
    isHoldingBreath: boolean;
    isHiding: boolean;
    bpm: number;
  }) => void;
  onGhostStateChange: (state: GhostState, distance: number) => void;
  onInteractPrompt: (prompt: string | null) => void;
  onQuestUpdate: (quest: QuestState) => void;
  onInventoryUpdate: (heldThrowable: string | null, relics: string[]) => void;
  onGameOver: (escaped: boolean) => void;
  onNotification: (text: string) => void;
}

export class ForgottenWingEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  // Player state
  private playerPos = new THREE.Vector3(0, 1.6, 22);
  private cameraPitch = 0;
  private cameraYaw = 0;
  private isPointerLocked = false;

  // Stats
  private sanity = 100;
  private stamina = 100;
  private breath = 100;
  private noise = 0;
  private battery = 98;
  private bpm = 75;
  private isFlashlightOn = true;
  private isSprinting = false;
  private isCrouching = false;
  private isHoldingBreath = false;
  private isHiding = false;
  private currentClosetId: string | null = null;
  private heldThrowable: string | null = 'Химическая колба (стекло)';
  private relicsCollected: string[] = [];

  // Brightness multiplier
  private brightnessMultiplier = 1.4;

  private isSprintToggled = false;
  private headBobTimer = 0;

  // Keys
  private keys: Record<string, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ShiftLeft: false,
    ShiftRight: false,
    KeyC: false,
    Space: false,
  };

  // Flashlight & Lighting
  private flashlight!: THREE.SpotLight;
  private flashlightAura!: THREE.PointLight;
  private flashlightTarget!: THREE.Object3D;
  private hallwayLights: THREE.PointLight[] = [];
  private ambientLight!: THREE.AmbientLight;
  private moonLight!: THREE.DirectionalLight;

  // 3D Animated Monster Model (Loaded from 345(1).glb with animations)
  private ghostMesh!: THREE.Group;
  private monsterModel: THREE.Group | null = null;
  private monsterMixer: THREE.AnimationMixer | null = null;
  private monsterAction: THREE.AnimationAction | null = null;
  private ghostRedGlowLight!: THREE.PointLight;
  private ghostAuraParticles!: THREE.Points;
  private ghostPos = new THREE.Vector3(0, 1.6, -14);
  private ghostState: GhostState = 'wandering';
  private ghostTarget = new THREE.Vector3(0, 1.6, -10);
  private ghostSpeed = 2.4;
  private ghostHuntTimer = 0;
  private ghostStepTimer = 0;
  private ghostWaypoints: THREE.Vector3[] = [];
  private currentWaypointIdx = 0;
  private ghostHeadTwitchTimer = 0;
  private proximityDetectTimer = 0;
  private proximityWarnCooldown = 0;

  // Environment & Colliders
  private colliders: THREE.Box3[] = [];
  private doors: Map<string, { data: DoorData; group: THREE.Group; pivot: THREE.Group }> = new Map();
  private closets: Map<string, { data: ClosetData; group: THREE.Group }> = new Map();
  private interactables: THREE.Object3D[] = [];
  private thrownProjectiles: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number }> = [];

  // Quest State
  private quest: QuestState = {
    hasChalk: false,
    hasSalt: false,
    hasKey: false,
    hasBellHammer: false,
    isPowerRestored: false,
    isRitualCompleted: false,
    canEscape: false,
  };

  private animationFrameId: number | null = null;
  private footstepTimer = 0;
  private heartbeatTimer = 0;
  private currentInteractTarget: { type: string; id: string; name: string } | null = null;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initThree();
    this.buildDetailedSchool();
    this.initDetailedGhost();
    this.bindEvents();
    this.startLoop();
  }

  private initThree() {
    this.scene = new THREE.Scene();
    // Balanced deep blue nocturnal mist - clearly visible yet atmospheric
    this.scene.background = new THREE.Color(0x0a1017);
    this.scene.fog = new THREE.FogExp2(0x0a1017, 0.024);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(72, aspect, 0.1, 80);
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Boosted Ambient Light for clean visibility
    this.ambientLight = new THREE.AmbientLight(0x3a485a, 2.2 * this.brightnessMultiplier);
    this.scene.add(this.ambientLight);

    // Directional Moonlight streaming through windows
    this.moonLight = new THREE.DirectionalLight(0x769ecb, 1.8 * this.brightnessMultiplier);
    this.moonLight.position.set(-15, 20, 10);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.scene.add(this.moonLight);

    // Flashlight target
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);

    // High-powered exploration Flashlight (bright, wide beam)
    this.flashlight = new THREE.SpotLight(0xfff8e7, 9.5, 42, Math.PI / 3.4, 0.35, 1.1);
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = true;
    this.scene.add(this.flashlight);

    // Personal Soft Aura Light (illuminates feet and immediate room area)
    this.flashlightAura = new THREE.PointLight(0xffedd5, 2.2, 10, 1.2);
    this.flashlightAura.position.copy(this.camera.position);
    this.scene.add(this.flashlightAura);
  }

  public setBrightness(mult: number) {
    this.brightnessMultiplier = mult;
    if (this.ambientLight) this.ambientLight.intensity = 2.2 * mult;
    if (this.moonLight) this.moonLight.intensity = 1.8 * mult;
    if (this.flashlight) this.flashlight.intensity = 9.5 * mult;
  }

  private buildDetailedSchool() {
    const wallTex = getSovietWallTexture();
    const floorTex = getParquetFloorTexture();

    // Floor with Parquet Texture
    const floorGeo = new THREE.PlaneGeometry(40, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling with subtle plaster grid
    const ceilGeo = new THREE.PlaneGeometry(40, 64);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x242a2f,
      roughness: 0.9,
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.8, 0);
    this.scene.add(ceiling);

    // Outer boundary walls with Windows & Radiators
    this.createDetailedWall(0, 1.9, 27, 38, 3.8, 0.6, wallTex); // South outer boundary
    this.createDetailedWall(0, 1.9, -27, 38, 3.8, 0.6, wallTex); // North outer boundary
    this.createDetailedWall(-19, 1.9, 0, 0.6, 3.8, 54, wallTex); // West outer
    this.createDetailedWall(19, 1.9, 0, 0.6, 3.8, 54, wallTex); // East outer

    // Add moonlit barred windows along the outer walls
    [-18, -9, 0, 9, 18].forEach((z) => {
      this.createBarredWindow(-18.5, 2.2, z, Math.PI / 2);
      this.createBarredWindow(18.5, 2.2, z, -Math.PI / 2);
      this.createCastIronRadiator(-18.5, 0.5, z, Math.PI / 2);
      this.createCastIronRadiator(18.5, 0.5, z, -Math.PI / 2);
    });

    // ==========================================
    // REAL ENCLOSED ROOMS WITH ZERO GAPS OR SLITS
    // ==========================================

    // Interior Partition Walls separating rooms:
    // 1. Partition between Classroom and Chem Lab (West, z = 2)
    this.createDetailedWall(-11.25, 1.9, 2, 15.5, 3.8, 0.5, wallTex);
    // 2. Partition closing South side of Classroom (West, z = 24)
    this.createDetailedWall(-11.25, 1.9, 24, 15.5, 3.8, 0.5, wallTex);
    // 3. Partition closing North side of Chem Lab (West, z = -24)
    this.createDetailedWall(-11.25, 1.9, -24, 15.5, 3.8, 0.5, wallTex);

    // 4. Partition between Library and Boiler Room (East, z = 2)
    this.createDetailedWall(11.25, 1.9, 2, 15.5, 3.8, 0.5, wallTex);
    // 5. Partition closing South side of Library (East, z = 24)
    this.createDetailedWall(11.25, 1.9, 24, 15.5, 3.8, 0.5, wallTex);
    // 6. Partition closing North side of Boiler Room (East, z = -24)
    this.createDetailedWall(11.25, 1.9, -24, 15.5, 3.8, 0.5, wallTex);

    // Corridor West Wall (x = -3.5) with fitted doors:
    // Classroom Doorway is at z = 13 (opening spans z: 12.3 to 13.7)
    this.createDetailedWall(-3.5, 1.9, 18.85, 0.5, 3.8, 10.3, wallTex); // South of door
    this.createDoor('-4_door_class', 'Кабинет Литературы', 'Sector 1', [-3.5, 0, 13], 0);
    this.createDetailedWall(-3.5, 1.9, 7.15, 0.5, 3.8, 10.3, wallTex); // North of door

    // Chem Lab Doorway is at z = -11 (opening spans z: -11.7 to -10.3)
    this.createDetailedWall(-3.5, 1.9, -4.15, 0.5, 3.8, 12.3, wallTex); // South of door
    this.createDoor('-4_door_chem', 'Лаборатория Химии', 'Sector 2', [-3.5, 0, -11], 0);
    this.createDetailedWall(-3.5, 1.9, -17.85, 0.5, 3.8, 12.3, wallTex); // North of door

    // Corridor East Wall (x = 3.5) with fitted doors:
    // Library Doorway is at z = 13 (opening spans z: 12.3 to 13.7)
    this.createDetailedWall(3.5, 1.9, 18.85, 0.5, 3.8, 10.3, wallTex); // South of door
    this.createDoor('4_door_library', 'Старая Библиотека', 'Sector 3', [3.5, 0, 13], Math.PI);
    this.createDetailedWall(3.5, 1.9, 7.15, 0.5, 3.8, 10.3, wallTex); // North of door

    // Boiler Room Doorway is at z = -11 (opening spans z: -11.7 to -10.3)
    this.createDetailedWall(3.5, 1.9, -4.15, 0.5, 3.8, 12.3, wallTex); // South of door
    this.createDoor('4_door_boiler', 'Котельная и Подвал', 'Sector 4', [3.5, 0, -11], Math.PI);
    this.createDetailedWall(3.5, 1.9, -17.85, 0.5, 3.8, 12.3, wallTex); // North of door

    // Hallway fluorescent lighting (Clean, bright illumination)
    const lightZPositions = [22, 12, 2, -8, -18];
    lightZPositions.forEach((z) => {
      const lamp = new THREE.PointLight(0xdcf0ff, 2.4 * this.brightnessMultiplier, 22, 1.2);
      lamp.position.set(0, 3.6, z);
      lamp.castShadow = false;
      this.scene.add(lamp);
      this.hallwayLights.push(lamp);

      // Fluorescent fixture mesh with bright glowing tubes
      const fixtureGeo = new THREE.BoxGeometry(0.5, 0.1, 2.2);
      const fixtureMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(0, 3.7, z);

      // Emissive tube
      const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xdff4ff,
        emissiveIntensity: 2.5,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, -0.06, 0);
      fixture.add(tube);

      this.scene.add(fixture);
    });

    // Hallway Lockers lining the corridor
    this.buildCorridorLockers();

    // Hallway Posters & Fire Cabinets
    this.buildCorridorDecorations();

    // Sector 1: Classroom
    this.buildClassroom();

    // Sector 2: Chemistry Lab
    this.buildChemistryLab();

    // Sector 3: Library
    this.buildLibrary();

    // Sector 4: Boiler Room & Occult Altar
    this.buildBoilerRoom();

    // Main Exit Gate at south corridor
    this.buildMainExitGate();
  }

  private createDetailedWall(x: number, y: number, z: number, w: number, h: number, d: number, tex: THREE.Texture) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.8,
      metalness: 0.05,
    });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);

    const box = new THREE.Box3().setFromObject(wall);
    this.colliders.push(box);
    return wall;
  }

  private createBarredWindow(x: number, y: number, z: number, rotY: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    // Window frame
    const frameGeo = new THREE.BoxGeometry(2.4, 1.8, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);

    // Glowing moonlit glass pane
    const glassGeo = new THREE.PlaneGeometry(2.2, 1.6);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x2563eb,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.45,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0, 0.02);
    group.add(glass);

    // Iron security bars
    for (let i = -1.0; i <= 1.0; i += 0.35) {
      const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6);
      const barMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(i, 0, 0.06);
      group.add(bar);
    }

    this.scene.add(group);
  }

  private createCastIronRadiator(x: number, y: number, z: number, rotY: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    // Ribbed Soviet cast-iron radiator
    const ribGeo = new THREE.BoxGeometry(0.08, 0.7, 0.22);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.7 });
    for (let i = -0.7; i <= 0.7; i += 0.14) {
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(i, 0, 0);
      group.add(rib);
    }
    this.scene.add(group);
  }

  private buildCorridorLockers() {
    const lockerTex = getLockerTexture();
    const lockerMat = new THREE.MeshStandardMaterial({
      map: lockerTex,
      roughness: 0.6,
      metalness: 0.3,
    });

    // West hallway lockers
    [-2, 0, 2, 14, 16].forEach((z) => {
      const geo = new THREE.BoxGeometry(0.6, 2.2, 0.9);
      const mesh = new THREE.Mesh(geo, lockerMat);
      mesh.position.set(-3.6, 1.1, z);
      this.scene.add(mesh);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
    });

    // East hallway lockers
    [-2, 0, 2, 14, 16].forEach((z) => {
      const geo = new THREE.BoxGeometry(0.6, 2.2, 0.9);
      const mesh = new THREE.Mesh(geo, lockerMat);
      mesh.position.set(3.6, 1.1, z);
      this.scene.add(mesh);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
    });
  }

  private buildCorridorDecorations() {
    // Soviet School Poster: Fire safety
    const poster1Tex = getSovietPosterTexture('ОГНЕОПАСНО!', 'СОБЛЮДАЙ ПРАВИЛА');
    const p1Geo = new THREE.PlaneGeometry(1.2, 1.6);
    const p1Mat = new THREE.MeshBasicMaterial({ map: poster1Tex });
    const p1 = new THREE.Mesh(p1Geo, p1Mat);
    p1.position.set(-3.72, 2.2, 10);
    p1.rotation.y = Math.PI / 2;
    this.scene.add(p1);

    // Soviet School Poster: Discipline
    const poster2Tex = getSovietPosterTexture('ТИШИНА!', 'УЧИСЬ НА ОТЛИЧНО');
    const p2Geo = new THREE.PlaneGeometry(1.2, 1.6);
    const p2Mat = new THREE.MeshBasicMaterial({ map: poster2Tex });
    const p2 = new THREE.Mesh(p2Geo, p2Mat);
    p2.position.set(3.72, 2.2, 10);
    p2.rotation.y = -Math.PI / 2;
    this.scene.add(p2);

    // Red Fire Hose Cabinet (ПК-1)
    const cabGeo = new THREE.BoxGeometry(0.2, 1.0, 0.8);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-3.85, 2.0, 4);
    this.scene.add(cab);

    // Green Emergency Exit signs above doorways
    [-4, 4].forEach((x) => {
      [8, -8].forEach((z) => {
        const signGeo = new THREE.BoxGeometry(0.1, 0.25, 0.6);
        const signMat = new THREE.MeshStandardMaterial({
          color: 0x059669,
          emissive: 0x10b981,
          emissiveIntensity: 1.5,
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(x, 2.9, z);
        this.scene.add(sign);
      });
    });
  }

  private createDoor(id: string, name: string, roomName: string, pos: [number, number, number], rotY: number) {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.y = rotY;

    const wallTex = getSovietWallTexture();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2e1e12, roughness: 0.8 });

    // Top lintel / header (seals gap from door top y = 2.6 up to ceiling y = 3.8)
    const lintelGeo = new THREE.BoxGeometry(0.5, 1.2, 1.44);
    const lintelMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
    const lintel = new THREE.Mesh(lintelGeo, lintelMat);
    lintel.position.set(0, 3.2, 0);
    group.add(lintel);
    this.colliders.push(new THREE.Box3().setFromObject(lintel));

    // Wooden door jambs (frame edges on both sides)
    const jambGeo = new THREE.BoxGeometry(0.52, 2.6, 0.08);
    const jamb1 = new THREE.Mesh(jambGeo, frameMat);
    jamb1.position.set(0, 1.3, -0.68);
    group.add(jamb1);
    const jamb2 = new THREE.Mesh(jambGeo, frameMat);
    jamb2.position.set(0, 1.3, 0.68);
    group.add(jamb2);

    // Door leaf pivot: positioned at one edge of the jamb
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, -0.64);

    // Door leaf (exactly fits 1.28m opening width, 2.58m height, airtight!)
    const doorGeo = new THREE.BoxGeometry(0.12, 2.58, 1.28);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1b,
      roughness: 0.65,
      metalness: 0.1,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0, 1.3, 0.64);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorMesh.userData = { isDoor: true, doorId: id, name };

    // Brass vintage door handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.08, 1.1, 1.1);
    doorMesh.add(handle);

    pivot.add(doorMesh);
    group.add(pivot);
    this.scene.add(group);

    const doorData: DoorData = {
      id,
      name,
      roomName,
      isOpen: false,
      isBarricaded: false,
      barricadeHealth: 100,
      position: pos,
      rotation: rotY,
    };

    this.doors.set(id, { data: doorData, group, pivot });
    this.interactables.push(doorMesh);

    const box = new THREE.Box3().setFromObject(doorMesh);
    this.colliders.push(box);
  }

  private buildClassroom() {
    // Room chandelier / ceiling lamp
    const classLight = new THREE.PointLight(0xfff5e6, 2.5 * this.brightnessMultiplier, 18, 1.1);
    classLight.position.set(-11, 3.4, 8);
    this.scene.add(classLight);

    // Authentic Soviet Chalkboard with creepy writing
    const boardTex = getChalkboardTexture();
    const boardGeo = new THREE.PlaneGeometry(4.8, 2.4);
    const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.8 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(-18.5, 2.0, 8);
    board.rotation.y = Math.PI / 2;
    this.scene.add(board);

    // Rows of detailed desks with inkwells and scattered notebooks
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const desk = this.createDetailedDesk(-14 + col * 3.5, 0, 5 + row * 2.8);
        this.scene.add(desk);
      }
    }

    // Teacher's desk
    const teacherDesk = this.createDetailedDesk(-15, 0, 8, true);
    this.scene.add(teacherDesk);

    // Relic 1: Occult Chalk (glowing mystical rune cylinder)
    const chalkGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12);
    const chalkMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    });
    const chalkMesh = new THREE.Mesh(chalkGeo, chalkMat);
    chalkMesh.position.set(-15, 0.95, 8);
    chalkMesh.rotation.z = Math.PI / 2;
    chalkMesh.userData = { isRelic: true, relicId: 'chalk', name: 'Оккультный мел (Ритуальный артефакт)' };
    this.scene.add(chalkMesh);
    this.interactables.push(chalkMesh);

    // Hiding Wardrobe / Closet
    this.createDetailedCloset('closet_class', 'Кабинет Литературы', [-17.2, 0, 12.5], 0);

    // Throwable coffee mug
    this.createThrowableObject('mug_class', 'Кружка учителя', 'mug', [-14.8, 0.95, 7.6]);
  }

  private buildChemistryLab() {
    // Room chandelier
    const chemLight = new THREE.PointLight(0xd1fae5, 2.5 * this.brightnessMultiplier, 18, 1.1);
    chemLight.position.set(-11, 3.4, -8);
    this.scene.add(chemLight);

    // Periodic Table of Elements poster on the wall
    const periodicTex = getPeriodicTableTexture();
    const pGeo = new THREE.PlaneGeometry(3.6, 2.4);
    const pMat = new THREE.MeshStandardMaterial({ map: periodicTex, roughness: 0.7 });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.position.set(-18.5, 2.2, -8);
    pMesh.rotation.y = Math.PI / 2;
    this.scene.add(pMesh);

    // Heavy chemistry lab benches with ceramic tops and sinks
    for (let i = 0; i < 2; i++) {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(-11, 0, -5 - i * 4);

      const benchGeo = new THREE.BoxGeometry(4.8, 0.95, 1.5);
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(0, 0.47, 0);
      benchGroup.add(bench);

      // Ceramic sink and brass faucet
      const sinkGeo = new THREE.BoxGeometry(0.8, 0.4, 0.6);
      const sinkMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
      const sink = new THREE.Mesh(sinkGeo, sinkMat);
      sink.position.set(1.6, 0.8, 0);
      benchGroup.add(sink);

      const faucetGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8);
      const faucetMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 });
      const faucet = new THREE.Mesh(faucetGeo, faucetMat);
      faucet.position.set(1.6, 1.1, -0.2);
      benchGroup.add(faucet);

      this.scene.add(benchGroup);
      this.colliders.push(new THREE.Box3().setFromObject(benchGroup));
    }

    // Closet in Chem lab
    this.createDetailedCloset('closet_chem', 'Лаборатория Химии', [-17.2, 0, -12], 0);

    // Relic 2: Purification Salt (glowing teal crystals)
    const saltGeo = new THREE.BoxGeometry(0.24, 0.4, 0.24);
    const saltMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });
    const saltMesh = new THREE.Mesh(saltGeo, saltMat);
    saltMesh.position.set(-11, 1.18, -9);
    saltMesh.userData = { isRelic: true, relicId: 'salt', name: 'Соль очищения (Защитный реагент)' };
    this.scene.add(saltMesh);
    this.interactables.push(saltMesh);

    // Multiple glass beakers for distraction
    this.createThrowableObject('beaker_1', 'Химическая колба #1', 'beaker', [-10, 1.1, -5]);
    this.createThrowableObject('beaker_2', 'Химическая колба #2', 'beaker', [-12, 1.1, -5]);
    this.createThrowableObject('beaker_3', 'Химическая колба #3', 'beaker', [-11, 1.1, -9.4]);
  }

  private buildLibrary() {
    // Library warm amber lighting with green banker lamps
    const libLight = new THREE.PointLight(0xfef3c7, 2.5 * this.brightnessMultiplier, 18, 1.1);
    libLight.position.set(11, 3.4, 8);
    this.scene.add(libLight);

    const bookTex = getBookshelfTexture();
    const shelfMat = new THREE.MeshStandardMaterial({
      map: bookTex,
      roughness: 0.7,
    });

    // Tall towering bookshelves
    for (let i = 0; i < 3; i++) {
      const shelfGeo = new THREE.BoxGeometry(1.2, 3.4, 6.2);
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(10 + i * 2.8, 1.7, 8);
      shelf.castShadow = true;
      this.scene.add(shelf);
      this.colliders.push(new THREE.Box3().setFromObject(shelf));
    }

    // Reading table in library with glowing green banker lamp
    const tableGroup = new THREE.Group();
    tableGroup.position.set(15, 0, 4);

    const tableGeo = new THREE.BoxGeometry(2.4, 0.8, 1.4);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.4, 0);
    tableGroup.add(table);

    // Green glass banker's lamp
    const lampShadeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 10);
    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 2.0,
      roughness: 0.3,
    });
    const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.rotation.z = Math.PI / 2;
    lampShade.position.set(0, 0.95, 0);
    tableGroup.add(lampShade);

    this.scene.add(tableGroup);
    this.colliders.push(new THREE.Box3().setFromObject(tableGroup));

    // Relic 3: Cursed Key
    const keyGeo = new THREE.TorusGeometry(0.1, 0.03, 8, 16);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 1.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const keyMesh = new THREE.Mesh(keyGeo, keyMat);
    keyMesh.position.set(14.8, 0.9, 4.3);
    keyMesh.userData = { isRelic: true, relicId: 'key', name: 'Старинный ключ директора' };
    this.scene.add(keyMesh);
    this.interactables.push(keyMesh);

    // Closet in Library
    this.createDetailedCloset('closet_library', 'Библиотека', [17.2, 0, 12], Math.PI);

    // Throwable heavy tome
    this.createThrowableObject('book_lib', 'Тяжелый фолиант', 'book', [15, 0.88, 3.7]);
  }

  private buildBoilerRoom() {
    // Ominous reddish flickering light
    const boilerLight = new THREE.PointLight(0xf87171, 2.8 * this.brightnessMultiplier, 18, 1.2);
    boilerLight.position.set(11, 3.4, -10);
    this.scene.add(boilerLight);

    // Heavy industrial boiler tanks with steam valves
    const boilerGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.2, 16);
    const boilerMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
      metalness: 0.6,
    });
    const boiler = new THREE.Mesh(boilerGeo, boilerMat);
    boiler.position.set(13, 1.6, -16);
    this.scene.add(boiler);
    this.colliders.push(new THREE.Box3().setFromObject(boiler));

    // High Voltage Electrical Fuse Box on wall
    const fuseGeo = new THREE.BoxGeometry(0.35, 1.1, 0.8);
    const fuseMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.6,
    });
    const fuseBox = new THREE.Mesh(fuseGeo, fuseMat);
    fuseBox.position.set(18.2, 1.8, -10);
    fuseBox.userData = { isFuseBox: true, name: 'Главный электрощиток (Рычаг питания)' };
    this.scene.add(fuseBox);
    this.interactables.push(fuseBox);

    // Occult Summoning Altar with detailed glowing Pentagram and Runes
    const altarTex = getOccultAltarTexture();
    const altarGeo = new THREE.PlaneGeometry(4.4, 4.4);
    const altarMat = new THREE.MeshStandardMaterial({
      map: altarTex,
      transparent: true,
      roughness: 0.4,
      emissive: 0x991b1b,
      emissiveIntensity: 1.2,
    });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.rotation.x = -Math.PI / 2;
    altar.position.set(11, 0.03, -8);
    altar.userData = { isAltar: true, name: 'Оккультный алтарь (Круг изгнания)' };
    this.scene.add(altar);
    this.interactables.push(altar);

    // Red Candles around the altar
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const cx = 11 + 2.0 * Math.cos(angle);
      const cz = -8 + 2.0 * Math.sin(angle);

      const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
      const candleMat = new THREE.MeshStandardMaterial({ color: 0x991b1b });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.set(cx, 0.125, cz);
      this.scene.add(candle);

      const flameGeo = new THREE.SphereGeometry(0.03, 6, 6);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(cx, 0.28, cz);
      this.scene.add(flame);
    }

    // Relic 4: Bell Hammer (Rusty bronze bell clapper)
    const hammerGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8);
    const hammerMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xb45309,
      emissiveIntensity: 1.5,
      metalness: 0.9,
    });
    const hammerMesh = new THREE.Mesh(hammerGeo, hammerMat);
    hammerMesh.position.set(11, 0.3, -12);
    hammerMesh.userData = { isRelic: true, relicId: 'bellHammer', name: 'Ржавый боёк школьного звонка' };
    this.scene.add(hammerMesh);
    this.interactables.push(hammerMesh);

    // Closet in boiler room
    this.createDetailedCloset('closet_boiler', 'Котельная', [17.2, 0, -18], Math.PI);
  }

  private buildMainExitGate() {
    const gateFrameGeo = new THREE.BoxGeometry(6.0, 3.6, 0.5);
    const gateFrameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const gateFrame = new THREE.Mesh(gateFrameGeo, gateFrameMat);
    gateFrame.position.set(0, 1.8, 28);
    this.scene.add(gateFrame);

    // Heavy iron gates with padlock
    const doorGeo = new THREE.BoxGeometry(5.2, 3.2, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.6,
      metalness: 0.7,
    });
    const exitDoor = new THREE.Mesh(doorGeo, doorMat);
    exitDoor.position.set(0, 1.6, 27.9);
    exitDoor.userData = { isExitGate: true, name: 'Главные ворота школы (Запечатаны проклятием)' };
    this.scene.add(exitDoor);
    this.interactables.push(exitDoor);
    this.colliders.push(new THREE.Box3().setFromObject(exitDoor));

    // Glowing ward glyph on exit door
    const wardGeo = new THREE.RingGeometry(0.3, 0.8, 16);
    const wardMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const ward = new THREE.Mesh(wardGeo, wardMat);
    ward.position.set(0, 1.8, 27.75);
    this.scene.add(ward);
  }

  private createDetailedDesk(x: number, y: number, z: number, isTeacher = false): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const topW = isTeacher ? 2.4 : 1.6;
    const topD = isTeacher ? 1.2 : 0.9;

    // Wooden tabletop with bevel
    const topGeo = new THREE.BoxGeometry(topW, 0.08, topD);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.7 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 0.8, 0);
    top.castShadow = true;
    group.add(top);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
    const offsets = [
      [-topW / 2 + 0.1, -topD / 2 + 0.1],
      [topW / 2 - 0.1, -topD / 2 + 0.1],
      [-topW / 2 + 0.1, topD / 2 - 0.1],
      [topW / 2 - 0.1, topD / 2 - 0.1],
    ];
    offsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(ox, 0.4, oz);
      group.add(leg);
    });

    // Inkwell & notebook on top
    const bookGeo = new THREE.BoxGeometry(0.25, 0.03, 0.35);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const book = new THREE.Mesh(bookGeo, bookMat);
    book.position.set(0.2, 0.85, 0.1);
    group.add(book);

    const box = new THREE.Box3().setFromObject(group);
    this.colliders.push(box);
    return group;
  }

  private createDetailedCloset(id: string, roomName: string, pos: [number, number, number], rotY: number) {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.y = rotY;

    // Outer wooden frame with rich texture
    const frameGeo = new THREE.BoxGeometry(1.5, 2.8, 1.3);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.75,
      metalness: 0.1,
    });
    const closetBody = new THREE.Mesh(frameGeo, frameMat);
    closetBody.position.set(0, 1.4, 0);
    closetBody.castShadow = true;
    closetBody.userData = { isCloset: true, closetId: id, name: `Школьный шкаф (${roomName})` };
    group.add(closetBody);

    // Slits for first-person peeking
    const slitGeo = new THREE.BoxGeometry(0.06, 0.45, 0.02);
    const slitMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const slit = new THREE.Mesh(slitGeo, slitMat);
    slit.position.set(0, 1.6, 0.66);
    group.add(slit);

    this.scene.add(group);

    const closetData: ClosetData = {
      id,
      roomName,
      position: pos,
      isOpen: false,
      isPlayerInside: false,
    };

    this.closets.set(id, { data: closetData, group });
    this.interactables.push(closetBody);
    this.colliders.push(new THREE.Box3().setFromObject(group));
  }

  private createThrowableObject(id: string, name: string, type: 'beaker' | 'globe' | 'mug' | 'book', pos: [number, number, number]) {
    const geo = type === 'beaker' 
      ? new THREE.ConeGeometry(0.14, 0.35, 12) 
      : type === 'mug' 
        ? new THREE.CylinderGeometry(0.1, 0.1, 0.22, 10) 
        : new THREE.BoxGeometry(0.28, 0.1, 0.4);

    const mat = new THREE.MeshStandardMaterial({
      color: type === 'beaker' ? 0x93c5fd : 0xd1d5db,
      roughness: type === 'beaker' ? 0.1 : 0.8,
      metalness: 0.1,
      transparent: type === 'beaker',
      opacity: type === 'beaker' ? 0.8 : 1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.userData = { isThrowable: true, throwableId: id, name, type };
    this.scene.add(mesh);
    this.interactables.push(mesh);
  }

  /**
   * Initializes the 3D animated monster entity loaded from 345(1).glb:
   * - Uses GLTFLoader with DRACOLoader decompression
   * - Automatically centers model and aligns feet onto the floor (y = 0)
   * - Configures shadows and PBR materials to respond menacingly to player flashlight
   * - Sets up Three.js AnimationMixer with looping skeletal animation
   * - Adds glowing crimson demonic eye aura and dark swirling ember particles
   */
  private initDetailedGhost() {
    this.ghostMesh = new THREE.Group();

    // 1. Swirling dark ash / shadow particle aura
    const particleCount = 65;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = Math.random() * 2.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x991b1b,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
    });
    this.ghostAuraParticles = new THREE.Points(partGeo, partMat);
    this.ghostMesh.add(this.ghostAuraParticles);

    // 2. Piercing crimson demonic aura point light
    this.ghostRedGlowLight = new THREE.PointLight(0xef4444, 1.6, 7);
    this.ghostRedGlowLight.position.set(0, 1.85, 0.4);
    this.ghostMesh.add(this.ghostRedGlowLight);

    // 3. Temporary dark silhouette placeholder until 3D GLB finishes loading
    const placeholder = new THREE.Group();
    placeholder.name = 'monster_placeholder';
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.28, 2.1, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.05;
    placeholder.add(body);
    this.ghostMesh.add(placeholder);

    // 4. Setup GLTFLoader + DRACOLoader
    const dracoLoader = new DRACOLoader();
    // Use local draco decoders from public folder
    dracoLoader.setDecoderPath('/draco/gltf/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Candidate URLs for 345(1).glb
    const modelCandidates = ['/345(1).glb', '/345 (1).glb', '/monster.glb', '345(1).glb'];
    let candidateIndex = 0;

    const loadNextCandidate = () => {
      if (candidateIndex >= modelCandidates.length) {
        console.warn('[HorrorEngine] All local paths failed, trying Google CDN Draco with fallback');
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        return;
      }
      const currentUrl = modelCandidates[candidateIndex++];

      gltfLoader.load(
        currentUrl,
        (gltf) => {
          // Successfully loaded 3D GLTF model
          // Remove placeholder silhouette
          const existingPlaceholder = this.ghostMesh.getObjectByName('monster_placeholder');
          if (existingPlaceholder) {
            this.ghostMesh.remove(existingPlaceholder);
          }

          const model = gltf.scene;
          this.monsterModel = model;

          // Compute bounding box
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());

          // Desired terrifying monster height (~2.35m)
          const targetHeight = 2.35;
          const currentHeight = size.y > 0.2 ? size.y : 2.0;
          const scale = targetHeight / currentHeight;
          model.scale.setScalar(scale);

          // Recompute scaled bounding box
          const scaledBox = new THREE.Box3().setFromObject(model);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

          // Center horizontally and align feet directly on the floor (y = 0)
          model.position.x -= scaledCenter.x;
          model.position.z -= scaledCenter.z;
          model.position.y -= scaledBox.min.y;

          // Configure materials and shadows
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                  if ('roughness' in mat) {
                    (mat as { roughness: number }).roughness = 0.7;
                  }
                  if ('metalness' in mat) {
                    (mat as { metalness: number }).metalness = 0.15;
                  }
                  mat.needsUpdate = true;
                });
              }
            }
          });

          // Setup AnimationMixer with animations from 345(1).glb
          if (gltf.animations && gltf.animations.length > 0) {
            this.monsterMixer = new THREE.AnimationMixer(model);
            const clip = gltf.animations[0];
            this.monsterAction = this.monsterMixer.clipAction(clip);
            this.monsterAction.setLoop(THREE.LoopRepeat, Infinity);
            this.monsterAction.clampWhenFinished = false;
            this.monsterAction.play();
            console.log(`[HorrorEngine] Initialized 3D Monster animation "${clip.name}" (${clip.duration.toFixed(2)}s)`);
          }

          this.ghostMesh.add(model);
          this.callbacks.onNotification('« 3D МОНСТР 345(1).GLB ЗАГРУЖЕН И ОЖИЛ В КОРИДОРАХ »');
        },
        undefined,
        (err) => {
          console.warn(`[HorrorEngine] Candidate ${currentUrl} failed:`, err);
          loadNextCandidate();
        }
      );
    };

    loadNextCandidate();

    // Position ghost at initial coordinates
    this.ghostMesh.position.set(this.ghostPos.x, 0, this.ghostPos.z);
    this.scene.add(this.ghostMesh);

    // Patrol waypoints across all 4 school sectors
    this.ghostWaypoints = [
      new THREE.Vector3(0, 1.6, 20),   // Hallway South
      new THREE.Vector3(-10, 1.6, 8),  // Classroom
      new THREE.Vector3(0, 1.6, 4),    // Hallway Mid
      new THREE.Vector3(12, 1.6, 8),   // Library
      new THREE.Vector3(0, 1.6, -6),   // Hallway North
      new THREE.Vector3(-11, 1.6, -8), // Chem Lab
      new THREE.Vector3(0, 1.6, -18),  // Hallway deep
      new THREE.Vector3(12, 1.6, -12), // Boiler Room
    ];
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', this.handleCanvasClick);
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.throwCurrentItem();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sensitivity = 0.0022;
      this.cameraYaw -= e.movementX * sensitivity;
      this.cameraPitch -= e.movementY * sensitivity;
      this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    horrorAudio.resume();

    if (e.code in this.keys) {
      this.keys[e.code] = true;
    }

    if (e.code === 'ArrowUp' || e.key === 'ArrowUp') this.keys.ArrowUp = true;
    if (e.code === 'ArrowDown' || e.key === 'ArrowDown') this.keys.ArrowDown = true;
    if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') this.keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.key === 'ArrowRight') this.keys.ArrowRight = true;

    const k = e.key.toLowerCase();
    if (k === 'ц') this.keys.KeyW = true;
    if (k === 'ы') this.keys.KeyS = true;
    if (k === 'ф') this.keys.KeyA = true;
    if (k === 'в') this.keys.KeyD = true;

    // Universal Shift handling for sprinting
    if (e.shiftKey || e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.keys.ShiftLeft = true;
      this.keys.ShiftRight = true;
    }

    // Toggle Sprint via Q or CapsLock
    if (e.code === 'KeyQ' || k === 'q' || k === 'й' || e.code === 'CapsLock') {
      this.toggleSprint();
    }

    if (e.code === 'KeyF' || k === 'а') {
      this.toggleFlashlight();
    } else if (e.code === 'KeyE' || k === 'у') {
      this.triggerInteraction();
    } else if (e.code === 'KeyR' || k === 'к') {
      this.throwCurrentItem();
    } else if (e.code === 'Space') {
      this.isHoldingBreath = true;
    } else if (e.code === 'KeyC' || k === 'с') {
      this.isCrouching = !this.isCrouching;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code in this.keys) {
      this.keys[e.code] = false;
    }

    if (e.code === 'ArrowUp' || e.key === 'ArrowUp') this.keys.ArrowUp = false;
    if (e.code === 'ArrowDown' || e.key === 'ArrowDown') this.keys.ArrowDown = false;
    if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') this.keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.key === 'ArrowRight') this.keys.ArrowRight = false;

    const k = e.key.toLowerCase();
    if (k === 'ц') this.keys.KeyW = false;
    if (k === 'ы') this.keys.KeyS = false;
    if (k === 'ф') this.keys.KeyA = false;
    if (k === 'в') this.keys.KeyD = false;

    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.keys.ShiftLeft = false;
      this.keys.ShiftRight = false;
    }

    if (e.code === 'Space') {
      this.isHoldingBreath = false;
    }
  };

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleCanvasClick = () => {
    horrorAudio.init();
    horrorAudio.resume();

    const canvas = this.renderer.domElement;
    if (!this.isPointerLocked) {
      canvas.requestPointerLock?.();
    } else {
      this.triggerInteraction();
    }
  };

  public toggleFlashlight() {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.visible = this.isFlashlightOn;
    this.flashlightAura.visible = this.isFlashlightOn;
    horrorAudio.playFlashlightClick();
  }

  public triggerInteraction() {
    if (this.isHiding && this.currentClosetId) {
      this.exitCloset();
      return;
    }

    if (!this.currentInteractTarget) return;

    const { type, id } = this.currentInteractTarget;

    if (type === 'door') {
      this.toggleDoor(id);
    } else if (type === 'closet') {
      this.enterCloset(id);
    } else if (type === 'relic') {
      this.collectRelic(id);
    } else if (type === 'throwable') {
      this.pickupThrowable(id);
    } else if (type === 'fuseBox') {
      this.toggleFuseBox();
    } else if (type === 'altar') {
      this.activateAltar();
    } else if (type === 'exitGate') {
      this.tryEscape();
    }
  }

  public toggleDoor(doorId: string) {
    const door = this.doors.get(doorId);
    if (!door) return;

    if (door.data.isBarricaded) {
      this.callbacks.onNotification('Дверь забаррикадирована партой!');
      return;
    }

    door.data.isOpen = !door.data.isOpen;
    const targetAngle = door.data.isOpen ? Math.PI / 2 : 0;
    door.pivot.rotation.y = targetAngle;
    horrorAudio.playDoorCreak();
    this.callbacks.onNotification(door.data.isOpen ? '« ТЯЖЁЛЫЕ ПЕТЛИ СКРИПЯТ. ДВЕРЬ ПРИОТКРЫТА. »' : '« ДВЕРЬ ГЛУХО ЗАХЛОПНУЛАСЬ ВО ТЬМЕ. »');
  }

  public enterCloset(closetId: string) {
    const closet = this.closets.get(closetId);
    if (!closet) return;

    this.isHiding = true;
    this.currentClosetId = closetId;
    closet.data.isPlayerInside = true;

    const [cx, , cz] = closet.data.position;
    this.playerPos.set(cx, 1.45, cz);

    horrorAudio.playDoorCreak();
    this.callbacks.onNotification('« ТЫ В ТЕМНОТЕ ШКАФА. ЗАМРИ. НЕ ДЫШИ [ПРОБЕЛ]. »');
  }

  public exitCloset() {
    if (!this.currentClosetId) return;
    const closet = this.closets.get(this.currentClosetId);
    if (closet) {
      closet.data.isPlayerInside = false;
      const offsetZ = closet.data.position[2] > 0 ? -1.2 : 1.2;
      this.playerPos.set(closet.data.position[0], 1.6, closet.data.position[2] + offsetZ);
    }
    this.isHiding = false;
    this.currentClosetId = null;
    horrorAudio.playDoorCreak();
    this.callbacks.onNotification('« СТВОРКА СКРИПНУЛА. ТЫ ВНОВЬ В ПУСТОМ ЗАЛЕ. »');
  }

  public collectRelic(relicId: string) {
    horrorAudio.playRelicPickup();

    if (relicId === 'chalk') {
      this.quest.hasChalk = true;
      this.callbacks.onNotification('[ РИТУАЛЬНЫЙ МЕЛ НАЙДЕН · ПЕЧАТЬ 1974 ГОДА ]');
    } else if (relicId === 'salt') {
      this.quest.hasSalt = true;
      this.callbacks.onNotification('[ СОЛЬ ОЧИЩЕНИЯ НАЙДЕНА В ВЫТЯЖНОМ ШКАФУ ]');
    } else if (relicId === 'key') {
      this.quest.hasKey = true;
      this.callbacks.onNotification('[ СТАРИННЫЙ КЛЮЧ ДИРЕКТОРА НАЙДЕН В КАРТОТЕКЕ ]');
    } else if (relicId === 'bellHammer') {
      this.quest.hasBellHammer = true;
      this.callbacks.onNotification('[ БОЁК ЗВОНКА НАЙДЕН В ГЛУБИНАХ КОТЕЛЬНОЙ ]');
    }

    if (!this.relicsCollected.includes(relicId)) {
      this.relicsCollected.push(relicId);
    }

    const obj = this.interactables.find((item) => item.userData?.relicId === relicId);
    if (obj) obj.visible = false;

    this.callbacks.onQuestUpdate({ ...this.quest });
    this.callbacks.onInventoryUpdate(this.heldThrowable, this.relicsCollected);

    this.triggerGhostNoise(this.playerPos, 45);
  }

  public pickupThrowable(throwableId: string) {
    const obj = this.interactables.find((item) => item.userData?.throwableId === throwableId);
    if (!obj) return;

    this.heldThrowable = obj.userData.name;
    obj.visible = false;
    horrorAudio.playRelicPickup();
    this.callbacks.onNotification(`[ ПОДОБРАН ПРЕДМЕТ: «${obj.userData.name}» · [R] МЕТНУТЬ ]`);
    this.callbacks.onInventoryUpdate(this.heldThrowable, this.relicsCollected);
  }

  public throwCurrentItem() {
    if (!this.heldThrowable || this.isHiding) return;

    const projGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const projMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2 });
    const proj = new THREE.Mesh(projGeo, projMat);
    proj.position.copy(this.camera.position);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y += 0.15;
    const vel = forward.multiplyScalar(15);

    this.scene.add(proj);
    this.thrownProjectiles.push({ mesh: proj, vel, life: 3 });

    this.callbacks.onNotification(`« ЗВОН РАЗБИТОГО СТЕКЛА ЭХОМ ПРОНЁССЯ ПО ЗДАНИЮ... »`);
    this.heldThrowable = null;
    this.callbacks.onInventoryUpdate(null, this.relicsCollected);
  }

  public toggleFuseBox() {
    this.quest.isPowerRestored = !this.quest.isPowerRestored;
    horrorAudio.playFlashlightClick();

    if (this.quest.isPowerRestored) {
      this.callbacks.onNotification('« РУБИЛЬНИК ВЗВЕДЁН. ТРАНСФОРМАТОР ЗАГУДЕЛ В СТЕНАХ. »');
    } else {
      this.callbacks.onNotification('« СЕТЬ ОБЕСТОЧЕНА. »');
    }
    this.callbacks.onQuestUpdate({ ...this.quest });
  }

  public activateAltar() {
    const allRelics = this.quest.hasChalk && this.quest.hasSalt && this.quest.hasKey && this.quest.hasBellHammer;
    if (!allRelics) {
      this.callbacks.onNotification('« ПЕЧАТЬ НЕ ПОЛНА: СОБЕРИ ВСЕ 4 РЕЛИКВИИ ФЛИГЕЛЯ »');
      return;
    }
    if (!this.quest.isPowerRestored) {
      this.callbacks.onNotification('« НЕТ ПИТАНИЯ: ВКЛЮЧИ РУБИЛЬНИК В КОТЕЛЬНОЙ »');
      return;
    }

    this.quest.isRitualCompleted = true;
    this.quest.canEscape = true;
    horrorAudio.playHuntStinger();
    this.callbacks.onNotification('« РИТУАЛ ЗАВЕРШЁН! ПЕЧАТЬ ПАЛА! БЕГИ К ВОРОТАМ НА ЮГЕ! »');
    this.callbacks.onQuestUpdate({ ...this.quest });

    this.startActiveHunt('« СУЩНОСТЬ В ЯРОСТИ! ОНА БРОСИЛАСЬ В ПОСЛЕДНЮЮ ПОГОНЮ! »');
  }

  public tryEscape() {
    if (this.quest.canEscape) {
      this.callbacks.onGameOver(true);
    } else {
      this.callbacks.onNotification('« ВОРОТА НАМЕРТВО ЗАПЕЧАТАНЫ КРОВЬЮ... СНАЧАЛА ЗАВЕРШИ РИТУАЛ. »');
    }
  }

  public triggerGhostNoise(pos: THREE.Vector3, intensity: number) {
    this.noise = Math.min(100, this.noise + intensity);
    if (this.ghostState !== 'hunt') {
      this.ghostState = 'investigating';
      this.ghostTarget.copy(pos);
      this.callbacks.onNotification('« ТЕНЬ УСЛЫШАЛА ШУМ... ШАГИ ПРИБЛИЖАЮТСЯ... »');
    }
  }

  private startActiveHunt(reason = '« ОХОТА НАЧАЛАСЬ! ТЕНЬ МЧИТСЯ НА ТВОЙ СТРАХ! »') {
    this.ghostState = 'hunt';
    this.ghostHuntTimer = 20;
    this.ghostSpeed = 4.4;
    horrorAudio.playHuntStinger();
    this.callbacks.onNotification(reason);
  }

  public setHoldingBreath(holding: boolean) {
    this.isHoldingBreath = holding;
  }

  public toggleSprint() {
    this.isSprintToggled = !this.isSprintToggled;
    this.callbacks.onNotification(
      this.isSprintToggled ? '« РЕЖИМ БЕГА ВКЛЮЧЁН (СПРИНТ) »' : '« РЕЖИМ ШАГА »'
    );
  }

  public setSprinting(sprint: boolean) {
    this.isSprintToggled = sprint;
    this.keys.ShiftLeft = sprint;
    this.keys.ShiftRight = sprint;
  }

  private startLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(this.clock.getDelta(), 0.1);

      this.updatePlayer(delta);
      this.updateDetailedGhost(delta);
      this.updateProjectiles(delta);
      this.updateFlickerLights(delta);
      this.checkInteractions();
      this.updateStats(delta);

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private updatePlayer(delta: number) {
    if (this.isHiding) {
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.x = this.cameraPitch * 0.4;
      euler.y = this.cameraYaw;
      this.camera.quaternion.setFromEuler(euler);
      this.camera.position.copy(this.playerPos);
      return;
    }

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.cameraPitch;
    euler.y = this.cameraYaw;
    this.camera.quaternion.setFromEuler(euler);

    const moveDir = new THREE.Vector3();
    if (this.keys.KeyW || this.keys.ArrowUp) moveDir.z -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) moveDir.z += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) moveDir.x -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;
    const wantsSprint = this.keys.ShiftLeft || this.keys.ShiftRight || this.isSprintToggled;
    this.isSprinting = wantsSprint && isMoving && this.stamina > 4 && !this.isCrouching;

    if (this.isSprintToggled && this.stamina <= 0) {
      this.isSprintToggled = false;
    }

    let speed = 3.2;
    if (this.isSprinting) speed = 6.4;
    if (this.isCrouching) speed = 1.7;

    if (isMoving) {
      moveDir.normalize();
      moveDir.applyEuler(new THREE.Euler(0, this.cameraYaw, 0));

      const nextPos = this.playerPos.clone().addScaledVector(moveDir, speed * delta);

      const playerBox = new THREE.Box3(
        new THREE.Vector3(nextPos.x - 0.4, 0.2, nextPos.z - 0.4),
        new THREE.Vector3(nextPos.x + 0.4, 2.0, nextPos.z + 0.4)
      );

      let collided = false;
      for (const col of this.colliders) {
        if (col.intersectsBox(playerBox)) {
          collided = true;
          break;
        }
      }

      if (!collided) {
        this.playerPos.copy(nextPos);
      }

      this.footstepTimer += delta * (this.isSprinting ? 2.6 : 1.2);
      if (this.footstepTimer > 0.6) {
        this.footstepTimer = 0;
        horrorAudio.playFootstep(this.isSprinting, this.isCrouching);
        const noiseGen = this.isSprinting ? 35 : this.isCrouching ? 4 : 12;
        this.noise = Math.min(100, this.noise + noiseGen);
      }

      // Visceral head bobbing during movement (extra pronounced during sprint)
      this.headBobTimer += delta * (this.isSprinting ? 14 : 7);
      const bobAmount = this.isSprinting ? 0.045 : 0.018;
      this.camera.position.y += Math.sin(this.headBobTimer) * bobAmount;
    }

    // Dynamic cinematic FOV rush effect when running
    const targetFov = this.isSprinting ? 80 : 72;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * 8 * delta;
      this.camera.updateProjectionMatrix();
    }

    const targetHeight = this.isCrouching ? 1.05 : 1.65;
    this.playerPos.y += (targetHeight - this.playerPos.y) * 8 * delta;
    this.camera.position.copy(this.playerPos);

    // Flashlight & Aura light update
    this.flashlight.position.copy(this.camera.position);
    this.flashlightAura.position.copy(this.camera.position);
    const targetVector = new THREE.Vector3();
    this.camera.getWorldDirection(targetVector);
    this.flashlightTarget.position.copy(this.camera.position).add(targetVector.multiplyScalar(6));
  }

  private updateDetailedGhost(delta: number) {
    const distToPlayer = this.ghostPos.distanceTo(this.playerPos);
    const time = Date.now() * 0.001;

    // Ghost state logic
    if (this.ghostState === 'hunt') {
      this.ghostHuntTimer -= delta;
      this.ghostSpeed = 4.6;

      if (!this.isHiding) {
        this.ghostTarget.copy(this.playerPos);
      } else {
        this.ghostTarget.copy(this.ghostPos).add(
          new THREE.Vector3(Math.sin(time * 1.5) * 2, 0, Math.cos(time * 1.5) * 2)
        );
      }

      if (this.ghostHuntTimer <= 0) {
        this.ghostState = 'wandering';
        this.ghostSpeed = 2.4;
        this.callbacks.onNotification('Призрак отступил в тени... Охота окончена.');
      }

      if (distToPlayer < 1.4 && !this.isHiding) {
        horrorAudio.playHuntStinger();
        this.callbacks.onGameOver(false);
        return;
      }
    } else {
      // PROXIMITY AGGRESSION: Only aggressive when player is DIRECTLY CLOSE (< 4.0m)
      this.proximityWarnCooldown = Math.max(0, this.proximityWarnCooldown - delta);

      if (!this.isHiding) {
        // Player is exposed in the open
        if (distToPlayer < 4.0) {
          // DIRECT CLOSE PROXIMITY: Player is right in the ghost's personal space
          this.startActiveHunt('« ОНО ПРЯМО ПЕРЕД ТОБОЙ! ЛЕДЯНОЙ ХОЛОД СЖИМАЕТ ГОРЛО! »');
        } else if (distToPlayer < 8.5) {
          // MEDIUM PROXIMITY: Ghost is curious / suspicious, but DOES NOT immediately attack!
          if (this.isFlashlightOn) {
            // Light attracts curiosity
            this.proximityDetectTimer += delta * 0.8;
            if (this.proximityDetectTimer > 2.5) {
              this.proximityDetectTimer = 0;
              this.startActiveHunt('« ТЕНЬ РАЗГЛЯДЕЛА ТЕБЯ В ЛУЧЕ СВЕТА И РВАНУЛАСЬ ВПЕРЁД! »');
            } else {
              this.ghostTarget.copy(this.playerPos);
              if (this.proximityWarnCooldown <= 0) {
                this.proximityWarnCooldown = 3.5;
                this.callbacks.onNotification('« ТЕНЬ ОБРАТИЛА ВЗОР К СВЕТУ... ПОГАСИ ФОНАРЬ! »');
              }
            }
          } else if (this.isSprinting) {
            // Loud footsteps make ghost turn to investigate
            this.ghostState = 'investigating';
            this.ghostTarget.copy(this.playerPos);
            if (this.proximityWarnCooldown <= 0) {
              this.proximityWarnCooldown = 3.0;
              this.callbacks.onNotification('« ТЯЖЁЛЫЙ ТОПОТ ШАГОВ ПРИВЛЕК ТЕНЬ... »');
            }
          } else {
            // Walking or crouching quietly: ghost continues patrol or slowly looks around
            this.proximityDetectTimer = Math.max(0, this.proximityDetectTimer - delta);
          }
        } else {
          this.proximityDetectTimer = Math.max(0, this.proximityDetectTimer - delta * 0.5);
        }
      } else {
        // Player is inside a closet: only check when ghost is right next to the closet door
        if (distToPlayer < 3.2) {
          if (this.isFlashlightOn) {
            this.exitCloset();
            this.startActiveHunt('« СВЕТ ФОНАРИКА СКВОЗЬ ЩЕЛИ ВЫДАЛ ТЕБЯ! »');
          } else if (!this.isHoldingBreath) {
            this.proximityDetectTimer += delta * 1.0;
            if (this.proximityDetectTimer > 2.5) {
              this.proximityDetectTimer = 0;
              this.exitCloset();
              this.startActiveHunt('« ТВОЁ ДЫХАНИЕ ВЫДАЛО ТЕБЯ... ДВЕРЦА ШКАФА ВЫРВАНА! »');
            } else if (this.proximityWarnCooldown <= 0) {
              this.proximityWarnCooldown = 2.0;
              this.callbacks.onNotification('« ОНО ДЫШИТ ЗА ДВЕРЦЕЙ ШКАФА... ЗАДЕРЖИ ДЫХАНИЕ [ПРОБЕЛ]! »');
            }
          } else {
            // Safe while holding breath
            this.proximityDetectTimer = 0;
          }
        }
      }

      // If not triggered into hunt by proximity, handle normal patrol / investigation
      if (this.ghostState === 'investigating') {
        this.ghostSpeed = 3.2;
        if (this.ghostPos.distanceTo(this.ghostTarget) < 1.5) {
          this.ghostState = 'wandering';
        }
      } else if (this.ghostState === 'stalking') {
        this.ghostSpeed = 2.8;
      } else {
        this.ghostSpeed = 2.2;
        const wp = this.ghostWaypoints[this.currentWaypointIdx];
        this.ghostTarget.copy(wp);

        if (this.ghostPos.distanceTo(wp) < 1.5) {
          this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.ghostWaypoints.length;
        }

        if (this.noise > 70 && Math.random() < 0.03) {
          this.startActiveHunt('ГРОМКИЙ ШУМ СПРОВОЦИРОВАЛ ОХОТУ ПРИЗРАКА!');
        }
      }
    }

    // Move ghost toward target
    const dir = this.ghostTarget.clone().sub(this.ghostPos);
    dir.y = 0;
    if (dir.lengthSq() > 0.01) {
      dir.normalize();
      this.ghostPos.addScaledVector(dir, this.ghostSpeed * delta);
      this.ghostMesh.position.set(this.ghostPos.x, 0, this.ghostPos.z);
      this.ghostMesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      this.ghostMesh.position.set(this.ghostPos.x, 0, this.ghostPos.z);
    }

    // 3D Skeletal Animation Mixer update
    if (this.monsterMixer) {
      let animTimeScale = 1.0;
      if (this.ghostState === 'hunt') {
        animTimeScale = 1.95; // Violent rapid attack/run animation in hunt mode
      } else if (this.ghostState === 'investigating') {
        animTimeScale = 1.35; // Alert prowl
      } else if (this.ghostState === 'stalking') {
        animTimeScale = 1.15;
      } else {
        animTimeScale = 0.9;  // Slow eerie creep
      }
      this.monsterMixer.timeScale = animTimeScale;
      this.monsterMixer.update(delta);
    }

    // Demonic crimson aura lighting pulsating from the monster
    if (this.ghostRedGlowLight) {
      const isHunt = this.ghostState === 'hunt';
      this.ghostRedGlowLight.intensity = isHunt
        ? 3.6 + Math.sin(time * 12) * 1.4
        : 1.4 + Math.sin(time * 3) * 0.4;
      this.ghostRedGlowLight.color.setHex(isHunt ? 0xff0000 : 0xef4444);
    }

    // Swirling dark ash particle aura
    if (this.ghostAuraParticles) {
      this.ghostAuraParticles.rotation.y += delta * 1.2;
    }

    // Ghost footsteps audio
    this.ghostStepTimer += delta;
    if (this.ghostStepTimer > (this.ghostState === 'hunt' ? 0.35 : 0.8)) {
      this.ghostStepTimer = 0;
      if (distToPlayer < 24) {
        horrorAudio.playGhostStep();
      }
    }

    this.callbacks.onGhostStateChange(this.ghostState, distToPlayer);
    horrorAudio.updateSanityAndTension(this.sanity, this.ghostState === 'hunt', distToPlayer);
  }

  private updateProjectiles(delta: number) {
    for (let i = this.thrownProjectiles.length - 1; i >= 0; i--) {
      const proj = this.thrownProjectiles[i];
      proj.vel.y -= 18 * delta;
      proj.mesh.position.addScaledVector(proj.vel, delta);
      proj.life -= delta;

      if (proj.mesh.position.y <= 0.15 || proj.life <= 0) {
        horrorAudio.playGlassShatter();
        this.triggerGhostNoise(proj.mesh.position, 85);
        this.scene.remove(proj.mesh);
        this.thrownProjectiles.splice(i, 1);
        this.callbacks.onNotification('Звук разбившегося предмета отвлек призрака!');
      }
    }
  }

  private updateFlickerLights(delta: number) {
    const isHunt = this.ghostState === 'hunt';
    this.hallwayLights.forEach((light) => {
      if (isHunt) {
        light.color.setHex(Math.random() > 0.4 ? 0xff2222 : 0x220000);
        light.intensity = (Math.random() > 0.3 ? 3.0 : 0) * this.brightnessMultiplier;
      } else {
        if (Math.random() < 0.015) {
          light.intensity = 0.4 * this.brightnessMultiplier;
        } else {
          light.intensity = 2.4 * this.brightnessMultiplier;
        }
      }
    });

    // Flashlight battery & flicker near ghost
    if (this.isFlashlightOn) {
      this.battery = Math.max(0, this.battery - delta * 0.15);
      const ghostDist = this.ghostPos.distanceTo(this.playerPos);
      if (ghostDist < 12 && Math.random() < 0.15) {
        this.flashlight.intensity = 1.0 * this.brightnessMultiplier;
      } else {
        this.flashlight.intensity = (this.battery / 100) * 9.5 * this.brightnessMultiplier;
      }
    }
  }

  private checkInteractions() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = 3.0;

    const hits = raycaster.intersectObjects(this.interactables, true);
    if (hits.length > 0) {
      let root = hits[0].object;
      while (root.parent && root.parent !== this.scene && !root.userData?.name) {
        root = root.parent;
      }

      const data = root.userData;
      if (data?.isDoor) {
        this.currentInteractTarget = { type: 'door', id: data.doorId, name: data.name };
        this.callbacks.onInteractPrompt(`[E] Дверь: ${data.name}`);
        return;
      } else if (data?.isCloset) {
        this.currentInteractTarget = { type: 'closet', id: data.closetId, name: data.name };
        this.callbacks.onInteractPrompt(`[E] Спрятаться в шкаф`);
        return;
      } else if (data?.isRelic) {
        this.currentInteractTarget = { type: 'relic', id: data.relicId, name: data.name };
        this.callbacks.onInteractPrompt(`[E] Подобрать: ${data.name}`);
        return;
      } else if (data?.isThrowable) {
        this.currentInteractTarget = { type: 'throwable', id: data.throwableId, name: data.name };
        this.callbacks.onInteractPrompt(`[E] Взять для отвлечения: ${data.name}`);
        return;
      } else if (data?.isFuseBox) {
        this.currentInteractTarget = { type: 'fuseBox', id: 'fuse', name: data.name };
        this.callbacks.onInteractPrompt(`[E] Переключить электрощиток`);
        return;
      } else if (data?.isAltar) {
        this.currentInteractTarget = { type: 'altar', id: 'altar', name: data.name };
        this.callbacks.onInteractPrompt(`[E] Активировать ритуал изгнания`);
        return;
      } else if (data?.isExitGate) {
        this.currentInteractTarget = { type: 'exitGate', id: 'exit', name: data.name };
        this.callbacks.onInteractPrompt(`[E] Отпереть главные ворота`);
        return;
      }
    }

    this.currentInteractTarget = null;
    this.callbacks.onInteractPrompt(this.isHiding ? `[E] Выйти из шкафа | [Пробел] Затаить дыхание` : null);
  }

  private updateStats(delta: number) {
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - delta * 18);
      if (this.stamina <= 0) {
        horrorAudio.playGasp();
        this.callbacks.onNotification('« ДЫХАНИЕ СБИЛОСЬ... ВЫНОСЛИВОСТЬ ИСЧЕРПАНА »');
      }
    } else {
      this.stamina = Math.min(100, this.stamina + delta * 22);
    }

    if (this.isHoldingBreath) {
      this.breath = Math.max(0, this.breath - delta * 22);
      if (this.breath <= 0) {
        this.isHoldingBreath = false;
        horrorAudio.playGasp();
        this.triggerGhostNoise(this.playerPos, 50);
      }
    } else {
      this.breath = Math.min(100, this.breath + delta * 25);
    }

    this.noise = Math.max(0, this.noise - delta * 28);

    const dist = this.ghostPos.distanceTo(this.playerPos);
    let targetBpm = 72;
    if (this.ghostState === 'hunt') targetBpm = 145;
    else if (dist < 10) targetBpm = 115;
    else if (this.isSprinting) targetBpm = 100;

    this.bpm += (targetBpm - this.bpm) * delta * 2.0;

    this.heartbeatTimer += delta;
    const interval = 60 / this.bpm;
    if (this.heartbeatTimer >= interval) {
      this.heartbeatTimer = 0;
      horrorAudio.playHeartbeat(this.bpm);
    }

    this.callbacks.onStatsUpdate({
      sanity: this.sanity,
      stamina: this.stamina,
      breath: this.breath,
      noise: this.noise,
      battery: this.battery,
      isFlashlightOn: this.isFlashlightOn,
      isSprinting: this.isSprinting,
      isCrouching: this.isCrouching,
      isHoldingBreath: this.isHoldingBreath,
      isHiding: this.isHiding,
      bpm: Math.round(this.bpm),
    });
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    this.monsterMixer?.stopAllAction();
    this.renderer?.dispose();
    if (this.container && this.renderer?.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
