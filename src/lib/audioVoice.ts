// Helper de acessibilidade: Leitor em voz alta com Web Speech API nativa

let activeUtterance: SpeechSynthesisUtterance | null = null

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    activeUtterance = null
  }
}

export function speakText(
  text: string,
  callbacks?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: (err: any) => void
  }
): boolean {
  if (!isSpeechSupported()) {
    callbacks?.onError?.('Navegador não suporta leitura em voz alta.')
    return false
  }

  // Interrompe qualquer áudio anterior
  window.speechSynthesis.cancel()

  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95 // Velocidade amigável, clara para jovens e idosos
    utterance.pitch = 1.0

    // Tenta encontrar uma voz pt-BR no navegador
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find((v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt'))
    if (ptVoice) {
      utterance.voice = ptVoice
    }

    utterance.onstart = () => {
      callbacks?.onStart?.()
    }

    utterance.onend = () => {
      activeUtterance = null
      callbacks?.onEnd?.()
    }

    utterance.onerror = (e) => {
      activeUtterance = null
      callbacks?.onError?.(e)
    }

    activeUtterance = utterance
    window.speechSynthesis.speak(utterance)
    return true
  } catch (err) {
    callbacks?.onError?.(err)
    return false
  }
}

/**
 * Toca um efeito sonoro festivo sintetizado via Web Audio API nativa
 * Não requer arquivos externos de áudio, funciona 100% offline e sem latência.
 */
export function playCryptoChime(): void {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime
    // Arpeggio alegre de vitória: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.1)
      gain.gain.setValueAtTime(0.28, now + idx * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.38)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.1)
      osc.stop(now + idx * 0.1 + 0.4)
    })
  } catch {
    // Áudio silenciado ou bloqueado pelo browser
  }
}

