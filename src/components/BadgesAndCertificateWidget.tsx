import { useState } from 'react'
import type { PracticeTransaction, UserProfile } from '../types'
import { PLATFORM_BADGES, mintPracticeNftCertificate } from '../lib/practiceWallet'

interface BadgesAndCertificateWidgetProps {
  user: UserProfile
  onSave: (changes: Partial<UserProfile>) => void
  onOpenExplorer?: (tx: PracticeTransaction) => void
}

export function BadgesAndCertificateWidget({ user, onSave, onOpenExplorer }: BadgesAndCertificateWidgetProps) {
  const [mintLoading, setMintLoading] = useState(false)
  const [mintNotice, setMintNotice] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const userBadges = user.badges || ['badge_welcome']
  const nft = user.nftCertificate || { minted: false, title: 'Certificado de Conclusão Web3 & Blockchain (Solana Devnet)' }

  function handleMintCertificate() {
    if (mintLoading || nft.minted) return
    setMintLoading(true)
    setMintNotice('')

    setTimeout(() => {
      const { updatedUser, transaction, mintAddress } = mintPracticeNftCertificate(user)
      onSave({
        xp: updatedUser.xp,
        badges: updatedUser.badges,
        nftCertificate: updatedUser.nftCertificate,
        practiceTransactions: updatedUser.practiceTransactions,
      })
      setMintLoading(false)
      setMintNotice(`🎉 Parabéns! Certificado cunhado na Solana Devnet com sucesso! Endereço do NFT: ${mintAddress}`)
    }, 1000)
  }

  function handleShare() {
    navigator.clipboard.writeText(
      `Concluí a Trilha Web3 na plataforma Abracadabra e emiti meu Certificado NFT na Solana Devnet! Mint: ${nft.mintAddress || 'Devnet'}`
    )
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <section className="badges-and-cert-section" aria-label="Conquistas e Certificado NFT">
      {/* 1. Galeria de Conquistas */}
      <div className="badges-gallery-card">
        <div className="gallery-header">
          <div>
            <h3>🏆 Minhas Conquistas Web3</h3>
            <p>Emblemas desbloqueados ao longo da sua jornada de estudos e prática on-chain.</p>
          </div>
          <div className="gallery-counter-badge">
            <strong>{userBadges.length} de {PLATFORM_BADGES.length}</strong> conquistadas
          </div>
        </div>

        <div className="badges-grid">
          {PLATFORM_BADGES.map((badge) => {
            const isUnlocked = userBadges.includes(badge.id)
            return (
              <div key={badge.id} className={`badge-card-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="badge-icon-wrap">
                  <span className="badge-emoji">{badge.icon}</span>
                  {isUnlocked && <span className="badge-check-star">✓</span>}
                </div>
                <div className="badge-info">
                  <strong>{badge.title}</strong>
                  <p>{badge.description}</p>
                </div>
                <span className={`badge-status-tag ${isUnlocked ? 'tag-unlocked' : 'tag-locked'}`}>
                  {isUnlocked ? 'Conquistado' : 'Bloqueado'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Credencial / Certificado NFT da Devnet */}
      <div className="certificate-hologram-card">
        <div className="cert-top-branding">
          <div className="cert-logo-row">
            <span className="cert-magic-icon">🪄</span>
            <div>
              <span className="cert-org">ABRACADABRA EDUCAÇÃO DIGITAL</span>
              <h4>CERTIFICADO OFICIAL DE CONCLUSÃO WEB3</h4>
            </div>
          </div>
          <div className="cert-network-pill">Solana Devnet Token Standard (SPL)</div>
        </div>

        <div className="cert-body">
          <p className="cert-certifies-text">Certificamos solenemente que o estudante</p>
          <h2 className="cert-student-name">{user.displayName || 'Estudante Web3'}</h2>
          <p className="cert-student-sub">
            completou com distinção as trilhas de Educação Cripto, Autocustódia Segura, Transferências On-Chain, Mecanismos DeFi e Defesa Anti-Golpe.
          </p>

          <div className="cert-credentials-grid">
            <div className="cert-cred-item">
              <span>NÍVEL ALCANÇADO</span>
              <strong>{user.level || 'Explorador'}</strong>
            </div>
            <div className="cert-cred-item">
              <span>XP TOTAL ACUMULADO</span>
              <strong>{user.xp || 0} XP</strong>
            </div>
            <div className="cert-cred-item">
              <span>CHAVE PÚBLICA DO ALUNO</span>
              <strong className="wallet-mono">{user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-6)}</strong>
            </div>
          </div>

          {nft.minted ? (
            <div className="cert-minted-banner">
              <div className="mint-seal">
                <span className="seal-icon">🎖️</span>
                <div>
                  <strong className="seal-title">NFT CUNHADO COM SUCESSO NA BLOCKCHAIN</strong>
                  <p className="mint-addr">Mint ID: {nft.mintAddress}</p>
                  <small>Emitido em: {nft.mintedAt ? new Date(nft.mintedAt).toLocaleDateString('pt-BR') : 'Hoje'}</small>
                </div>
              </div>

              <div className="cert-action-buttons">
                {onOpenExplorer && (
                  <button
                    type="button"
                    className="btn-cert-explorer"
                    onClick={() =>
                      onOpenExplorer({
                        id: `tx-nft-view`,
                        type: 'reward',
                        amount: 0,
                        signature: nft.mintAddress || 'CERT-HASH-DEVNET',
                        toOrFrom: 'NFT Mint Address (Solana Devnet)',
                        timestamp: nft.mintedAt || new Date().toISOString(),
                        status: 'confirmada',
                      })
                    }
                  >
                    Ver no Explorador de Blocos 🔍
                  </button>
                )}
                <button type="button" className="btn-cert-share" onClick={handleShare}>
                  {copiedLink ? '✓ Link Copiado!' : 'Compartilhar Conquista 📢'}
                </button>
              </div>
            </div>
          ) : (
            <div className="cert-unminted-box">
              <p>
                Este certificado está pronto para ser registrado eternamente como um <strong>NFT não-fungível</strong> na rede de testes Solana Devnet.
              </p>
              {mintNotice && <p className="mint-success-text">{mintNotice}</p>}
              <button
                type="button"
                className="btn-mint-nft-action"
                disabled={mintLoading}
                onClick={handleMintCertificate}
              >
                {mintLoading ? 'Cunhando NFT na Solana Devnet...' : 'Cunhar Certificado NFT na Devnet 📜 (+100 XP)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
