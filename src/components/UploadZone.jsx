import { useState, useRef, useCallback } from 'react'
import styles from './UploadZone.module.css'

export default function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFile(file)
    }
  }, [onFile])

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className={styles.input}
        onChange={handleChange}
      />
      <div className={styles.iconWrap}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="12" fill="rgba(73,79,223,0.12)"/>
          <path d="M20 26V14M20 14l-5 5M20 14l5 5" stroke="#494fdf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 28h14" stroke="#494fdf" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className={styles.primary}>파일을 드래그하거나 클릭하여 업로드</p>
      <p className={styles.secondary}>.xlsx 파일 지원</p>
      <button className={styles.cta} onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
        파일 선택
      </button>
    </div>
  )
}
