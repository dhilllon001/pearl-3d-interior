import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { Building } from './Building';
import { PlayerControls } from './PlayerControls';
import { useAppStore } from '../../store/useAppStore';
import { BUILDING_DEPTH, BUILDING_WIDTH, mmToM } from '../../data/grid';

export function SceneCanvas() {
  const viewMode = useAppStore((s) => s.viewMode);
  const currentLevel = useAppStore((s) => s.currentLevel);
  const floors = useAppStore((s) => s.floors);
  const plan = floors.find((f) => f.level === currentLevel);
  const elev = (plan?.elevation ?? 0) / 1000;
  const cx = mmToM(BUILDING_WIDTH) / 2;
  const cz = mmToM(BUILDING_DEPTH) / 2;

  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%' }}
      camera={{
        position: [cx + 25, elev + 18, cz + 30],
        fov: 55,
        near: 0.1,
        far: 500,
      }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onPointerMissed={() => useAppStore.getState().selectFace(null)}
    >
      <color attach="background" args={['#cfe3f5']} />
      <fog attach="fog" args={['#cfe3f5', 60, 160]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={1.15}
        position={[40, 60, 20]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <Suspense fallback={null}>
        <Sky sunPosition={[40, 20, 30]} turbidity={6} rayleigh={1.2} />
        <Environment preset="city" />
        <Building />
      </Suspense>

      {viewMode === 'walk' ? (
        <PlayerControls />
      ) : (
        <OrbitControls
          target={[cx, elev + 1.2, cz]}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={5}
          maxDistance={120}
          makeDefault
        />
      )}
    </Canvas>
  );
}
