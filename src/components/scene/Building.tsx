import { useAppStore } from '../../store/useAppStore';
import { FloorLevel } from './FloorLevel';
import { BUILDING_DEPTH, BUILDING_WIDTH, mmToM } from '../../data/grid';

export function Building() {
  const floors = useAppStore((s) => s.floors);
  const currentLevel = useAppStore((s) => s.currentLevel);
  const viewMode = useAppStore((s) => s.viewMode);

  const currentIdx = floors.findIndex((f) => f.level === currentLevel);

  return (
    <group>
      {/* Ground plane under basement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mmToM(BUILDING_WIDTH) / 2, -0.05, mmToM(BUILDING_DEPTH) / 2]} receiveShadow>
        <planeGeometry args={[80, 100]} />
        <meshStandardMaterial color="#9CA88A" roughness={1} />
      </mesh>

      {floors.map((plan, idx) => {
        const isCurrent = plan.level === currentLevel;
        // Dollhouse: hide floors above current. Walk: only show current (+ neighbors faintly optional)
        let visible = true;
        if (viewMode === 'dollhouse') {
          visible = idx <= currentIdx;
        } else {
          visible = isCurrent;
        }
        return (
          <FloorLevel
            key={plan.level}
            plan={plan}
            visible={visible}
            interactive={isCurrent}
          />
        );
      })}
    </group>
  );
}
