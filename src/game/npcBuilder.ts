import * as THREE from 'three';
import { NPCData } from '../types/game';

export interface NpcActor {
  data: NPCData;
  group: THREE.Group;
  update: (time: number, delta: number) => void;
}

export function buildNpcActors(
  scene: THREE.Scene,
  interactables: THREE.Object3D[],
  colliders: THREE.Box3[]
): { actors: Map<string, NpcActor>; updateAll: (time: number, delta: number) => void } {
  const actors = new Map<string, NpcActor>();

  // ========================================================
  // 1. АЛЕКСЕЙ — ЗАПУГАННЫЙ ДЕВЯТИКЛАССНИК (МЕДПУНКТ, 2 ЭТАЖ)
  // ========================================================
  const alexeyGroup = new THREE.Group();
  alexeyGroup.position.set(12.5, 4.2, 17.5);
  alexeyGroup.rotation.y = -Math.PI / 3;

  // Blue Soviet school jacket & body (crouched sitting pose)
  const alexeyBodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35);
  const alexeySuitMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
  const alexeyBody = new THREE.Mesh(alexeyBodyGeo, alexeySuitMat);
  alexeyBody.position.y = 0.55;
  alexeyGroup.add(alexeyBody);

  // Red Pioneer Tie
  const tieGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.rotation.x = Math.PI;
  tie.position.set(0, 0.65, 0.2);
  alexeyGroup.add(tie);

  // Head with disheveled dark hair
  const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 0.98, 0.05);
  alexeyGroup.add(head);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.19, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x271810, roughness: 0.9 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.01, 0.04);
  alexeyGroup.add(hair);

  // Legs curled to chest
  const legsGeo = new THREE.BoxGeometry(0.44, 0.35, 0.45);
  const legs = new THREE.Mesh(legsGeo, alexeySuitMat);
  legs.position.set(0, 0.22, 0.15);
  alexeyGroup.add(legs);

  // Small handheld flashlight resting on the floor
  const flGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8);
  const flMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8 });
  const fl = new THREE.Mesh(flGeo, flMat);
  fl.rotation.z = Math.PI / 2;
  fl.position.set(0.35, 0.05, 0.2);
  alexeyGroup.add(fl);

  // Interaction trigger box
  const alexeyHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.6, 1.2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  alexeyHitbox.position.y = 0.8;
  alexeyHitbox.userData = { isNpc: true, npcId: 'alexey', name: 'Алексей (Ученик 9-Б)' };
  alexeyGroup.add(alexeyHitbox);

  scene.add(alexeyGroup);
  interactables.push(alexeyHitbox);
  colliders.push(new THREE.Box3().setFromObject(alexeyGroup));

  const alexeyData: NPCData = {
    id: 'alexey',
    name: 'Алексей',
    title: 'Запуганный девятиклассник (Ученик 9-Б)',
    role: 'student',
    floor: 2,
    roomName: 'Медпункт и Изолятор',
    position: [12.5, 4.2, 17.5],
    portraitUrl: '/src/assets/images/alexey_student_portrait_1792592255622.jpg',
    dialogue: {
      intro: 'Тише! Пригнись! Оно ходит по коридорам... Я спрятался за ширмой, когда они начали этот проклятый ритуал.',
      options: [
        {
          text: 'Как ты выжил? Что случилось?',
          response: 'Они заперли двери и читали заклятие на оккультном мелу... Потом загремели цепи, свет замигал, и появилось ЭТО. Все разбежались, но выходы уже были отрезаны!',
        },
        {
          text: 'У тебя есть что-нибудь полезное?',
          response: 'Вот, держи! Я нашёл в аптечке запасные сухие элементы к фонарю. Возьми их! Только не шуми, присядь на корточки — в приседе шаги неслышны!',
          giveItem: {
            id: 'battery_boost',
            name: 'Запасной аккумулятор (+50% заряда)',
            type: 'battery',
          },
        },
        {
          text: 'Где выход из флигеля?',
          response: 'Главный выход запечатан на первом этаже в южном конце коридора. Нужен ритуал очищения: мел, соль, звонок и ключ. Сторож дядя Миша на втором этаже в Архиве знает больше!',
        },
      ],
    },
  };

  actors.set('alexey', {
    data: alexeyData,
    group: alexeyGroup,
    update: (time) => {
      // Shiver & heavy anxious breathing
      alexeyBody.position.y = 0.55 + Math.sin(time * 5) * 0.015;
      head.rotation.y = Math.sin(time * 2) * 0.15;
    },
  });

  // ========================================================
  // 2. ДЯДЯ МИША — НОЧНОЙ СТОРОЖ ФЛИГЕЛЯ (АРХИВ, 2 ЭТАЖ)
  // ========================================================
  const mishaGroup = new THREE.Group();
  mishaGroup.position.set(11.5, 4.2, -12);
  mishaGroup.rotation.y = -Math.PI / 4;

  // Sturdy wooden crate to sit on
  const crateGeo = new THREE.BoxGeometry(0.8, 0.55, 0.8);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 0.28;
  mishaGroup.add(crate);

  // Quilted heavy winter coat (Vatnik/Fufaika)
  const coatGeo = new THREE.BoxGeometry(0.65, 0.75, 0.45);
  const coatMat = new THREE.MeshStandardMaterial({ color: 0x3f4234, roughness: 0.85 });
  const coat = new THREE.Mesh(coatGeo, coatMat);
  coat.position.y = 0.85;
  mishaGroup.add(coat);

  // Head with gray mustache & wrinkles
  const mishaHeadGeo = new THREE.SphereGeometry(0.2, 12, 12);
  const mishaSkinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 });
  const mishaHead = new THREE.Mesh(mishaHeadGeo, mishaSkinMat);
  mishaHead.position.set(0, 1.35, 0.05);
  mishaGroup.add(mishaHead);

  // Fur Ushanka hat with earflaps
  const ushankaGeo = new THREE.BoxGeometry(0.48, 0.25, 0.48);
  const ushankaMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.9 });
  const ushanka = new THREE.Mesh(ushankaGeo, ushankaMat);
  ushanka.position.set(0, 1.5, 0.05);
  mishaGroup.add(ushanka);

  // Gray thick mustache
  const mustacheGeo = new THREE.BoxGeometry(0.18, 0.05, 0.08);
  const mustacheMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8 });
  const mustache = new THREE.Mesh(mustacheGeo, mustacheMat);
  mustache.position.set(0, 1.3, 0.22);
  mishaGroup.add(mustache);

  // Vintage Kerosene Lantern with glowing flame point light
  const lanternGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8);
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.7 });
  const lantern = new THREE.Mesh(lanternGeo, lanternMat);
  lantern.position.set(-0.45, 0.65, 0.25);
  mishaGroup.add(lantern);

  const lanternLight = new THREE.PointLight(0xf59e0b, 2.2, 8, 1.2);
  lanternLight.position.set(-0.45, 0.75, 0.25);
  mishaGroup.add(lanternLight);

  // Hitbox
  const mishaHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.8, 1.4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  mishaHitbox.position.y = 0.9;
  mishaHitbox.userData = { isNpc: true, npcId: 'misha', name: 'Дядя Миша (Сторож)' };
  mishaGroup.add(mishaHitbox);

  scene.add(mishaGroup);
  interactables.push(mishaHitbox);
  colliders.push(new THREE.Box3().setFromObject(mishaGroup));

  const mishaData: NPCData = {
    id: 'misha',
    name: 'Михаил Семёнович (Дядя Миша)',
    title: 'Ночной сторож заброшенного флигеля',
    role: 'watchman',
    floor: 2,
    roomName: 'Архив и Картотека',
    position: [11.5, 4.2, -12],
    portraitUrl: '/src/assets/images/watchman_misha_portrait_1792592273636.jpg',
    dialogue: {
      intro: 'Кто здесь?! А, живой человек... Слава богу. Не шуми, сынок. В 1974-м я уже видел эту тварь, когда закрывали школу.',
      options: [
        {
          text: 'Дядя Миша, как победить эту тень?',
          response: 'Её не одолеть кулаками! Она боится ритуального круга в Котельной и громкого звука пожарного колокола. Когда бьёт звонок — она в ужасе замирает и отступает в подвал!',
        },
        {
          text: 'Как попасть в кабинет директора?',
          response: 'Вот он, мой стальной мастер-ключ от кабинета на втором этаже напротив! В кабинете за картиной спрятан бронированный сейф с печатью изгнания. Забери его!',
          giveItem: {
            id: 'master_key',
            name: 'Стальной мастер-ключ директора',
            type: 'key',
          },
        },
        {
          text: 'Вы пойдёте со мной к выходу?',
          response: 'Нога у меня подвернута, я вас прикрою отсюда. Беги, найди все четыре святыни, включи рубильник на 1-м этаже и сними печать с главного выхода!',
        },
      ],
    },
  };

  actors.set('misha', {
    data: mishaData,
    group: mishaGroup,
    update: (time) => {
      lanternLight.intensity = 2.0 + Math.sin(time * 8) * 0.3;
      mishaHead.rotation.y = Math.sin(time * 0.8) * 0.08;
    },
  });

  // ========================================================
  // 3. ТАНЯ — ПРИЗРАЧНАЯ ДЕВОЧКА (ВЕРХНЯЯ ГАЛЕРЕЯ, 2 ЭТАЖ)
  // ========================================================
  const tanyaGroup = new THREE.Group();
  tanyaGroup.position.set(0, 4.5, 22.5);

  // Translucent glowing ghostly body
  const tanyaMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.65,
    roughness: 0.3,
  });

  const dressGeo = new THREE.ConeGeometry(0.35, 0.9, 12);
  const dress = new THREE.Mesh(dressGeo, tanyaMat);
  dress.position.y = 0.55;
  tanyaGroup.add(dress);

  const apronMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.75,
  });
  const apronGeo = new THREE.BoxGeometry(0.3, 0.45, 0.22);
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.position.set(0, 0.65, 0.08);
  tanyaGroup.add(apron);

  // Head with ethereal ribbons
  const tHeadGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const tHead = new THREE.Mesh(tHeadGeo, tanyaMat);
  tHead.position.set(0, 1.15, 0);
  tanyaGroup.add(tHead);

  // White ribbons
  const ribbonGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  [-0.18, 0.18].forEach((rx) => {
    const ribbon = new THREE.Mesh(ribbonGeo, apronMat);
    ribbon.position.set(rx, 1.25, -0.05);
    tanyaGroup.add(ribbon);
  });

  // Ethereal point light
  const tanyaGlow = new THREE.PointLight(0x38bdf8, 2.5, 7);
  tanyaGlow.position.set(0, 1.0, 0);
  tanyaGroup.add(tanyaGlow);

  // Spectral dust particles
  const partCount = 35;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 1.5;
    pPos[i * 3 + 1] = Math.random() * 1.8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.06,
    transparent: true,
    opacity: 0.8,
  });
  const particles = new THREE.Points(pGeo, pMat);
  tanyaGroup.add(particles);

  // Hitbox
  const tanyaHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.8, 1.2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  tanyaHitbox.position.y = 0.9;
  tanyaHitbox.userData = { isNpc: true, npcId: 'tanya', name: 'Таня (Призрак 1974 года)' };
  tanyaGroup.add(tanyaHitbox);

  scene.add(tanyaGroup);
  interactables.push(tanyaHitbox);

  const tanyaData: NPCData = {
    id: 'tanya',
    name: 'Таня',
    title: 'Светлый дух школы (Ученица 1974 года)',
    role: 'ghost_girl',
    floor: 2,
    roomName: 'Верхняя галерея',
    position: [0, 4.5, 22.5],
    portraitUrl: '/src/assets/images/tanya_ghost_portrait_1792592297350.jpg',
    dialogue: {
      intro: '...не бойся меня, путник... Я помню этот холод. Пятьдесят лет назад они оставили меня здесь в темноте...',
      options: [
        {
          text: 'Кто ты? Ты можешь мне помочь?',
          response: 'Я Таня... Душа этой старой школы. Тень зла чувствует твоё сердцебиение, но свет истины развеет морок. Позволь мне успокоить твой разум...',
          giveItem: {
            id: 'tanya_blessing',
            name: 'Благословение Тани (Полное исцеление рассудка)',
            type: 'sanity',
          },
        },
        {
          text: 'Где спрятаны главные реликвии?',
          response: 'Мел призыва — в Кабинете Литературы. Соль — в Лаборатории Химии. Боёк от колокола — у котла в подвале. А в Кабинете Директора на этом этаже хранится последняя печать.',
        },
        {
          text: 'Как навсегда изгнать эту сущность?',
          response: 'Собери все части ритуала, включи свет на щитке и стань в круг в Котельной. Когда зазвенит школьный звонок — двери распахнутся!',
        },
      ],
    },
  };

  actors.set('tanya', {
    data: tanyaData,
    group: tanyaGroup,
    update: (time) => {
      // Gentle floating levitation
      tanyaGroup.position.y = 4.5 + Math.sin(time * 2.2) * 0.14;
      particles.rotation.y += 0.01;
      tanyaGlow.intensity = 2.2 + Math.sin(time * 3) * 0.5;
    },
  });

  return {
    actors,
    updateAll: (time: number, delta: number) => {
      actors.forEach((actor) => actor.update(time, delta));
    },
  };
}
