import { buildFloor, room } from '../buildFloor';
import { A, C, D, E, F, G, H, I, J, Y1, Y2, Y3, Y5, Y6, Y7, Y8, Y9, Y10, Y12 } from '../gridPoints';

/** 4th Floor — Lunch / celebration + open office + patio (Sheet I114) */
export const floor4 = buildFloor({
  level: '4',
  label: '4th Floor',
  elevation: 16800,
  rooms: [
    room('401', 'Lunch Room', A, Y9, E - A, Y12 - Y9),
    room('402', 'Roof-Top Patio', E, Y9, H - E, Y12 - Y9),
    room('403', 'Celebration / Private', H, Y10, J - H, Y12 - Y10),
    room('404', 'North Stair', E, Y8, F - E, Y9 - Y8),
    room('405', "Men's Washroom", F, Y7, H - F, Y8 - Y7),
    room('406', "Women's Washroom", F, Y6, H - F, Y7 - Y6),
    room('407', 'Janitor', H, Y8, I - H, Y9 - Y8),
    room('413', 'Coffee Area', A, Y6, C - A, Y8 - Y6),
    room('414', 'Dry Storage', C, Y6, D - C, Y8 - Y6),
    room('415', 'IT Room', H, Y6, I - H, Y7 - Y6),
    room('416', 'Open Office West', A, Y1, D - A, Y6 - Y1),
    room('417', 'Open Office East', D, Y3, E - D, Y6 - Y3),
    room('418', 'Collaboration', D, Y1, E - D, Y3 - Y1),
    room('419', 'Meeting Room A', H, Y3, J - H, Y5 - Y3),
    room('420', 'Meeting Room B', H, Y1, J - H, Y3 - Y1),
    room('EL01', 'Elevator', F, Y8, G - F, Y9 - Y8),
    room('ST02', 'South Stair', E, Y1, F - E, Y3 - Y1),
    room('EL02', 'Elevator South', F, Y1, G - F, Y2 - Y1),
    room('COR', 'Corridor', E, Y3, H - E, Y6 - Y3),
  ],
});
