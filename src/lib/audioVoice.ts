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
