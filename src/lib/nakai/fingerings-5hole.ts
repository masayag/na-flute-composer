import type { NakaiFingeringDef } from '../types'

/** 5-hole flute fingerings — top hole is absent; index 0 is the uppermost playing hole. */
export const FINGERINGS_5HOLE: NakaiFingeringDef[] = [
  {
    id: 'fundamental',
    name: 'Fundamental',
    holes: ['closed', 'closed', 'closed', 'closed', 'closed'],
    staffKey: 'f#/4',
  },
  {
    id: 'n2',
    name: '2nd',
    holes: ['closed', 'closed', 'closed', 'closed', 'open'],
    staffKey: 'g#/4',
  },
  {
    id: 'n3',
    name: '3rd',
    holes: ['closed', 'closed', 'closed', 'open', 'open'],
    staffKey: 'a/4',
  },
  {
    id: 'n4',
    name: '4th',
    holes: ['closed', 'closed', 'open', 'open', 'open'],
    staffKey: 'b/4',
  },
  {
    id: 'n5',
    name: '5th',
    holes: ['closed', 'open', 'open', 'open', 'open'],
    staffKey: 'c#/5',
  },
  {
    id: 'n6',
    name: '6th',
    holes: ['open', 'open', 'open', 'open', 'open'],
    staffKey: 'd#/5',
  },
  {
    id: 'n7',
    name: '7th',
    holes: ['closed', 'closed', 'closed', 'open', 'closed'],
    staffKey: 'e/5',
  },
  {
    id: 'n8',
    name: '8th',
    holes: ['closed', 'closed', 'open', 'open', 'closed'],
    staffKey: 'f#/5',
  },
  {
    id: 'n9',
    name: '9th',
    holes: ['closed', 'open', 'open', 'open', 'closed'],
    staffKey: 'g#/5',
  },
  {
    id: 'n10',
    name: '10th',
    holes: ['closed', 'closed', 'open', 'closed', 'closed'],
    staffKey: 'a/5',
  },
]
