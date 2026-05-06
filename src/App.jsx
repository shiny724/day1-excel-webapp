import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import UploadZone from './components/UploadZone'
import MetricCards from './components/MetricCards'
import DataTable from './components/DataTable'
import RegionalChart from './components/RegionalChart'
import QuarterlyChart from './components/QuarterlyChart'
import ProfitChart from './components/ProfitChart'
import styles from './App.module.css'

export default function App() {
  const [data, setData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('전체')

  const handleFile = useCallback((file) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(firstSheet, { defval: '', header: 1 })

      // 실제 헤더 행 자동 탐지: 비어있지 않은 셀이 가장 많고 단일 타이틀이 아닌 행
      let headerIdx = 0
      let maxFilled = 0
      for (let i = 0; i < Math.min(20, raw.length); i++) {
        const row = raw[i]
        const filled = row.filter(c => c !== '' && c != null).length
        if (filled > maxFilled && filled > 3) {
          const firstCell = String(row[0] || '')
          const looksLikeTitle = filled <= 2 || firstCell.length > 40
          if (!looksLikeTitle) { maxFilled = filled; headerIdx = i }
        }
      }

      const headers = raw[headerIdx]

      // 요약/합계 행 판별: 셀에 TOTAL·합계·소계·집계 등이 포함된 행 제거
      const isSummaryRow = (row) =>
        row.some(c => /TOTAL|합계|소계|집계|grand|subtotal/i.test(String(c || '')))

      const jsonData = raw
        .slice(headerIdx + 1)
        .filter(row => row.some(c => c !== '' && c != null))
        .filter(row => !isSummaryRow(row))
        .map(row => {
          const obj = {}
          headers.forEach((h, i) => {
            if (h !== '' && h != null) obj[String(h)] = row[i] ?? ''
          })
          return obj
        })
        .filter(obj => Object.keys(obj).length > 0)

      setData(jsonData)
      setSearchTerm('')
      setActiveFilter('전체')
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const regions = data
    ? ['전체', ...new Set(data.map(r => r['지역'] || r['region'] || r['Region'] || '').filter(Boolean))]
    : ['전체']

  const filteredData = data
    ? data.filter(row => {
        const matchesSearch = searchTerm === '' || Object.values(row).some(v =>
          String(v).toLowerCase().includes(searchTerm.toLowerCase())
        )
        const matchesFilter = activeFilter === '전체' ||
          (row['지역'] || row['region'] || row['Region'] || '') === activeFilter
        return matchesSearch && matchesFilter
      })
    : []

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#494fdf"/>
                <path d="M7 8h10a5 5 0 0 1 0 10H7V8z" fill="white"/>
                <rect x="7" y="20" width="6" height="4" fill="white"/>
              </svg>
            </div>
            <span className={styles.brandName}>DataPulse</span>
          </div>
          {data && (
            <div className={styles.headerMeta}>
              <span className={styles.fileBadge}>{fileName}</span>
              <button className={styles.resetBtn} onClick={() => { setData(null); setFileName('') }}>
                새 파일
              </button>
            </div>
          )}
        </div>
      </header>

      {!data ? (
        <main className={styles.uploadMain}>
          <div className={styles.heroSection}>
            <p className={styles.heroEyebrow}>엑셀 대시보드</p>
            <h1 className={styles.heroTitle}>데이터를<br />시각화하세요</h1>
            <p className={styles.heroSub}>
              .xlsx 파일을 업로드하면 표, 차트, 핵심 지표를<br />
              자동으로 분석해 드립니다
            </p>
            <UploadZone onFile={handleFile} />
          </div>
        </main>
      ) : (
        <main className={styles.dashMain}>
          <section className={styles.metricsSection}>
            <div className={styles.container}>
              <MetricCards data={filteredData} allData={data} />
            </div>
          </section>

          <section className={styles.chartsSection}>
            <div className={styles.container}>
              <div className={styles.chartsGrid}>
                <RegionalChart data={data} />
                <QuarterlyChart data={data} />
              </div>
              <div className={styles.chartsFull}>
                <ProfitChart data={data} />
              </div>
            </div>
          </section>

          <section className={styles.tableSection}>
            <div className={styles.container}>
              <div className={styles.tableControls}>
                <div className={styles.tableHeader}>
                  <h2 className={styles.sectionTitle}>원본 데이터</h2>
                  <span className={styles.rowCount}>{filteredData.length}행</span>
                </div>
                <div className={styles.controlsRow}>
                  <div className={styles.searchWrap}>
                    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input
                      className={styles.searchInput}
                      type="text"
                      placeholder="데이터 검색..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>×</button>
                    )}
                  </div>
                  {regions.length > 1 && (
                    <div className={styles.filterPills}>
                      {regions.map(r => (
                        <button
                          key={r}
                          className={`${styles.filterPill} ${activeFilter === r ? styles.filterPillActive : ''}`}
                          onClick={() => setActiveFilter(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DataTable data={filteredData} />
            </div>
          </section>
        </main>
      )}
    </div>
  )
}
