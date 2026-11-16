import { buildFloor, room } from '../buildFloor';
import { A, B, C, D, E, F, G, H, I, J, Y1, Y2, Y3, Y4, Y6, Y7, Y8, Y9, Y10, Y11, Y12 } from '../gridPoints';

/** 2nd Floor — Design Centre + offices (Sheet I112) */
export const floor2 = buildFloor({
  level: '2',
  label: '2nd Floor',
  elevation: 8400,
  rooms: [
    room('201', 'Boardroom', H, Y10, J - H, Y12 - Y10),
    room('202', 'Design Centre', A, Y6, E - A, Y12 - Y6),
    room('203', 'Office', E, Y10, F - E, Y11 - Y10),
    room('204', 'Executive Office', F, Y10, G - F, Y11 - Y10),
    room('205', 'Office', G, Y10, H - G, Y11 - Y10),
    room('206', "Men's Lounge", F, Y8, G - F, Y9 - Y8),
    room('207', "Men's Washroom", G, Y8, H - G, Y9 - Y8),
    room('208', 'Janitor', H, Y8, I - H, Y9 - Y8),
    room('209', "Women's Washroom", F, Y7, H - F, Y8 - Y7),
    room('210', 'IT Room', H, Y7, I - H, Y8 - Y7),
    room('211', 'Office', A, Y4, B - A, Y6 - Y4),
    room('212', 'Office', B, Y4, C - B, Y6 - Y4),
    room('213', 'Office', C, Y4, D - C, Y6 - Y4),
    room('214', 'Open Office', A, Y1, D - A, Y4 - Y1),
    room('215', 'Collaboration', D, Y1, E - D, Y4 - Y1),
    room('216', 'Office', E, Y4, F - E, Y6 - Y4),
    room('217', 'Office', F, Y4, G - F, Y6 - Y4),
    room('218', 'Office', G, Y4, H - G, Y6 - Y4),
    room('219', 'Meeting Room', H, Y4, J - H, Y6 - Y4),
    room('220', 'Office', E, Y6, F - E, Y8 - Y6),
    room('221', 'Elec Room', I, Y1, J - I, Y3 - Y1),
    room('EL01', 'Elevator', F, Y9, G - F, Y10 - Y9),
    room('ST01', 'North Stair', E, Y9, F - E, Y11 - Y9),
    room('ST02', 'South Stair', E, Y1, F - E, Y3 - Y1),
    room('EL02', 'Elevator South', F, Y1, G - F, Y2 - Y1),
    room('LOB', 'Elevator Lobby', G, Y9, H - G, Y10 - Y9),
  ],
});
