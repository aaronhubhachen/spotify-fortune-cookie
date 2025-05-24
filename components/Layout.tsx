import styles from '@/styles/Layout.module.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.glowEffects}>
        <div className={styles.glowPrimary}></div>
        <div className={styles.glowSecondary}></div>
        <div className={styles.glowTertiary}></div>
      </div>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
} 