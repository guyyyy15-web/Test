// iOS returns no voices until 'voiceschanged' fires, so the voice is looked up on each call.
function japaneseVoice(): SpeechSynthesisVoice | undefined {
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ja'))
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakJapanese(text: string): void {
  if (!canSpeak()) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  const voice = japaneseVoice()
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
}

if (canSpeak()) {
  speechSynthesis.getVoices()
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices())
}
