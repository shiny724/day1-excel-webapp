import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { findColumn, parseNum, fmtAxis, analyzeColumns } from '../utils'
import styles from './Chart.module.css'

const COLORS = ['#494fdf', '#4f55f1', '#3a40c4', '#00a87e', '#428619', '#ec7e00', '#e61e49', '#007bc2']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue} style={{ color: payload[0]?.color }}>
        {payload[0]?.name}: {payload[0]?.value?.toLocaleString('ko-KR')}
      </p>
    </div>
  )
}

function pickColumns(data) {
  // 파일별 우선 컬럼 목록
  const groupCandidates = ['지역', '사업유형', '사업부문', '국가', '제품군', '원산지', '도착지', '거래유형', '투자등급']
  const valueCandidates = ['연매출', '발전량(MWh)', '발전량', '총액(USD)', '총액', '매출액', '거래량(톤)']

  const groupCol = findColumn(data, groupCandidates)
  const valueCol = findColumn(data, valueCandidates)

  if (groupCol && valueCol) return { groupCol, valueCol }

  // 자동탐지 폴백
  const { catCols, numCols } = analyzeColumns(data)
  return {
    groupCol: groupCol || catCols[0]?.key || null,
    valueCol: valueCol || numCols[0]?.key || null,
  }
}

export default function RegionalChart({ data }) {
  const { groupCol, valueCol } = pickColumns(data)

  if (!groupCol || !valueCol) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}><h3 className={styles.title}>범주별 합계</h3></div>
        <div className={styles.noData}>범주/수치 컬럼을 찾을 수 없습니다</div>
      </div>
    )
  }

  const grouped = {}
  data.forEach(row => {
    const key = String(row[groupCol] || '기타')
    grouped[key] = (grouped[key] || 0) + parseNum(row[valueCol])
  })

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const title = `${groupCol}별 ${valueCol}`

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.badge}>{chartData.length}개</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#505a63' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: '#8d969e' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name={valueCol} radius={[6, 6, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
