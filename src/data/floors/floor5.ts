import { buildFloor, room } from '../buildFloor';
import { A, B, C, D, E, F, G, H, I, J, Y1, Y3, Y4, Y6, Y7, Y8, Y9, Y10, Y11, Y12 } from '../gridPoints';

/** 5th Floor — Executive suite + gym + patio (Sheet I115) */
export const floor5 = buildFloor({
  level: '5',
  label: '5th Floor',
  elevation: 21000,
  rooms: [
    room('501', 'Reception / Waiting', F, Y9, H - F, Y11 - Y9),
    room('502', 'Executive Boardroom', H, Y10, J - H, Y12 - Y10),
    room('503', 'Patio', E, Y10, F - E, Y12 - Y10),
    room('504', 'Coffee Bar', F, Y7, H - F, Y8 - Y7),
    room('505', 'IT', H, Y7, I - H, Y8 - Y7),
    room('506', 'Washroom', F, Y6, G - F, Y7 - Y6),
    room('507', 'Washroom', G, Y6, H - G, Y7 - Y6),
    room('508', 'IT Storage', H, Y6, I - H, Y7 - Y6),
    room('509', 'Executive Workroom', E, Y7, F - E, Y9 - Y7),
    room('510', 'Executive Office', A, Y6, B - A, Y9 - Y6),
    room('511', 'Executive Office', B, Y6, C - B, Y9 - Y6),
    room('512', 'Executive Office', C, Y6, D - C, Y9 - Y6),
    room('513', 'Executive Office', D, Y6, E - D, Y9 - Y6),
    room('514', 'Collaboration', A, Y3, E - A, Y6 - Y3),
    room('515', 'Executive Gym', A, Y1, D - A, Y3 - Y1),
    room('516', 'Rest Room', D, Y1, E - D, Y3 - Y1),
    room('517', 'Meeting Area', H, Y1, J - H, Y4 - Y1),
    room('518', 'Vestibule', F, Y1, H - F, Y3 - Y1),
    room('520', 'Executive Office', A, Y9, C - A, Y12 - Y9),
    room('521', 'Coats', E, Y6, F - E, Y7 - Y6),
    room('522', 'Janitor', I, Y8, J - I, Y9 - Y8),
    room('523', 'Universal Washroom', H, Y8, I - H, Y9 - Y8),
    room('EL01', 'Elevator', F, Y8, G - F, Y9 - Y8),
    room('ST01', 'North Stair', E, Y8, F - E, Y10 - Y8),
    room('ST02', 'South Stair', E, Y1, F - E, Y3 - Y1),
    room('EL02', 'Elevator South', F, Y3, G - F, Y4 - Y3),
  ],
});
