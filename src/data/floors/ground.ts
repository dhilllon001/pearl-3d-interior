import { buildFloor, room } from '../buildFloor';
import { A, E, F, G, H, I, J, Y1, Y3, Y4, Y8, Y9, Y10, Y11, Y12 } from '../gridPoints';

/** Ground — Sales Centre (Drake+Khan shell) + vestibules (Sheet I111) */
export const ground = buildFloor({
  level: 'G',
  label: 'Ground Floor',
  elevation: 4200,
  rooms: [
    room('102', 'Sales Centre', A, Y3, E - A, Y10 - Y3),
    room('103', 'Vestibule 2', E, Y9, F - E, Y11 - Y9),
    room('104', 'North Stair', E, Y11, F - E, Y12 - Y11),
    room('105', 'Janitor', F, Y8, G - F, Y9 - Y8),
    room('106', 'Universal Washroom', G, Y8, H - G, Y9 - Y8),
    room('107', 'Vestibule 1', F, Y1, H - F, Y3 - Y1),
    room('108', 'Open to Below', A, Y1, E - A, Y3 - Y1),
    room('EL01', 'Elevator', F, Y9, G - F, Y10 - Y9),
    room('EL02', 'Elevator South', F, Y3, G - F, Y4 - Y3),
    room('ST01', 'South Stair', E, Y1, F - E, Y3 - Y1),
    room('LOB', 'Elevator Lobby', G, Y9, I - G, Y11 - Y9),
    room('COR', 'Corridor', E, Y3, J - E, Y8 - Y3),
  ],
});
