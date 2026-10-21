import * as THREE from 'three';
import { DoorData } from '../types/game';
import {
  getFloor2ParquetTexture,
  getSovietCarpetTexture,
  getHospitalTileFloorTexture,
  getArchivePlankFloorTexture,
} from './proceduralTextures';

interface Floor2BuilderParams {
  scene: THREE.Scene;
  colliders: THREE.Box3[];
  interactables: THREE.Object3D[];
  doors: Map<string, { data: DoorData; group: THREE.Group; pivot: THREE.Group }>;
  hallwayLights: THREE.PointLight[];
  brightnessMultiplier: number;
  wallTexture: THREE.Texture;
  floorTexture: THREE.Texture;
}

export function buildFloor2AndStairs(params: Floor2BuilderParams) {
  const {
    scene,
    colliders,
    interactables,
    doors,
    hallwayLights,
    brightnessMultiplier,
    wallTexture,
  } = params;

  // Custom high-quality procedural floor textures
  const floor2ParquetTex = getFloor2ParquetTexture();
  const carpetRunnerTex = getSovietCarpetTexture();
  const hospitalTileTex = getHospitalTileFloorTexture();
  const archivePlankTex = getArchivePlankFloorTexture();

  // Common materials
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.2,
  });

  const bronzeTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.85,
  });

  const carpetMat = new THREE.MeshStandardMaterial({
    map: carpetRunnerTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const f2ParquetMat = new THREE.MeshStandardMaterial({
    map: floor2ParquetTex,
    roughness: 0.55,
    metalness: 0.1,
  });


  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x27170c,
    roughness: 0.6,
  });

  // ==========================================================
  // 1. GRAND CENTRAL STAIRCASE (z: -17.0 to -24.5, x: -1.8 to 1.8)
  // ==========================================================
  const stairStepsCount = 14;
  const stepRise = 4.2 / stairStepsCount; // 0.30m
  const stepRun = 7.5 / stairStepsCount;  // ~0.535m
  const stairWidth = 3.6;

  for (let i = 0; i < stairStepsCount; i++) {
    const stepY = i * stepRise + stepRise / 2;
    const stepZ = -17.0 - i * stepRun - stepRun / 2;

    // Solid Marble Step
    const stepGeo = new THREE.BoxGeometry(stairWidth, stepRise, stepRun + 0.06);
    const step = new THREE.Mesh(stepGeo, marbleMat);
    step.position.set(0, stepY, stepZ);
    step.castShadow = true;
    step.receiveShadow = true;
    scene.add(step);

    // Bronze non-slip nose edge
    const trimGeo = new THREE.BoxGeometry(stairWidth, 0.03, 0.05);
    const trim = new THREE.Mesh(trimGeo, bronzeTrimMat);
    trim.position.set(0, stepRise / 2 - 0.015, stepRun / 2);
    step.add(trim);

    // Crimson runner on central 1.8m of stair
    const stepCarpetGeo = new THREE.BoxGeometry(1.8, 0.015, stepRun + 0.05);
    const stepCarpet = new THREE.Mesh(stepCarpetGeo, carpetMat);
    stepCarpet.position.set(0, stepRise / 2 + 0.008, 0);
    step.add(stepCarpet);

    // Polished brass stair rod securing carpet
    const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.9, 8);
    const rod = new THREE.Mesh(rodGeo, bronzeTrimMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, stepRise / 2 + 0.02, -stepRun / 2 + 0.03);
    step.add(rod);

    // Step Box Collider
    const stepBox = new THREE.Box3(
      new THREE.Vector3(-stairWidth / 2, 0, stepZ - stepRun / 2),
      new THREE.Vector3(stairWidth / 2, (i + 1) * stepRise, stepZ + stepRun / 2)
    );
    colliders.push(stepBox);
  }

  // Slanted brass handrails on left and right sides of the stairs
  [-stairWidth / 2 + 0.1, stairWidth / 2 - 0.1].forEach((railX) => {
    const p1 = new THREE.Vector3(railX, 0.9, -17.0);
    const p2 = new THREE.Vector3(railX, 4.2 + 0.9, -24.5);
    const railCurve = new THREE.LineCurve3(p1, p2);
    const railGeo = new THREE.TubeGeometry(railCurve, 14, 0.045, 8, false);
    const rail = new THREE.Mesh(railGeo, bronzeTrimMat);
    scene.add(rail);

    // Vertical supporting baluster posts
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const postPos = p1.clone().lerp(p2, t);
      const postHeight = postPos.y - (t * 4.2);
      const postGeo = new THREE.CylinderGeometry(0.025, 0.025, postHeight, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(railX, (t * 4.2) + postHeight / 2, postPos.z);
      scene.add(post);
    }
  });

  // ==========================================================
  // 2. FLOOR 2 SOLID FLOOR SLABS & UNDER-CEILING (Thickness: 0.35m)
  // ==========================================================
  const slabThickness = 0.35;
  const slabY = 4.2 - slabThickness / 2; // Center at y = 4.025 (top at 4.2, bottom at 3.85)

  // A) Top North Landing (z: -24.5 to -27.0, x: -3.8 to 3.8)
  const landingSlabGeo = new THREE.BoxGeometry(7.6, slabThickness, 2.5);
  const landingSlab = new THREE.Mesh(landingSlabGeo, f2ParquetMat);
  landingSlab.position.set(0, slabY, -25.75);
  landingSlab.receiveShadow = true;
  scene.add(landingSlab);

  // Red runner on landing
  const landingCarpet = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 2.5), carpetMat);
  landingCarpet.position.set(0, 4.21, -25.75);
  scene.add(landingCarpet);

  // B) West Upper Walkway Gallery (x: -3.8 to -1.85, z: -17.0 to -24.5)
  const westWalkwayGeo = new THREE.BoxGeometry(1.95, slabThickness, 7.5);
  const westWalkway = new THREE.Mesh(westWalkwayGeo, f2ParquetMat);
  westWalkway.position.set(-2.825, slabY, -20.75);
  westWalkway.receiveShadow = true;
  scene.add(westWalkway);

  const westCarpet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 7.5), carpetMat);
  westCarpet.position.set(-2.825, 4.21, -20.75);
  scene.add(westCarpet);

  // C) East Upper Walkway Gallery (x: 1.85 to 3.8, z: -17.0 to -24.5)
  const eastWalkwayGeo = new THREE.BoxGeometry(1.95, slabThickness, 7.5);
  const eastWalkway = new THREE.Mesh(eastWalkwayGeo, f2ParquetMat);
  eastWalkway.position.set(2.825, slabY, -20.75);
  eastWalkway.receiveShadow = true;
  scene.add(eastWalkway);

  const eastCarpet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 7.5), carpetMat);
  eastCarpet.position.set(2.825, 4.21, -20.75);
  scene.add(eastCarpet);

  // D) Main Floor 2 Hallway Slab (x: -3.6 to 3.6, z: -17.0 to 24.0)
  const f2HallGeo = new THREE.BoxGeometry(7.2, slabThickness, 41.0);
  const f2Hall = new THREE.Mesh(f2HallGeo, f2ParquetMat);
  f2Hall.position.set(0, slabY, 3.5);
  f2Hall.receiveShadow = true;
  scene.add(f2Hall);

  // Ceremonial Red Carpet Runner down the entire 2nd floor hallway
  const hallCarpetGeo = new THREE.BoxGeometry(2.0, 0.02, 41.0);
  const hallCarpet = new THREE.Mesh(hallCarpetGeo, carpetMat);
  hallCarpet.position.set(0, 4.21, 3.5);
  hallCarpet.receiveShadow = true;
  scene.add(hallCarpet);

  // E) Room 5 Floor Slab: Кабинет Директора (x: -18 to -3.6, z: -17 to 2)
  const dirFloorGeo = new THREE.BoxGeometry(14.4, slabThickness, 19.0);
  const dirFloor = new THREE.Mesh(dirFloorGeo, f2ParquetMat);
  dirFloor.position.set(-10.8, slabY, -7.5);
  dirFloor.receiveShadow = true;
  scene.add(dirFloor);

  // Persian wool rug under Director's desk
  const persianRugGeo = new THREE.BoxGeometry(5.2, 0.02, 3.8);
  const persianRugMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const persianRug = new THREE.Mesh(persianRugGeo, persianRugMat);
  persianRug.position.set(-12.0, 4.21, -11.0);
  scene.add(persianRug);

  // Persian rug golden decorative inner border
  const rugBorderGeo = new THREE.BoxGeometry(4.8, 0.022, 3.4);
  const rugBorderMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.8 });
  const rugBorder = new THREE.Mesh(rugBorderGeo, rugBorderMat);
  rugBorder.position.set(-12.0, 4.211, -11.0);
  scene.add(rugBorder);

  // E) Room 6 Floor Slab: Архив и Картотека (x: 3.6 to 18, z: -17 to 2)
  const archiveFloorGeo = new THREE.BoxGeometry(14.4, slabThickness, 19.0);
  const archiveMat = new THREE.MeshStandardMaterial({ map: archivePlankTex, roughness: 0.8, metalness: 0.05 });
  const archiveFloor = new THREE.Mesh(archiveFloorGeo, archiveMat);
  archiveFloor.position.set(10.8, slabY, -7.5);
  archiveFloor.receiveShadow = true;
  scene.add(archiveFloor);

  // F) Room 7 Floor Slab: Радиоузел и Кинозал (x: -18 to -3.6, z: 2 to 24)
  const radioFloorGeo = new THREE.BoxGeometry(14.4, slabThickness, 22.0);
  const radioFloorMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7, metalness: 0.2 });
  const radioFloor = new THREE.Mesh(radioFloorGeo, radioFloorMat);
  radioFloor.position.set(-10.8, slabY, 13.0);
  radioFloor.receiveShadow = true;
  scene.add(radioFloor);

  // G) Room 8 Floor Slab: Медпункт и Изолятор (x: 3.6 to 18, z: 2 to 24)
  const hospFloorGeo = new THREE.BoxGeometry(14.4, slabThickness, 22.0);
  const hospMat = new THREE.MeshStandardMaterial({ map: hospitalTileTex, roughness: 0.4, metalness: 0.1 });
  const hospFloor = new THREE.Mesh(hospFloorGeo, hospMat);
  hospFloor.position.set(10.8, slabY, 13.0);
  hospFloor.receiveShadow = true;
  scene.add(hospFloor);

  // H) South Moonlit Balcony Floor (x: -18 to 18, z: 24 to 27)
  const balconyFloorGeo = new THREE.BoxGeometry(36.0, slabThickness, 3.0);
  const balconyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 });
  const balconyFloor = new THREE.Mesh(balconyFloorGeo, balconyMat);
  balconyFloor.position.set(0, slabY, 25.5);
  balconyFloor.receiveShadow = true;
  scene.add(balconyFloor);


  // Baseboards / Plinth along Hallway Walls (0.12m high, dark polished wood)
  const createPlinth = (x: number, z: number, w: number, d: number) => {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), plinthMat);
    plinth.position.set(x, 4.26, z);
    scene.add(plinth);
  };

  createPlinth(-3.55, 3.5, 0.08, 41.0); // West corridor wall plinth
  createPlinth(3.55, 3.5, 0.08, 41.0);  // East corridor wall plinth
  createPlinth(-3.75, -20.75, 0.08, 7.5); // West walkway outer plinth
  createPlinth(3.75, -20.75, 0.08, 7.5);  // East walkway outer plinth

  // ==========================================================
  // 3. STAIRWELL ATRIUM BALUSTRADES (Surrounds open hole at y = 4.2)
  // ==========================================================
  const buildBalustrade = (p1: THREE.Vector3, p2: THREE.Vector3) => {
    const dir = p2.clone().sub(p1);
    const length = dir.length();
    const center = p1.clone().add(p2).multiplyScalar(0.5);

    // Top Handrail
    const railGeo = new THREE.BoxGeometry(0.12, 0.08, length);
    const rail = new THREE.Mesh(railGeo, bronzeTrimMat);
    rail.position.set(center.x, 4.2 + 0.9, center.z);
    if (Math.abs(dir.x) > Math.abs(dir.z)) {
      rail.rotation.y = Math.PI / 2;
    }
    scene.add(rail);

    // Rail Collider to prevent falling into stairwell
    const railCol = new THREE.BoxGeometry(
      Math.abs(dir.x) > Math.abs(dir.z) ? length : 0.25,
      1.1,
      Math.abs(dir.z) >= Math.abs(dir.x) ? length : 0.25
    );
    const railColMesh = new THREE.Mesh(railCol, new THREE.MeshBasicMaterial({ visible: false }));
    railColMesh.position.set(center.x, 4.75, center.z);
    scene.add(railColMesh);
    colliders.push(new THREE.Box3().setFromObject(railColMesh));

    // Bottom Base Rail
    const baseGeo = new THREE.BoxGeometry(0.14, 0.06, length);
    const base = new THREE.Mesh(baseGeo, plinthMat);
    base.position.set(center.x, 4.23, center.z);
    if (Math.abs(dir.x) > Math.abs(dir.z)) {
      base.rotation.y = Math.PI / 2;
    }
    scene.add(base);

    // Vertical decorative balusters
    const count = Math.max(2, Math.floor(length / 0.35));
    for (let i = 0; i <= count; i++) {
      const pos = p1.clone().lerp(p2, i / count);
      const postGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos.x, 4.2 + 0.45, pos.z);
      scene.add(post);
    }

    // Heavy square corner pedestal posts
    [p1, p2].forEach((cp) => {
      const pedGeo = new THREE.BoxGeometry(0.18, 0.98, 0.18);
      const ped = new THREE.Mesh(pedGeo, marbleMat);
      ped.position.set(cp.x, 4.2 + 0.49, cp.z);
      scene.add(ped);
    });
  };

  // West side of atrium opening
  buildBalustrade(new THREE.Vector3(-1.85, 0, -17.0), new THREE.Vector3(-1.85, 0, -24.5));
  // East side of atrium opening
  buildBalustrade(new THREE.Vector3(1.85, 0, -17.0), new THREE.Vector3(1.85, 0, -24.5));
  // South side overlooking the stairs (leaves walkways at x < -1.85 and x > 1.85 open!)
  buildBalustrade(new THREE.Vector3(-1.85, 0, -17.0), new THREE.Vector3(1.85, 0, -17.0));

  // ==========================================================
  // 4. CEILING & WALLS OF FLOOR 2 (y = 4.2 to 8.0)
  // ==========================================================
  // High Ceiling over Floor 2 at y = 8.0
  const ceil2Geo = new THREE.PlaneGeometry(40, 64);
  const ceil2Mat = new THREE.MeshStandardMaterial({ color: 0x1e2429, roughness: 0.9 });
  const ceil2 = new THREE.Mesh(ceil2Geo, ceil2Mat);
  ceil2.rotation.x = Math.PI / 2;
  ceil2.position.set(0, 8.0, 0);
  scene.add(ceil2);

  // Floor 2 Outer Walls
  createDetailedWall(scene, colliders, 0, 6.1, 27, 38, 3.8, 0.6, wallTexture);   // South
  createDetailedWall(scene, colliders, 0, 6.1, -27, 38, 3.8, 0.6, wallTexture);  // North
  createDetailedWall(scene, colliders, -19, 6.1, 0, 0.6, 3.8, 54, wallTexture);  // West
  createDetailedWall(scene, colliders, 19, 6.1, 0, 0.6, 3.8, 54, wallTexture);   // East

  // Floor 2 Partition Walls separating rooms:
  createDetailedWall(scene, colliders, -11.25, 6.1, 2, 15.5, 3.8, 0.5, wallTexture);
  createDetailedWall(scene, colliders, 11.25, 6.1, 2, 15.5, 3.8, 0.5, wallTexture);
  createDetailedWall(scene, colliders, -11.25, 6.1, 24, 15.5, 3.8, 0.5, wallTexture);
  createDetailedWall(scene, colliders, 11.25, 6.1, 24, 15.5, 3.8, 0.5, wallTexture);

  // Corridor West Wall at x = -3.5 (y = 6.1):
  createDetailedWall(scene, colliders, -3.5, 6.1, -4.15, 0.5, 3.8, 12.3, wallTexture);
  createDoor(doors, interactables, colliders, scene, 'f2_door_director', 'Кабинет Директора', '2 Этаж', [-3.5, 4.2, -11], 0);
  createDetailedWall(scene, colliders, -3.5, 6.1, -17.85, 0.5, 3.8, 12.3, wallTexture);

  createDetailedWall(scene, colliders, -3.5, 6.1, 18.85, 0.5, 3.8, 10.3, wallTexture);
  createDoor(doors, interactables, colliders, scene, 'f2_door_radio', 'Радиоузел и Кинозал', '2 Этаж', [-3.5, 4.2, 13], 0);
  createDetailedWall(scene, colliders, -3.5, 6.1, 7.15, 0.5, 3.8, 10.3, wallTexture);

  // Corridor East Wall at x = 3.5 (y = 6.1):
  createDetailedWall(scene, colliders, 3.5, 6.1, -4.15, 0.5, 3.8, 12.3, wallTexture);
  createDoor(doors, interactables, colliders, scene, 'f2_door_archive', 'Архив и Картотека', '2 Этаж', [3.5, 4.2, -11], Math.PI);
  createDetailedWall(scene, colliders, 3.5, 6.1, -17.85, 0.5, 3.8, 12.3, wallTexture);

  createDetailedWall(scene, colliders, 3.5, 6.1, 18.85, 0.5, 3.8, 10.3, wallTexture);
  createDoor(doors, interactables, colliders, scene, 'f2_door_infirmary', 'Медпункт и Изолятор', '2 Этаж', [3.5, 4.2, 13], Math.PI);
  createDetailedWall(scene, colliders, 3.5, 6.1, 7.15, 0.5, 3.8, 10.3, wallTexture);

  // ==========================================================
  // 5. FLOOR 2 CORRIDOR LIGHTS & ATMOSPHERE
  // ==========================================================
  const f2LightZ = [20, 10, 0, -10, -22];
  f2LightZ.forEach((z) => {
    const lamp = new THREE.PointLight(0xdcf0ff, 2.2 * brightnessMultiplier, 22, 1.2);
    lamp.position.set(0, 7.6, z);
    scene.add(lamp);
    hallwayLights.push(lamp);

    // Glowing tube fixture
    const fixtureGeo = new THREE.BoxGeometry(0.5, 0.1, 2.0);
    const fixtureMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(0, 7.7, z);

    const tubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xdff4ff,
      emissiveIntensity: 2.2,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.x = Math.PI / 2;
    fixture.add(tube);
    scene.add(fixture);
  });

  // Soviet school sign: «2 ЭТАЖ • УЧЕБНЫЙ КОРПУС»
  const signGeo = new THREE.BoxGeometry(2.4, 0.6, 0.08);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 6.4, -26.5);
  scene.add(sign);

  // ==========================================================
  // 6. BUILD DETAILED ROOMS
  // ==========================================================
  buildDirectorsSanctum(scene, colliders, interactables, brightnessMultiplier);
  buildArchiveRoom(scene, colliders, interactables, brightnessMultiplier);
  buildRadioStationRoom(scene, colliders, interactables, brightnessMultiplier);
  buildInfirmaryRoom(scene, colliders, interactables, brightnessMultiplier);
  buildSouthernBalcony(scene);
}

// -------------------------------------------------------------
// ROOM BUILDERS
// -------------------------------------------------------------

function buildDirectorsSanctum(
  scene: THREE.Scene,
  colliders: THREE.Box3[],
  interactables: THREE.Object3D[],
  brightness: number
) {
  // Chandelier
  const light = new THREE.PointLight(0xfef08a, 2.5 * brightness, 18);
  light.position.set(-11, 7.2, -11);
  scene.add(light);

  // Executive Oak Desk
  const deskGeo = new THREE.BoxGeometry(3.0, 0.1, 1.4);
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x3d1c06, roughness: 0.5 });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.set(-12, 5.0, -11);
  scene.add(desk);
  colliders.push(new THREE.Box3().setFromObject(desk));

  // Desk legs
  for (let ox of [-1.3, 1.3]) {
    for (let oz of [-0.55, 0.55]) {
      const legGeo = new THREE.BoxGeometry(0.12, 0.8, 0.12);
      const leg = new THREE.Mesh(legGeo, deskMat);
      leg.position.set(-12 + ox, 4.6, -11 + oz);
      scene.add(leg);
    }
  }

  // Banker's Green Lamp
  const lampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 })
  );
  lampBase.position.set(-12.8, 5.22, -11.2);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.14, 0.2, 8, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.2 })
  );
  shade.rotation.z = Math.PI / 2;
  shade.position.set(-12.8, 5.4, -11.2);
  scene.add(lampBase);
  scene.add(shade);

  // Armored Steel Wall Safe (Interactable)
  const safeGeo = new THREE.BoxGeometry(1.2, 1.4, 0.8);
  const safeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.3 });
  const safe = new THREE.Mesh(safeGeo, safeMat);
  safe.position.set(-18.1, 5.2, -11);
  safe.userData = { isSafe: true, safeId: 'director_safe', name: 'Бронированный сейф директора школы' };
  scene.add(safe);
  interactables.push(safe);
  colliders.push(new THREE.Box3().setFromObject(safe));

  // Combination Dial on safe
  const dialGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  const dialMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
  const dial = new THREE.Mesh(dialGeo, dialMat);
  dial.rotation.z = Math.PI / 2;
  dial.position.set(0.42, 0, 0);
  safe.add(dial);
}

function buildArchiveRoom(
  scene: THREE.Scene,
  colliders: THREE.Box3[],
  interactables: THREE.Object3D[],
  brightness: number
) {
  // Dim yellow archival light
  const light = new THREE.PointLight(0xfde047, 1.8 * brightness, 16);
  light.position.set(11, 7.2, -11);
  scene.add(light);

  // Metal Archive Shelf Stacks
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.6 });
  for (let row = 0; row < 3; row++) {
    const stackGeo = new THREE.BoxGeometry(0.7, 3.2, 5.5);
    const stack = new THREE.Mesh(stackGeo, shelfMat);
    stack.position.set(7 + row * 3.5, 5.8, -11);
    scene.add(stack);
    colliders.push(new THREE.Box3().setFromObject(stack));

    // Yellowed book & folder spines
    for (let shelf = 0; shelf < 4; shelf++) {
      const folderGeo = new THREE.BoxGeometry(0.65, 0.05, 5.2);
      const folderMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
      const folder = new THREE.Mesh(folderGeo, folderMat);
      folder.position.set(0, -1.2 + shelf * 0.8, 0);
      stack.add(folder);
    }
  }

  // Scattered archival files on the floor
  const paperGeo = new THREE.PlaneGeometry(0.4, 0.6);
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = Math.random() * Math.PI;
    paper.position.set(9 + Math.random() * 4, 4.22, -14 + Math.random() * 6);
    scene.add(paper);
  }
}

function buildRadioStationRoom(
  scene: THREE.Scene,
  colliders: THREE.Box3[],
  interactables: THREE.Object3D[],
  brightness: number
) {
  // Red/cyan radio studio mood light
  const light = new THREE.PointLight(0x38bdf8, 2.0 * brightness, 18);
  light.position.set(-11, 7.2, 13);
  scene.add(light);

  // Sound console desk
  const consoleGeo = new THREE.BoxGeometry(3.2, 0.9, 1.2);
  const consoleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
  const soundDesk = new THREE.Mesh(consoleGeo, consoleMat);
  soundDesk.position.set(-12, 4.65, 13);
  scene.add(soundDesk);
  colliders.push(new THREE.Box3().setFromObject(soundDesk));

  // Reel-to-reel tape recorder «Маяк-205»
  const reelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16);
  const reelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
  [-0.35, 0.35].forEach((rx) => {
    const reel = new THREE.Mesh(reelGeo, reelMat);
    reel.position.set(rx, 0.55, 0);
    soundDesk.add(reel);
  });

  // Emergency Fire Bell Switch Console (Interactable!)
  const switchBoxGeo = new THREE.BoxGeometry(0.35, 0.5, 0.2);
  const switchBoxMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const switchBox = new THREE.Mesh(switchBoxGeo, switchBoxMat);
  switchBox.position.set(-18.1, 5.6, 13);
  switchBox.userData = { isBellSwitch: true, name: 'Пульт включения школьной пожарной сирены' };
  scene.add(switchBox);
  interactables.push(switchBox);

  // Big red bell button
  const btnGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
  const btnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 1.5 });
  const btn = new THREE.Mesh(btnGeo, btnMat);
  btn.rotation.z = Math.PI / 2;
  btn.position.set(0.12, 0, 0);
  switchBox.add(btn);

  // Hanging movie projector screen
  const screenGeo = new THREE.PlaneGeometry(3.6, 2.4);
  const screenMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
  const projScreen = new THREE.Mesh(screenGeo, screenMat);
  projScreen.position.set(-10, 6.2, 23.5);
  scene.add(projScreen);
}

function buildInfirmaryRoom(
  scene: THREE.Scene,
  colliders: THREE.Box3[],
  interactables: THREE.Object3D[],
  brightness: number
) {
  // Pale clinical white/cyan light
  const light = new THREE.PointLight(0xe0f2fe, 2.2 * brightness, 18);
  light.position.set(11, 7.2, 13);
  scene.add(light);

  // Hospital beds with white sheets
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

  for (let b = 0; b < 2; b++) {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(8 + b * 4.5, 4.2, 10);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.4), bedMat);
    mattress.position.y = 0.4;
    bedGroup.add(mattress);

    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.45), bedMat);
    pillow.position.set(0, 0.65, -0.85);
    bedGroup.add(pillow);

    scene.add(bedGroup);
    colliders.push(new THREE.Box3().setFromObject(bedGroup));
  }

  // Medical privacy screen partition
  const screenGeo = new THREE.BoxGeometry(0.08, 1.9, 2.6);
  const screenMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
  const medScreen = new THREE.Mesh(screenGeo, screenMat);
  medScreen.position.set(11.5, 5.15, 16.5);
  scene.add(medScreen);
  colliders.push(new THREE.Box3().setFromObject(medScreen));

  // Glass Medicine Cabinet
  const cabGeo = new THREE.BoxGeometry(0.4, 1.8, 1.0);
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.3, roughness: 0.2 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(18.2, 5.1, 13);
  scene.add(cab);
  colliders.push(new THREE.Box3().setFromObject(cab));
}

function buildSouthernBalcony(scene: THREE.Scene) {
  // Large Moonlit Arched Stained-Glass Window at Floor 2 South (z = 26.8)
  const windowGeo = new THREE.PlaneGeometry(5.2, 3.4);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.55,
    roughness: 0.2,
  });
  const win = new THREE.Mesh(windowGeo, windowMat);
  win.position.set(0, 6.2, 26.7);
  win.rotation.y = Math.PI;
  scene.add(win);

  // Moonlight beam
  const moonBeam = new THREE.SpotLight(0x7dd3fc, 3.5, 30, Math.PI / 4, 0.6);
  moonBeam.position.set(0, 7.5, 26.5);
  moonBeam.target.position.set(0, 4.2, 16);
  scene.add(moonBeam);
  scene.add(moonBeam.target);
}

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------

function createDetailedWall(
  scene: THREE.Scene,
  colliders: THREE.Box3[],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  tex: THREE.Texture
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.05 });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  colliders.push(new THREE.Box3().setFromObject(wall));
  return wall;
}

function createDoor(
  doors: Map<string, { data: DoorData; group: THREE.Group; pivot: THREE.Group }>,
  interactables: THREE.Object3D[],
  colliders: THREE.Box3[],
  scene: THREE.Scene,
  id: string,
  name: string,
  roomName: string,
  pos: [number, number, number],
  rotY: number
) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.y = rotY;

  const pivot = new THREE.Group();
  pivot.position.set(0, 0, -0.64);

  const doorGeo = new THREE.BoxGeometry(0.1, 2.6, 1.28);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.7 });
  const doorMesh = new THREE.Mesh(doorGeo, doorMat);
  doorMesh.position.set(0, 1.3, 0.64);
  doorMesh.castShadow = true;
  doorMesh.userData = { isDoor: true, doorId: id, name };

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 })
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0.08, 1.1, 1.1);
  doorMesh.add(handle);

  pivot.add(doorMesh);
  group.add(pivot);
  scene.add(group);

  const doorData: DoorData = {
    id,
    name,
    roomName,
    isOpen: false,
    isBarricaded: false,
    barricadeHealth: 100,
    position: pos,
    rotation: rotY,
    floor: 2,
  };

  doors.set(id, { data: doorData, group, pivot });
  interactables.push(doorMesh);
  colliders.push(new THREE.Box3().setFromObject(doorMesh));
}
