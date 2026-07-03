import type { NakaiFingeringDef } from '../types'

/** 6-hole contemporary pentatonic minor — Nakai staff positions (layout anchors, not concert pitch). */
export const FINGERINGS_6HOLE: NakaiFingeringDef[] = [
  {
    id: 'fundamental',
    name: 'Fundamental',
    holes: ['closed', 'closed', 'closed', 'closed', 'closed', 'closed'],
    staffKey: 'f#/4',
    description: 'All holes closed — lowest note',
  },
  {
    id: 'n2',
    name: '2nd',
    holes: ['closed', 'closed', 'closed', 'closed', 'closed', 'open'],
    staffKey: 'g#/4',
  },
  {
    id: 'n3',
    name: '3rd',
    holes: ['closed', 'closed', 'closed', 'closed', 'open', 'open'],
    staffKey: 'a/4',
  },
  {
    id: 'n4',
    name: '4th',
    holes: ['closed', 'closed', 'closed', 'open', 'open', 'open'],
    staffKey: 'b/4',
  },
  {
    id: 'n5',
    name: '5th',
    holes: ['closed', 'closed', 'open', 'open', 'open', 'open'],
    staffKey: 'c#/5',
  },
  {
    id: 'n6',
    name: '6th',
    holes: ['closed', 'open', 'open', 'open', 'open', 'open'],
    staffKey: 'd#/5',
  },
  {
    id: 'n7',
    name: '7th',
    holes: ['open', 'open', 'open', 'open', 'open', 'open'],
    staffKey: 'e/5',
  },
  {
    id: 'n8',
    name: '8th',
    holes: ['closed', 'closed', 'closed', 'closed', 'open', 'closed'],
    staffKey: 'f#/5',
  },
  {
    id: 'n9',
    name: '9th',
    holes: ['closed', 'closed', 'closed', 'open', 'open', 'closed'],
    staffKey: 'g#/5',
  },
  {
    id: 'n10',
    name: '10th',
    holes: ['closed', 'closed', 'open', 'open', 'open', 'closed'],
    staffKey: 'a/5',
  },
  {
    id: 'n11',
    name: '11th',
    holes: ['closed', 'open', 'open', 'open', 'open', 'closed'],
    staffKey: 'b/5',
  },
  {
    id: 'n12',
    name: '12th',
    holes: ['closed', 'closed', 'closed', 'open', 'closed', 'closed'],
    staffKey: 'c#/6',
  },
  {
    id: 'n13',
    name: '13th',
    holes: ['closed', 'closed', 'open', 'open', 'closed', 'closed'],
    staffKey: 'd#/6',
  },
  {
    id: 'n14',
    name: '14th',
    holes: ['closed', 'open', 'open', 'open', 'closed', 'closed'],
    staffKey: 'e/6',
  },
  {
    id: 'n15',
    name: '15th',
    holes: ['closed', 'open', 'open', 'closed', 'closed', 'closed'],
    staffKey: 'f#/6',
  },
]
