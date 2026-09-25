import phrasesJson from './phrases.json'
import listeningJson from './listening.json'
import signsJson from './signs.json'

export const CATEGORIES = [
  'basics',
  'restaurant',
  'shopping',
  'transport',
  'hotel',
  'sightseeing',
  'health',
  'emergency',
  'social',
] as const
export type Category = (typeof CATEGORIES)[number]

export const SIGN_PLACES = ['station', 'street', 'shop', 'restaurant', 'menu', 'toilet', 'onsen', 'hotel'] as const
export type SignPlace = (typeof SIGN_PLACES)[number]

export const LISTEN_PLACES = ['shop', 'konbini', 'restaurant', 'station', 'street'] as const
export type ListenPlace = (typeof LISTEN_PLACES)[number]

export interface Phrase {
  id: string
  cat: Category
  ja: string
  kana: string
  romaji: string
  he_pron: string
  he: string
  en: string
  card: boolean
}

export interface ListenCard {
  id: string
  where: ListenPlace
  ja: string
  kana: string
  romaji: string
  he: string
  en: string
  reply_he: string
  reply_en: string
}

export interface Sign {
  id: string
  kanji: string
  reading: string
  romaji: string
  he: string
  en: string
  where: SignPlace
}

export const phrases = phrasesJson as Phrase[]
export const listening = listeningJson as ListenCard[]
export const signs = signsJson as Sign[]
