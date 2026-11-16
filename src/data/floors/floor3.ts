import { buildFloor, room } from '../buildFloor';
import { A, B, C, D, E, F, G, H, I, J, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12 } from '../gridPoints';

/** 3rd Floor — Finance / HR offices (Sheet I113) */
export const floor3 = buildFloor({
  level: '3',
  label: '3rd Floor',
  elevation: 12600,
  rooms: [
    room('301', 'Lounge / Waiting', F, Y9, H - F, Y10 - Y9),
    room('302', 'Finance Executive Office', G, Y10, H - G, Y12 - Y10),
    room('303', 'Boardroom', H, Y10, J - H, Y12 - Y10),
    room('304', 'HR Executive Office', E, Y10, F - E, Y12 - Y10),
    room('305', 'Finance Office', A, Y10, B - A, Y12 - Y10),
    room('306', "Women's Washroom", F, Y7, H - F, Y8 - Y7),
    room('307', 'HR Open Office', A, Y6, C - A, Y8 - Y6),
    room('308', 'Finance Open Office', A, Y1, D - A, Y5 - Y1),
    room('309', 'Collaboration', D, Y1, E - D, Y5 - Y1),
    room('310', 'Meeting Room', H, Y4, J - H, Y6 - Y4),
    room('311', 'HR Office', C, Y6, D - C, Y8 - Y6),
    room('312', 'Open Office', A, Y8, E - A, Y10 - Y8),
    room('313', 'Finance Office', B, Y10, C - B, Y12 - Y10),
    room('314', 'Finance Office', C, Y10, D - C, Y12 - Y10),
    room('315', 'Finance Office', D, Y10, E - D, Y12 - Y10),
    room('316', 'Finance Office', E, Y8, F - E, Y9 - Y8),
    room('317', 'Janitor', H, Y8, I - H, Y9 - Y8),
    room('318', 'IT Room', H, Y7, I - H, Y8 - Y7),
    room('319', "Men's Washroom", F, Y8, H - F, Y9 - Y8),
    room('320', 'Elec Room', I, Y1, J - I, Y3 - Y1),
    room('EL01', 'Elevator', F, Y10, G - F, Y11 - Y10),
    room('ST01', 'North Stair', E, Y9, F - E, Y11 - Y9),
    room('ST02', 'South Stair', E, Y1, F - E, Y3 - Y1),
    room('EL02', 'Elevator South', F, Y1, G - F, Y2 - Y1),
  ],
});
