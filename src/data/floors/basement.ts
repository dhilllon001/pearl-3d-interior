import { buildFloor, room } from '../buildFloor';
import { A, B, C, D, E, F, G, H, I, J, Y1, Y2, Y3, Y8, Y9, Y10, Y11, Y12 } from '../gridPoints';

/** Basement — Gymnasium + change rooms / showers (Sheet I110) */
export const basement = buildFloor({
  level: 'B',
  label: 'Basement',
  elevation: 0,
  rooms: [
    room('001', 'Sprinkler / Service Room', H, Y10, I - H, Y12 - Y10),
    room('002', 'Electric Room', G, Y11, H - G, Y12 - Y11),
    room('003', 'North Stair', E, Y9, F - E, Y11 - Y9),
    room('004', 'Storage', F, Y9, G - F, Y10 - Y9),
    room('005', 'South Stair', E, Y1, F - E, Y3 - Y1),
    room('010', 'Gymnasium', A, Y3, E - A, Y9 - Y3),
    room('011', 'Lounge', G, Y9, H - G, Y10 - Y9),
    room('012', 'Washroom', B, Y10, C - B, Y11 - Y10),
    room('013', 'Dressing Room', C, Y10, D - C, Y11 - Y10),
    room('014', 'Universal Shower', D, Y10, E - D, Y11 - Y10),
    room('015', 'Shower Room', B, Y11, C - B, Y12 - Y11),
    room('016', 'Dressing Room', C, Y11, D - C, Y12 - Y11),
    room('017', 'Washroom', D, Y11, E - D, Y12 - Y11),
    room('018', 'Washroom', E, Y11, F - E, Y12 - Y11),
    room('019', 'Washroom', F, Y11, G - F, Y12 - Y11),
    room('020', 'Washroom', A, Y10, B - A, Y11 - Y10),
    room('021', 'Janitor', A, Y11, B - A, Y12 - Y11),
    room('022', 'Dressing Room', G, Y10, H - G, Y11 - Y10),
    room('027', 'Mechanical Closet', E, Y8, F - E, Y9 - Y8),
    room('051', 'Lobby', F, Y1, H - F, Y3 - Y1),
    room('052', 'Sump Room', H, Y1, J - H, Y2 - Y1),
    room('EL01', 'Elevator', F, Y10, G - F, Y11 - Y10),
    room('EL02', 'Elevator South', F, Y1, G - F, Y2 - Y1),
    room('COR', 'Corridor', E, Y3, J - E, Y8 - Y3),
  ],
});
