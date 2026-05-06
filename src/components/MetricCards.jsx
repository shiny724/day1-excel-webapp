import { findColumn, parseNum, fmtNum, analyzeColumns } from '../utils'
import styles from './MetricCards.module.css'

function buildMetrics(data) {
  const keys = Object.keys(data[0])
  const { numCols, rateCols, catCols, entityCols } = analyzeColumns(data)
  const n = data.length

  const sum = (col) => data.reduce((s, r) => s + parseNum(r[col]), 0)
  const avg = (col) => sum(col) / n

  // ── 파일 유형 판별 ──
  const isPlant  = !!findColumn(data, ['발전소명', '발전량'])
  const isTrade  = !!findColumn(data, ['거래번호', '거래일', '총액(USD)'])
  const isCorpPL = !!findColumn(data, ['연매출', '연영업이익'])

  if (isCorpPL) {
    const salesCol  = findColumn(data, ['연매출'])
    const profitCol = findColumn(data, ['연영업이익'])
    const ts = sum(salesCol), tp = sum(profitCol)
    return [
      { label: '총 법인 수',    value: n.toLocaleString(),       unit: '개사',  color: '#494fdf', icon: 'grid' },
      { label: `${salesCol} 합계`,  value: fmtNum(ts), unit: '백만원', color: '#00a87e', icon: 'sun'  },
      { label: `${profitCol} 합계`, value: fmtNum(tp), unit: '백만원', color: '#428619', icon: 'trend'},
      { label: '영업이익률',    value: ts ? ((tp/ts)*100).toFixed(1) : 'N/A', unit: ts ? '%' : '', color: '#4f55f1', icon: 'clock'},
    ]
  }

  if (isPlant) {
    const genCol  = findColumn(data, ['발전량(MWh)', '발전량'])
    const cfCol   = findColumn(data, ['가동률(%)', '가동률'])
    const co2Col  = findColumn(data, ['온실가스(tCO₂)', '온실가스'])
    const nameCol = findColumn(data, ['발전소명'])
    const plantCount = nameCol ? new Set(data.map(r => r[nameCol])).size : n
    return [
      { label: '발전소 수',       value: plantCount.toLocaleString(),     unit: '개소',  color: '#494fdf', icon: 'grid'  },
      { label: genCol  || '발전량',   value: genCol  ? fmtNum(sum(genCol))  : 'N/A', unit: genCol  ? 'MWh'   : '', color: '#00a87e', icon: 'sun'   },
      { label: cfCol   || '가동률',   value: cfCol   ? avg(cfCol).toFixed(1)  : 'N/A', unit: cfCol   ? '%'     : '', color: '#ec7e00', icon: 'trend' },
      { label: co2Col  || '온실가스', value: co2Col  ? fmtNum(sum(co2Col)) : 'N/A', unit: co2Col  ? 'tCO₂' : '', color: '#e23b4a', icon: 'clock' },
    ]
  }

  if (isTrade) {
    const amtCol    = findColumn(data, ['총액(USD)', '총액'])
    const rateCol   = findColumn(data, ['영업이익률(%)', '영업이익률'])
    const sectorCol = findColumn(data, ['사업부문'])
    const sectorCount = sectorCol ? new Set(data.map(r => r[sectorCol])).size : '-'
    return [
      { label: '총 거래 건수',   value: n.toLocaleString(),               unit: '건',  color: '#494fdf', icon: 'grid'  },
      { label: amtCol  || '거래액', value: amtCol  ? fmtNum(sum(amtCol))  : 'N/A', unit: amtCol  ? 'USD' : '', color: '#00a87e', icon: 'sun'   },
      { label: '평균 영업이익률', value: rateCol ? avg(rateCol).toFixed(1) : 'N/A', unit: rateCol ? '%'  : '', color: '#428619', icon: 'trend' },
      { label: '사업부문 수',     value: sectorCount.toLocaleString(),    unit: '개',  color: '#4f55f1', icon: 'clock' },
    ]
  }

  // ── 범용 폴백 ──
  const primary   = numCols[0]
  const secondary = numCols[1]
  const rateCol   = rateCols[0]
  const catCol    = catCols[0]
  return [
    { label: '총 데이터 행',   value: n.toLocaleString(), unit: '행', color: '#494fdf', icon: 'grid'  },
    { label: primary?.key   || '주요 지표', value: primary   ? fmtNum(data.reduce((s,r) => s+parseNum(r[primary.key]),   0)) : 'N/A', unit: '', color: '#00a87e', icon: 'sun'   },
    { label: secondary?.key || '보조 지표', value: secondary ? fmtNum(data.reduce((s,r) => s+parseNum(r[secondary.key]), 0)) : 'N/A', unit: '', color: '#428619', icon: 'trend' },
    { label: rateCol?.key   || (catCol?.key || '분류 수'), value: rateCol ? (data.reduce((s,r) => s+parseNum(r[rateCol.key]), 0)/n).toFixed(1) : (catCol ? new Set(data.map(r=>r[catCol.key])).size.toString() : 'N/A'), unit: rateCol ? '%' : (catCol ? '종' : ''), color: '#4f55f1', icon: 'clock' },
  ]
}

const ICONS = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.8"/>
      <rect x="2" y="8.75" width="16" height="2.5" rx="1.25" fill="currentColor"/>
      <rect x="2" y="13.5" width="10" height="2.5" rx="1.25" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  sun: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  trend: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 14l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export default function MetricCards({ data }) {
  if (!data?.length) return null
  const metrics = buildMetrics(data)

  return (
    <div className={styles.grid}>
      {metrics.map((m, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.label}>{m.label}</span>
            <div className={styles.iconBox} style={{ color: m.color, background: `${m.color}18` }}>
              {ICONS[m.icon]}
            </div>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{m.value}</span>
            {m.unit && <span className={styles.unit}>{m.unit}</span>}
          </div>
          <div className={styles.accent} style={{ background: m.color }} />
        </div>
      ))}
    </div>
  )
}
