import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { findColumn, parseNum, fmtAxis, analyzeColumns } from '../utils'
import styles from './Chart.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue} style={{ color: v >= 0 ? '#428619' : '#e23b4a' }}>
        {payload[0]?.name}: {v?.toLocaleString('ko-KR')}
      </p>
    </div>
  )
}

function pickColumns(data) {
  const entityCandidates = ['법인명', '발전소명', '고객사', '법인', '제품군']
  const valueCandidates  = ['연영업이익', '발전량(MWh)', '발전량', '총액(USD)', '총액', '영업이익']

  const entityCol = findColumn(data, entityCandidates)
  const valueCol  = findColumn(data, valueCandidates)
  if (entityCol && valueCol) return { entityCol, valueCol }

  const { entityCols, numCols } = analyzeColumns(data)
  return {
    entityCol: entityCol || entityCols[0]?.key || null,
    valueCol:  valueCol  || numCols[0]?.key  || null,
  }
}

export default function ProfitChart({ data }) {
  const { entityCol, valueCol } = pickColumns(data)

  if (!entityCol || !valueCol) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}><h3 className={styles.title}>항목별 분석</h3></div>
        <div className={styles.noData}>엔티티/수치 컬럼을 찾을 수 없습니다</div>
      </div>
    )
  }

  const grouped = {}
  data.forEach(row => {
    const entity = String(row[entityCol] || '기타')
    grouped[entity] = (grouped[entity] || 0) + parseNum(row[valueCol])
  })

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20)

  const hasNegative = chartData.some(d => d.value < 0)

  // 긴 이름 축약
  const shorten = (name) =>
    String(name)
      .replace(/POSCO INTL /gi, '')
      .replace(/POSCO /gi, '')
      .substring(0, 14)

  const title = `${entityCol}별 ${valueCol}`

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>{title}</h3>
        {hasNegative && (
          <div className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: '#428619' }} />
            <span className={styles.legendText}>양수</span>
            <span className={styles.legendDot} style={{ background: '#e23b4a' }} />
            <span className={styles.legendText}>음수</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tickFormatter={shorten}
            tick={{ fontSize: 11, fill: '#505a63' }}
            axisLine={false} tickLine={false}
            angle={-40} textAnchor="end" interval={0}
          />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#8d969e' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          {hasNegative && <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" strokeWidth={1} />}
          <Bar dataKey="value" name={valueCol} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? '#494fdf' : '#e23b4a'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
