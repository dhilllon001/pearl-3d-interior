import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { buildFloorGeometry, resolveCollision } from '../../geometry/buildWalls';

const SPEED = 4.5;
const EYE = 1.6;
const RADIUS = 0.35;

export function PlayerControls() {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const locked = useRef(false);

  const viewMode = useAppStore((s) => s.viewMode);
  const playerPos = useAppStore((s) => s.playerPos);
  const setPlayer = useAppStore((s) => s.setPlayer);
  const currentLevel = useAppStore((s) => s.currentLevel);
  const floors = useAppStore((s) => s.floors);

  const colliders = useRef(buildFloorGeometry(floors.find((f) => f.level === currentLevel)!).colliders);

  useEffect(() => {
    const plan = floors.find((f) => f.level === currentLevel);
    if (plan) colliders.current = buildFloorGeometry(plan).colliders;
  }, [currentLevel, floors]);

  useEffect(() => {
    if (viewMode !== 'walk') {
      locked.current = false;
      document.exitPointerLock?.();
      return;
    }

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keys.current[e.code] = down;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);

    const onClick = () => {
      gl.domElement.requestPointerLock();
    };
    const onLockChange = () => {
      locked.current = document.pointerLockElement === gl.domElement;
    };
    const onMove = (e: MouseEvent) => {
      if (!locked.current) return;
      yaw.current -= e.movementX * 0.0025;
      pitch.current -= e.movementY * 0.0025;
      pitch.current = Math.max(-1.2, Math.min(1.2, pitch.current));
    };

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    gl.domElement.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMove);

    yaw.current = useAppStore.getState().playerYaw;

    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      gl.domElement.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMove);
    };
  }, [viewMode, gl]);

  useFrame((_, dt) => {
    if (viewMode !== 'walk') return;

    const plan = floors.find((f) => f.level === currentLevel);
    const elev = (plan?.elevation ?? 0) / 1000;
    const eyeY = elev + EYE;

    let x = playerPos[0];
    let z = playerPos[2];

    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const move = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp']) move.add(forward);
    if (keys.current['KeyS'] || keys.current['ArrowDown']) move.sub(forward);
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) move.sub(right);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) move.add(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(SPEED * Math.min(dt, 0.05));
      x += move.x;
      z += move.z;
      [x, z] = resolveCollision(x, z, RADIUS, colliders.current);
      setPlayer([x, eyeY, z], yaw.current);
    } else {
      // Keep camera on current floor height when switching
      if (Math.abs(playerPos[1] - eyeY) > 0.01) {
        setPlayer([x, eyeY, z], yaw.current);
      }
    }

    camera.position.set(playerPos[0], eyeY, playerPos[2]);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
  });

  return null;
}
