// Floor data for the University of Dubai — College of Engineering & IT, 1st floor.
//
// All coordinates are "plan units" traced from the evacuation-plan photo.
// 1 plan unit = SCALE metres. x grows to the right (east), y grows down (south).
// The north facade is the long slanted wall at the top of the plan.
//
// Room names below are placeholders. Replace them with the real room numbers.
// To add a room: give it a polygon, one or more doors (on its edge) and a type.
// Doors are linked to the nearest corridor automatically.

export const SCALE = 0.1;

export const BUILDING = {
  name: 'College of Engineering & IT',
  floor: '1',
};

// Room types: colour, icon and whether the map label shows the name or only the icon.
export const TYPES = {
  classroom: { label: 'Classrooms', single: 'Classroom', color: '#5856D6', icon: 'classroom' },
  lab:       { label: 'Labs',       single: 'Lab',       color: '#30B0C7', icon: 'lab' },
  lecture:   { label: 'Halls',      single: 'Lecture hall', color: '#34C759', icon: 'lecture' },
  office:    { label: 'Offices',    single: 'Office',    color: '#8E8E93', icon: 'office' },
  restroom:  { label: 'Restrooms',  single: 'Restroom',  color: '#AF52DE', icon: 'restroom', iconOnly: true },
  stairs:    { label: 'Stairs',     single: 'Stairs · Exit', color: '#FF9500', icon: 'stairs', iconOnly: true },
  lift:      { label: 'Lifts',      single: 'Lifts',     color: '#A2845E', icon: 'lift', iconOnly: true },
};

// Outer edge of the floor slab.
export const OUTLINE = [
  [205, 532], [690, 372], [692, 468], [775, 440], [775, 692], [740, 697], [740, 800],
  [142, 800], [150, 770], [158, 740], [166, 710], [173, 680], [180, 650], [187, 615],
  [194, 580], [200, 555],
];

// Openings in the slab (the atrium that looks down to the ground floor).
export const VOIDS = [
  [[262, 646], [515, 584], [515, 668], [262, 668]],
];

// Glass canopy on the west side, with its columns.
export const CANOPY = {
  poly: [
    [140, 492], [205, 472], [205, 532], [200, 555], [194, 580], [187, 615], [180, 650],
    [173, 680], [166, 710], [158, 740], [150, 770], [142, 800], [140, 812], [84, 812],
    [95, 750], [106, 700], [116, 650], [124, 600], [132, 550],
  ],
  columns: [[128, 560], [120, 612], [112, 664], [102, 716], [92, 768]],
};

export const ROOMS = [
  // South row
  { id: 'c101', name: 'Classroom 101', type: 'classroom', doors: [[235, 697]],
    poly: [[172, 697], [265, 697], [265, 800], [142, 800], [150, 770], [158, 740], [166, 710]] },
  { id: 'c102', name: 'Classroom 102', type: 'classroom', doors: [[300, 697]],
    poly: [[265, 697], [392, 697], [392, 800], [265, 800]] },
  { id: 'l103', name: 'Computer Lab 103', type: 'lab', doors: [[430, 697], [495, 697]],
    poly: [[392, 697], [520, 697], [520, 800], [392, 800]] },
  { id: 'l104', name: 'Engineering Lab 104', type: 'lab', doors: [[570, 697]],
    poly: [[520, 697], [587, 697], [587, 800], [520, 800]] },
  { id: 'c105', name: 'Classroom 105', type: 'classroom', doors: [[600, 697]],
    poly: [[587, 697], [660, 697], [660, 800], [587, 800]] },
  { id: 'c106', name: 'Classroom 106', type: 'classroom', doors: [[672, 697]],
    poly: [[660, 697], [740, 697], [740, 800], [660, 800]] },

  // North row (along the slanted facade)
  { id: 'c111', name: 'Classroom 111', type: 'classroom', doors: [[440, 540]],
    poly: [[405, 466], [475, 443], [475, 530], [407, 550]] },
  { id: 'c112', name: 'Classroom 112', type: 'classroom', doors: [[545, 509]],
    poly: [[475, 443], [575, 410], [575, 500], [475, 530]] },
  { id: 'l113', name: 'Computer Lab 113', type: 'lab', doors: [[598, 493]],
    poly: [[575, 410], [690, 372], [690, 465], [575, 500]] },
  { id: 'h120', name: 'Lecture Hall 120', type: 'lecture', doors: [[725, 548]],
    poly: [[692, 468], [775, 440], [775, 548], [692, 548]] },

  // Centre block
  { id: 'o130', name: 'Meeting Room', type: 'office', doors: [[548, 668]],
    poly: [[518, 594], [572, 594], [572, 668], [518, 668]] },
  { id: 'o131', name: 'Faculty Offices', type: 'office', doors: [[605, 668]],
    poly: [[572, 594], [640, 594], [640, 668], [572, 668]] },
  { id: 'o140', name: 'Admin Office', type: 'office', doors: [[278, 567]], link: 'k1',
    poly: [[232, 525], [286, 507], [286, 566], [244, 568]] },

  // Services
  { id: 'wc-m', name: 'Men’s Restroom', type: 'restroom', doors: [[306, 589]], keywords: 'toilet wc male',
    poly: [[290, 506], [322, 496], [322, 588], [290, 590]] },
  { id: 'wc-w', name: 'Women’s Restroom', type: 'restroom', doors: [[338, 587]], keywords: 'toilet wc female ladies',
    poly: [[322, 496], [354, 486], [354, 586], [322, 588]] },
  { id: 'wc-e', name: 'Restrooms East', type: 'restroom', doors: [[655, 548]], keywords: 'toilet wc',
    poly: [[622, 486], [690, 465], [690, 548], [622, 548]] },
  { id: 'lift', name: 'Lifts', type: 'lift', doors: [[272, 592]], keywords: 'elevator',
    poly: [[247, 572], [272, 572], [272, 612], [247, 612]] },
  { id: 'st-w', name: 'West Stairs', type: 'stairs', doors: [[228, 621]], keywords: 'exit emergency',
    poly: [[201, 546], [226, 537], [246, 612], [207, 630]] },
  { id: 'st-n', name: 'North Stairs', type: 'stairs', doors: [[385, 550]], keywords: 'exit emergency',
    poly: [[358, 482], [400, 468], [406, 545], [364, 556]] },
  { id: 'st-e', name: 'East Stairs', type: 'stairs', doors: [[655, 645]], keywords: 'exit emergency',
    poly: [[655, 588], [712, 588], [712, 662], [655, 662]] },
];

// Walkable corridor centre lines. Each array is a chain of connected nodes.
export const NODES = {
  k1: [281, 600],  // lift lobby
  u0: [290, 622],  // west end of the upper corridor
  e0: [520, 559],  // east end of the upper corridor
  e1: [647, 572],
  e2: [740, 572],
  w1: [238, 640],  // west atrium
  b0: [228, 684],  // south corridor, west end
  b9: [647, 684],
  b10: [740, 684], // south corridor, east end
};

export const PATHS = [
  ['k1', 'u0', 'e0', 'e1', 'e2', 'b10'],
  ['u0', 'w1', 'b0', 'b9', 'b10'],
  ['e1', 'b9'],
];

// Totem locations. Open the app with ?kiosk=k2 on the second totem.
// Optional heading: the direction a person faces while reading the screen, in degrees
// (0 = north / top of plan, 90 = east). With a heading, the first step says
// "Head to your left" etc., and the map turns so that "ahead" is up on the screen.
// It can also be set from the URL: ?kiosk=k2&heading=180
export const KIOSKS = {
  k1: { name: 'Lift lobby', at: [281, 600] },
  k2: { name: 'South corridor', at: [420, 684] },
};
