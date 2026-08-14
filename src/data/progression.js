/** What a brand new party walks out of the character creation screen with. */

export const STARTING_GOLD = 400

export const STARTING_INVENTORY = [
  { id: 'potion', qty: 5 },
  { id: 'antidote', qty: 2 },
]

/**
 * Each class begins with the cheapest thing it can hold. The Monk begins with
 * nothing, which is not an oversight -- bare hands are the point.
 */
export const STARTING_EQUIPMENT = {
  warrior: { weapon: 'rusted-sword', body: 'leather-armor' },
  thief: { weapon: 'knife', body: 'leather-armor' },
  monk: { body: 'leather-armor' },
  whiteMage: { weapon: 'oak-staff', body: 'cloth-robe' },
  blackMage: { weapon: 'ash-rod', body: 'cloth-robe' },
  redMage: { weapon: 'knife', body: 'cloth-robe' },
}

export const PARTY_SIZE = 4

/** Suggested names, so a player who does not want to type can still start. */
export const DEFAULT_NAMES = {
  warrior: ['Ryn', 'Bors', 'Gale', 'Kade'],
  thief: ['Wren', 'Fen', 'Sly', 'Nix'],
  monk: ['Tam', 'Oda', 'Bel', 'Kor'],
  whiteMage: ['Isa', 'Lume', 'Vera', 'Sela'],
  blackMage: ['Zel', 'Mor', 'Ash', 'Vex'],
  redMage: ['Cass', 'Roen', 'Pim', 'Dael'],
}
