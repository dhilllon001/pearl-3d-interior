import { useMemo } from 'react';
import * as THREE from 'three';
import type { FloorPlan } from '../../types/floor';
import { buildFloorGeometry, defaultFinishForWall } from '../../geometry/buildWalls';
import { FinishMaterial } from './FinishMaterial';
import { useAppStore } from '../../store/useAppStore';
import { Html } from '@react-three/drei';

interface Props {
  plan: FloorPlan;
  visible: boolean;
  interactive: boolean;
}

export function FloorLevel({ plan, visible, interactive }: Props) {
  const geom = useMemo(() => buildFloorGeometry(plan), [plan]);
  const scheme = useAppStore((s) => s.scheme);
  const selectFace = useAppStore((s) => s.selectFace);
  const selectRoom = useAppStore((s) => s.selectRoom);
  const selectedFaceId = useAppStore((s) => s.selectedFaceId);
  const showCeilings = useAppStore((s) => s.showCeilings);
  const wallType = useMemo(() => {
    const m = new Map(plan.walls.map((w) => [w.id, w.type]));
    return m;
  }, [plan]);

  if (!visible) return null;

  return (
    <group>
      {geom.walls.map((w, i) => {
        const finishA = scheme.faces[w.faceA] ?? defaultFinishForWall(wallType.get(w.wallId) ?? 'interior');
        const finishB = scheme.faces[w.faceB] ?? defaultFinishForWall(wallType.get(w.wallId) ?? 'interior');
        const selected = selectedFaceId === w.faceA || selectedFaceId === w.faceB;
        return (
          <group key={`${w.wallId}-${i}-${w.kind}`} position={w.position} rotation={[0, w.rotationY, 0]}>
            {/* Face A — +Z local after rotation */}
            <mesh
              position={[0, 0, w.size[2] / 2 + 0.001]}
              onClick={
                interactive
                  ? (e) => {
                      e.stopPropagation();
                      selectFace(w.faceA);
                    }
                  : undefined
              }
              castShadow
              receiveShadow
            >
              <planeGeometry args={[w.size[0], w.size[1]]} />
              <FinishMaterial finish={finishA} />
              {selected && selectedFaceId === w.faceA && (
                <lineSegments>
                  <edgesGeometry args={[new THREE.PlaneGeometry(w.size[0], w.size[1])]} />
                  <lineBasicMaterial color="#3B82F6" />
                </lineSegments>
              )}
            </mesh>
            {/* Face B — -Z */}
            <mesh
              position={[0, 0, -w.size[2] / 2 - 0.001]}
              rotation={[0, Math.PI, 0]}
              onClick={
                interactive
                  ? (e) => {
                      e.stopPropagation();
                      selectFace(w.faceB);
                    }
                  : undefined
              }
              castShadow
              receiveShadow
            >
              <planeGeometry args={[w.size[0], w.size[1]]} />
              <FinishMaterial finish={finishB} />
            </mesh>
            {/* Core thickness fill */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={w.size} />
              <meshStandardMaterial color="#D8D4CC" roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {geom.floors.map((slab) => {
        const finish = scheme.rooms[slab.roomId]?.floor ?? { kind: 'paint' as const, color: '#C4B8A8' };
        const room = plan.rooms.find((r) => r.id === slab.roomId);
        return (
          <mesh
            key={`fl-${slab.roomId}`}
            position={slab.position}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={
              interactive
                ? (e) => {
                    e.stopPropagation();
                    selectRoom(slab.roomId);
                  }
                : undefined
            }
          >
            <planeGeometry args={slab.size} />
            <FinishMaterial finish={finish} fallbackColor="#C4B8A8" side={THREE.DoubleSide} />
            {room && interactive && (
              <Html
                position={[0, 0, 0.02]}
                rotation={[Math.PI / 2, 0, 0]}
                center
                distanceFactor={12}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                <div
                  style={{
                    color: '#334155',
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.7)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {room.number} {room.name}
                </div>
              </Html>
            )}
          </mesh>
        );
      })}

      {showCeilings &&
        geom.ceilings.map((slab) => {
          const finish = scheme.rooms[slab.roomId]?.ceiling ?? { kind: 'paint' as const, color: '#FAFAF8' };
          return (
            <mesh key={`cl-${slab.roomId}`} position={slab.position} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={slab.size} />
              <FinishMaterial finish={finish} fallbackColor="#FAFAF8" />
            </mesh>
          );
        })}
    </group>
  );
}
