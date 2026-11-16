import * as THREE from 'three';
import type { SubsystemHitId } from './sceneConfig';
import type { ProceduralTextureSet } from './textures';

export interface AstronautRig {
  root: THREE.Group;
  helmetGroup: THREE.Group;
  visorGroup: THREE.Group;
  chestGroup: THREE.Group;
  plssGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  interactables: THREE.Object3D[];
}

export interface SpacecraftRig {
  root: THREE.Group;
  dishGroup: THREE.Group;
  solarWings: THREE.Group[];
  interactables: THREE.Object3D[];
}

export interface CrewCapsuleRig {
  root: THREE.Group;
  solarFins: THREE.Group[];
  interactables: THREE.Object3D[];
}

export interface RelaySatelliteRig {
  root: THREE.Group;
  laserBeam: THREE.Mesh;
}

export interface SpaceEnvironmentRig {
  root: THREE.Group;
  earthMesh: THREE.Mesh;
  moonMesh: THREE.Mesh;
  orbitalRing: THREE.Mesh;
  stars: THREE.Points;
}

function tagSubsystem(obj: THREE.Object3D, subsystemId: SubsystemHitId) {
  obj.traverse((child) => {
    child.userData.subsystemId = subsystemId;
  });
}

export function createAstronautModel(textures: ProceduralTextureSet): AstronautRig {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];

  const suitWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.82,
    metalness: 0.05,
    bumpMap: textures.suitBump,
    bumpScale: 0.015,
  });

  const jointDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.22,
  });

  const kineticOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xff4d00,
    roughness: 0.36,
    metalness: 0.18,
  });

  const nasaBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0b3d91,
    roughness: 0.45,
    metalness: 0.15,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.24,
    metalness: 0.9,
  });

  const goldVisorMat = new THREE.MeshPhysicalMaterial({
    color: 0xff9f2e,
    roughness: 0.08,
    metalness: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const chestScreenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.chestDisplay,
    emissive: 0xff4d00,
    emissiveMap: textures.chestDisplay,
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.2,
  });

  // 1. Torso Core
  const torsoMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.46, 0.52, 8, 20),
    suitWhiteMat
  );
  torsoMesh.scale.set(1.08, 1.0, 0.84);
  torsoMesh.position.set(0, 0.28, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  root.add(torsoMesh);

  // Waist bearing & orange EVA belt trim
  const waistRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.045, 12, 32),
    kineticOrangeMat
  );
  waistRing.rotation.x = Math.PI / 2;
  waistRing.scale.set(1.06, 0.86, 1);
  waistRing.position.set(0, -0.14, 0);
  root.add(waistRing);

  // Neck bearing ring
  const neckRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.04, 12, 32),
    titaniumMat
  );
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.set(0, 0.78, 0);
  root.add(neckRing);

  // 2. Helmet + Inner Faceplate + Gold Sun Visor
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 1.08, 0.02);

  const helmetShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 28, 24),
    suitWhiteMat
  );
  helmetShell.castShadow = true;
  helmetGroup.add(helmetShell);

  const helmetBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 10, 32),
    kineticOrangeMat
  );
  helmetBand.rotation.x = Math.PI / 2;
  helmetGroup.add(helmetBand);

  for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.11, 0.16),
      titaniumMat
    );
    pod.position.set(side * 0.37, 0.04, 0.02);
    helmetGroup.add(pod);

    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffe4b5,
        emissiveIntensity: 1.6,
        roughness: 0.2,
      })
    );
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(side * 0.37, 0.05, 0.11);
    helmetGroup.add(lamp);
  }

  const innerFaceplate = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.352,
      24,
      20,
      -Math.PI * 0.36,
      Math.PI * 0.72,
      Math.PI * 0.24,
      Math.PI * 0.52
    ),
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.12,
      metalness: 0.35,
      clearcoat: 1.0,
    })
  );
  innerFaceplate.rotation.y = Math.PI / 2;
  innerFaceplate.position.set(0, 0.01, 0.028);
  helmetGroup.add(innerFaceplate);

  const visorGroup = new THREE.Group();
  const visorMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.368,
      28,
      22,
      -Math.PI * 0.4,
      Math.PI * 0.8,
      Math.PI * 0.2,
      Math.PI * 0.58
    ),
    goldVisorMat
  );
  visorMesh.rotation.y = Math.PI / 2;
  visorMesh.position.set(0, 0.01, 0.032);
  visorGroup.add(visorMesh);
  helmetGroup.add(visorGroup);

  tagSubsystem(helmetGroup, 'helmet');
  interactables.push(helmetGroup);
  root.add(helmetGroup);

  // 3. Chest Display & Control Module
  const chestGroup = new THREE.Group();
  chestGroup.position.set(0, 0.38, 0.39);

  const dcmHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.38, 0.14),
    titaniumMat
  );
  dcmHousing.castShadow = true;
  chestGroup.add(dcmHousing);

  const dcmFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.3),
    chestScreenMat
  );
  dcmFace.position.set(0, 0, 0.072);
  chestGroup.add(dcmFace);

  const purgeValve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16),
    kineticOrangeMat
  );
  purgeValve.rotation.x = Math.PI / 2;
  purgeValve.position.set(0.25, -0.11, 0.04);
  chestGroup.add(purgeValve);

  tagSubsystem(chestGroup, 'chest-ecg');
  interactables.push(chestGroup);
  root.add(chestGroup);

  // 4. PLSS Life Support Backpack + SAFER Nitrogen Thruster Arms
  const plssGroup = new THREE.Group();
  plssGroup.position.set(0, 0.38, -0.45);

  const plssBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.96, 0.38),
    suitWhiteMat
  );
  plssBody.castShadow = true;
  plssGroup.add(plssBody);

  const plssCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.14, 0.4),
    kineticOrangeMat
  );
  plssCap.position.set(0, 0.45, 0);
  plssGroup.add(plssCap);

  // SAFER rescue thruster side pods
  for (const side of [-1, 1]) {
    const tank = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.54, 8, 16),
      titaniumMat
    );
    tank.position.set(side * 0.22, -0.04, -0.2);
    plssGroup.add(tank);

    const saferPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.2, 0.3),
      jointDarkMat
    );
    saferPod.position.set(side * 0.44, -0.34, 0.06);
    plssGroup.add(saferPod);

    const thrusterNozzle = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.1, 10),
      titaniumMat
    );
    thrusterNozzle.rotation.x = Math.PI / 2;
    thrusterNozzle.position.set(side * 0.44, -0.34, 0.24);
    plssGroup.add(thrusterNozzle);

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 0.56, 8),
      titaniumMat
    );
    antenna.position.set(side * 0.29, 0.74, -0.05);
    plssGroup.add(antenna);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      kineticOrangeMat
    );
    tip.position.set(side * 0.29, 1.03, -0.05);
    plssGroup.add(tip);
  }

  tagSubsystem(plssGroup, 'plss');
  interactables.push(plssGroup);
  root.add(plssGroup);

  // 5. Articulated Arms, NASA Shoulder Patch & Wrist Cuff Display
  function buildArm(side: -1 | 1): THREE.Group {
    const arm = new THREE.Group();
    arm.position.set(side * 0.54, 0.62, 0);

    const shoulderJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      jointDarkMat
    );
    arm.add(shoulderJoint);

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.125, 0.36, 6, 14),
      suitWhiteMat
    );
    upperArm.position.set(side * 0.14, -0.22, 0.06);
    upperArm.rotation.z = side * 0.38;
    upperArm.rotation.x = -0.22;
    arm.add(upperArm);

    // NASA Shoulder Insignia Disc
    const patch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16),
      side === -1 ? nasaBlueMat : kineticOrangeMat
    );
    patch.rotation.z = Math.PI / 2 - side * 0.3;
    patch.position.set(side * 0.23, -0.15, 0.06);
    arm.add(patch);

    const elbowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.125, 0.022, 10, 20),
      kineticOrangeMat
    );
    elbowRing.position.set(side * 0.25, -0.44, 0.12);
    elbowRing.rotation.x = Math.PI / 2 - 0.3;
    arm.add(elbowRing);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.34, 6, 14),
      suitWhiteMat
    );
    forearm.position.set(side * 0.23, -0.58, 0.3);
    forearm.rotation.x = -0.82;
    forearm.rotation.z = -side * 0.18;
    arm.add(forearm);

    if (side === -1) {
      const wristHud = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 0.15),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          emissive: 0xff4d00,
          emissiveIntensity: 0.7,
          roughness: 0.25,
        })
      );
      wristHud.position.set(side * 0.21, -0.56, 0.42);
      wristHud.rotation.x = -0.6;
      arm.add(wristHud);
    }

    const glove = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.13, 0.22),
      jointDarkMat
    );
    glove.position.set(side * 0.19, -0.71, 0.5);
    glove.rotation.x = -0.5;
    arm.add(glove);

    return arm;
  }

  const leftArmGroup = buildArm(-1);
  const rightArmGroup = buildArm(1);
  root.add(leftArmGroup, rightArmGroup);

  // 6. Articulated Legs & Boots
  function buildLeg(side: -1 | 1): THREE.Group {
    const leg = new THREE.Group();
    leg.position.set(side * 0.23, -0.22, 0);

    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.165, 0.44, 6, 16),
      suitWhiteMat
    );
    thigh.position.set(0, -0.32, 0.05);
    thigh.rotation.x = side === -1 ? -0.18 : 0.12;
    thigh.rotation.z = side * 0.08;
    leg.add(thigh);

    const kneePad = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.025, 10, 24),
      kineticOrangeMat
    );
    kneePad.position.set(side * 0.03, -0.62, side === -1 ? 0.11 : -0.02);
    kneePad.rotation.x = Math.PI / 2;
    leg.add(kneePad);

    const shin = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.145, 0.44, 6, 16),
      suitWhiteMat
    );
    shin.position.set(side * 0.04, -0.92, side === -1 ? 0.04 : -0.12);
    shin.rotation.x = side === -1 ? 0.24 : 0.34;
    leg.add(shin);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.42),
      jointDarkMat
    );
    boot.position.set(side * 0.04, -1.24, side === -1 ? 0.04 : -0.18);
    boot.rotation.x = 0.2;
    leg.add(boot);

    return leg;
  }

  const leftLegGroup = buildLeg(-1);
  const rightLegGroup = buildLeg(1);
  root.add(leftLegGroup, rightLegGroup);

  return {
    root,
    helmetGroup,
    visorGroup,
    chestGroup,
    plssGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
    interactables,
  };
}

export function createNasaSpacecraftModel(textures: ProceduralTextureSet): SpacecraftRig {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const solarWings: THREE.Group[] = [];

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.hullPanel,
    roughness: 0.48,
    metalness: 0.38,
  });

  const kaptonGoldMat = new THREE.MeshStandardMaterial({
    color: 0xe69517,
    roughness: 0.26,
    metalness: 0.92,
  });

  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.32,
    metalness: 0.85,
  });

  const solarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.solarPanel,
    roughness: 0.2,
    metalness: 0.65,
    side: THREE.DoubleSide,
  });

  const orangeAccentMat = new THREE.MeshStandardMaterial({
    color: 0xff4d00,
    roughness: 0.38,
    metalness: 0.2,
  });

  const cupolaGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.4,
    clearcoat: 1.0,
  });

  // Main Pressurized Habitat Cylinder
  const habCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 4.4, 32),
    hullMat
  );
  habCore.rotation.z = Math.PI / 2;
  root.add(habCore);

  // Cupola Observation Dome on lower-front habitat hull
  const cupolaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.56, 0.36, 16),
    trussMat
  );
  cupolaBase.rotation.x = Math.PI / 2;
  cupolaBase.position.set(0.85, -0.1, 1.12);
  root.add(cupolaBase);

  const cupolaDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    cupolaGlassMat
  );
  cupolaDome.rotation.x = Math.PI / 2;
  cupolaDome.position.set(0.85, -0.1, 1.24);
  root.add(cupolaDome);

  // Conical Docking Adapter tapering smoothly from 1.15 hull to 0.74 docking ring
  const dockPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.15, 0.0),
    new THREE.Vector2(1.12, 0.18),
    new THREE.Vector2(0.84, 0.72),
    new THREE.Vector2(0.74, 1.05),
    new THREE.Vector2(0.0, 1.05),
  ];
  const dockCone = new THREE.Mesh(
    new THREE.LatheGeometry(dockPoints, 28),
    kaptonGoldMat
  );
  dockCone.rotation.z = -Math.PI / 2;
  dockCone.position.set(2.2, 0, 0);
  root.add(dockCone);

  const dockRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.07, 12, 32),
    orangeAccentMat
  );
  dockRing.rotation.y = Math.PI / 2;
  dockRing.position.set(3.26, 0, 0);
  root.add(dockRing);

  // Aft Service Module + Kapton Collar + Thermal Radiator Fins
  const aftCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.18, 0.9, 28),
    kaptonGoldMat
  );
  aftCollar.rotation.z = Math.PI / 2;
  aftCollar.position.set(-2.5, 0, 0);
  root.add(aftCollar);

  const radiator = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.06, 2.2),
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.55,
    })
  );
  radiator.position.set(-1.5, 1.4, 0);
  root.add(radiator);

  // Overhead-to-Ventral Truss Mast connecting all 4 solar wings solidly
  const trussMast = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 5.1, 0.45),
    trussMat
  );
  trussMast.position.set(-0.3, 0.6, 0);
  root.add(trussMast);

  // Parabolic High-Gain Dish with centered Feed Horn
  const dishGroup = new THREE.Group();
  dishGroup.position.set(1.2, 1.38, 0.25);
  dishGroup.rotation.x = Math.PI * 0.28;

  const dishNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.35, 12),
    trussMat
  );
  dishNeck.position.set(0, -0.15, 0);
  dishGroup.add(dishNeck);

  const dishPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.35, 0.07),
    new THREE.Vector2(0.7, 0.24),
    new THREE.Vector2(0.9, 0.44),
  ];
  const dishMesh = new THREE.Mesh(
    new THREE.LatheGeometry(dishPoints, 24),
    hullMat
  );
  dishGroup.add(dishMesh);
  const feedHorn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.055, 0.48, 12),
    orangeAccentMat
  );
  feedHorn.position.set(0, 0.25, 0);
  dishGroup.add(feedHorn);
  root.add(dishGroup);

  // 4 Articulated Solar Array Wings
  const wingCoords: [number, number, number, number][] = [
    [-0.3, 2.75, 0, 1],
    [-0.3, 2.75, 0, -1],
    [-0.3, -1.55, 0, 1],
    [-0.3, -1.55, 0, -1],
  ];

  for (const [x, y, z, dir] of wingCoords) {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(x, y, z);

    const boom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3.6, 10),
      trussMat
    );
    boom.rotation.x = Math.PI / 2;
    boom.position.set(0, 0, dir * 1.9);
    wingGroup.add(boom);

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 3.3),
      solarMat
    );
    panel.rotation.x = -Math.PI / 2;
    panel.position.set(0, 0.02, dir * 2.05);
    wingGroup.add(panel);

    solarWings.push(wingGroup);
    root.add(wingGroup);
  }

  // Zero-G EVA Safety Tether anchoring from docking collar to astronaut waist belt
  const tetherCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.26, -0.35, 0.15),
    new THREE.Vector3(2.8, -1.25, 1.5),
    new THREE.Vector3(1.65, -1.05, 3.2),
    new THREE.Vector3(0.55, -0.5, 4.75),
  ]);
  const tetherMesh = new THREE.Mesh(
    new THREE.TubeGeometry(tetherCurve, 36, 0.022, 8, false),
    orangeAccentMat
  );
  root.add(tetherMesh);

  tagSubsystem(root, 'spacecraft');
  interactables.push(habCore, dockCone, cupolaDome, ...solarWings);

  return {
    root,
    dishGroup,
    solarWings,
    interactables,
  };
}

export function createCrewCapsuleModel(textures: ProceduralTextureSet): CrewCapsuleRig {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const solarFins: THREE.Group[] = [];

  const whiteThermalMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.55,
    metalness: 0.15,
  });

  const heatshieldMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.78,
    metalness: 0.25,
  });

  const orangeTrimMat = new THREE.MeshStandardMaterial({
    color: 0xff4d00,
    roughness: 0.35,
    metalness: 0.2,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.26,
    metalness: 0.88,
  });

  const solarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.solarPanel,
    roughness: 0.2,
    metalness: 0.6,
    side: THREE.DoubleSide,
  });

  // 1. Conical Crew Command Capsule (LatheGeometry)
  const capsuleProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.86, 0.0),
    new THREE.Vector2(0.84, 0.22),
    new THREE.Vector2(0.42, 1.15),
    new THREE.Vector2(0.28, 1.28),
    new THREE.Vector2(0.0, 1.28),
  ];
  const commandCone = new THREE.Mesh(
    new THREE.LatheGeometry(capsuleProfile, 28),
    whiteThermalMat
  );
  commandCone.position.set(0, 0.65, 0);
  root.add(commandCone);

  // Forward Docking Nose Ring
  const noseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.04, 10, 24),
    orangeTrimMat
  );
  noseRing.rotation.x = Math.PI / 2;
  noseRing.position.set(0, 1.94, 0);
  root.add(noseRing);

  // Cockpit Viewport Windows with subtle cabin glow
  for (const offset of [-0.22, 0.22]) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.9,
        roughness: 0.15,
      })
    );
    win.position.set(offset, 1.32, 0.54);
    win.rotation.x = -0.45;
    root.add(win);
  }

  // 2. Service Module Trunk + Heatshield Skirt
  const heatshield = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.86, 0.22, 28),
    heatshieldMat
  );
  heatshield.position.set(0, 0.56, 0);
  root.add(heatshield);

  const serviceTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 0.98, 28),
    whiteThermalMat
  );
  serviceTrunk.position.set(0, -0.02, 0);
  root.add(serviceTrunk);

  const serviceStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.835, 0.835, 0.16, 28),
    orangeTrimMat
  );
  serviceStripe.position.set(0, 0.16, 0);
  root.add(serviceStripe);

  // 3. Main Engine Bell (LatheGeometry) + Engine Glow
  const bellProfile = [
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.22, -0.18),
    new THREE.Vector2(0.38, -0.54),
  ];
  const engineBell = new THREE.Mesh(
    new THREE.LatheGeometry(bellProfile, 24),
    titaniumMat
  );
  engineBell.position.set(0, -0.5, 0);
  root.add(engineBell);

  const engineCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 14, 12),
    new THREE.MeshStandardMaterial({
      color: 0xff4d00,
      emissive: 0xff4d00,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    })
  );
  engineCore.position.set(0, -0.62, 0);
  root.add(engineCore);

  // 4. Twin Deployable Solar Fin Wings
  for (const side of [-1, 1]) {
    const finGroup = new THREE.Group();
    finGroup.position.set(side * 0.84, -0.05, 0);

    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.08, 0.08),
      titaniumMat
    );
    strut.position.set(side * 0.14, 0, 0);
    finGroup.add(strut);

    const solarBlade = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 0.78),
      solarMat
    );
    solarBlade.position.set(side * 0.98, 0, 0);
    solarBlade.rotation.x = -0.35;
    finGroup.add(solarBlade);

    solarFins.push(finGroup);
    root.add(finGroup);
  }

  tagSubsystem(root, 'capsule');
  interactables.push(commandCone, serviceTrunk);

  return { root, solarFins, interactables };
}

export function createRelaySatelliteModel(
  textures: ProceduralTextureSet
): RelaySatelliteRig {
  const root = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe69517,
    roughness: 0.24,
    metalness: 0.92,
  });

  const solarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.solarPanel,
    roughness: 0.22,
    metalness: 0.65,
    side: THREE.DoubleSide,
  });

  const bus = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.65, 8),
    goldMat
  );
  root.add(bus);

  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.44),
      solarMat
    );
    panel.position.set(side * 0.92, 0, 0);
    panel.rotation.x = 0.4;
    root.add(panel);
  }

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.16, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
      metalness: 0.5,
      side: THREE.DoubleSide,
    })
  );
  dish.position.set(0, -0.4, 0);
  root.add(dish);

  // Optical telemetry laser beam pointing downward toward Earth horizon
  const laserBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.06, 5.4, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff4d00,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
  );
  laserBeam.position.set(0, -3.1, 0);
  root.add(laserBeam);

  return { root, laserBeam };
}

export function createSpaceEnvironment(textures: ProceduralTextureSet): SpaceEnvironmentRig {
  const root = new THREE.Group();

  // Large curved Earth limb below/behind scene
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.earthSurface,
    roughness: 0.78,
    metalness: 0.05,
  });
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(20, 48, 36),
    earthMat
  );
  earthMesh.position.set(6, -21.8, -14);
  root.add(earthMesh);

  // Thin orbital atmospheric rim shell
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const atmoShell = new THREE.Mesh(
    new THREE.SphereGeometry(20.6, 48, 36),
    atmoMat
  );
  atmoShell.position.copy(earthMesh.position);
  root.add(atmoShell);

  // Orbital trajectory path ring around Earth
  const orbitalRing = new THREE.Mesh(
    new THREE.TorusGeometry(23.2, 0.045, 8, 120),
    new THREE.MeshBasicMaterial({
      color: 0xff4d00,
      transparent: true,
      opacity: 0.45,
    })
  );
  orbitalRing.position.copy(earthMesh.position);
  orbitalRing.rotation.set(Math.PI * 0.44, 0.16, 0.22);
  root.add(orbitalRing);

  // Lunar Orb in upper-right deep space
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 32, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.moonSurface,
      roughness: 0.9,
      metalness: 0.02,
    })
  );
  moonMesh.position.set(14.5, 6.2, -24);
  root.add(moonMesh);

  // Starfield Points
  const starCount = 1600;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = (i * 2.39996) % (Math.PI * 2);
    const phi = Math.acos(1 - 2 * ((i + 0.5) / starCount));
    const r = 46 + (i % 8) * 4;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const warm = i % 5 === 0;
    const orangeStar = i % 19 === 0;
    colors[i * 3] = orangeStar ? 1.0 : warm ? 1.0 : 0.88;
    colors[i * 3 + 1] = orangeStar ? 0.45 : warm ? 0.78 : 0.93;
    colors[i * 3 + 2] = orangeStar ? 0.2 : warm ? 0.58 : 1.0;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.26,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
  });

  const stars = new THREE.Points(starGeo, starMat);
  root.add(stars);

  return { root, earthMesh, moonMesh, orbitalRing, stars };
}
