import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { findColumn, parseNum, fmtAxis, analyzeColumns, toMonthKey } from '../utils'
import styles from './Chart.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue} style={{ color: '#494fdf' }}>
        {payload[0]?.name}: {payload[0]?.value?.toLocaleString('ko-KR')}
      </p>
    </div>
  )
}

function pickColumns(data) {
  const keys = Object.keys(data[0])

  // ── Q1~Q4 컬럼 패턴 (해외법인 파일) ──
  const qSalesCols = keys.filter(k => /^Q[1-4]매출$/.test(k))
  if (qSalesCols.length >= 2) {
    return { mode: 'q-cols', qCols: qSalesCols }
  }

  // ── 시간 컬럼 + 수치 컬럼 방식 ──
  const timeCandidates = ['월', '분기', '거래일', '기간', 'date']
  const valueCandidates = ['연매출', '발전량(MWh)', '발전량', '총액(USD)', '총액', '매출액']

  const timeCol = findColumn(data, timeCandidates)
  const valueCol = findColumn(data, valueCandidates)
  if (timeCol && valueCol) return { mode: 'time-col', timeCol, valueCol }

  // 자동탐지 폴백
  const { timeCols, numCols } = analyzeColumns(data)
  return {
    mode: 'time-col',
    timeCol: timeCols[0]?.key || null,
    valueCol: numCols[0]?.key || null,
  }
}

export default function QuarterlyChart({ data }) {
  if (!data?.length) return null

  const config = pickColumns(data)
  let chartData = [], dataLabel = '', title = '추이 차트'

  if (config.mode === 'q-cols') {
    // 분기 컬럼 합산 (Q1매출, Q2매출, ...)
    chartData = config.qCols.map(col => ({
      name: col.replace('매출', '').trim(),
      value: data.reduce((s, r) => s + parseNum(r[col]), 0),
    }))
    dataLabel = '분기매출'
    title = '분기별 매출 추이'

  } else if (config.timeCol && config.valueCol) {
    const { timeCol, valueCol } = config

    // 날짜형(YYYY-MM-DD)이면 월 단위로 집계
    const isFullDate = data.some(r => /^\d{4}-\d{2}-\d{2}/.test(String(r[timeCol] || '')))
    const getKey = isFullDate ? (r) => toMonthKey(r[timeCol]) : (r) => String(r[timeCol] || '기타')

    const grouped = {}
    data.forEach(r => {
      const k = getKey(r)
      grouped[k] = (grouped[k] || 0) + parseNum(r[valueCol])
    })

    chartData = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))

    dataLabel = valueCol
    title = isFullDate
      ? `월별 ${valueCol} 추이`
      : `${timeCol}별 ${valueCol} 추이`

  } else {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}><h3 className={styles.title}>추이 차트</h3></div>
        <div className={styles.noData}>시계열/수치 컬럼을 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.badge}>{chartData.length}개</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#494fdf" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#494fdf" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#505a63' }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#8d969e' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="value" name={dataLabel}
            stroke="#494fdf" strokeWidth={2.5}
            fill="url(#areaGrad)"
            dot={{ fill: '#494fdf', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: '#494fdf' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
