export function parseNum(v) {
  const n = parseFloat(String(v).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

// 정확 일치 → 부분 일치 순으로 탐색
export function findColumn(data, candidates) {
  if (!data?.length) return null
  const keys = Object.keys(data[0])
  for (const c of candidates) {
    const exact = keys.find(k => k === c)
    if (exact) return exact
  }
  for (const c of candidates) {
    const partial = keys.find(k => k.includes(c))
    if (partial) return partial
  }
  return null
}

export function fmtNum(v) {
  if (v === null || v === undefined) return '-'
  if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B'
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return v.toLocaleString()
}

export function fmtAxis(v) {
  if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B'
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return String(v)
}

// 데이터에서 컬럼 특성을 분석해 최적 컬럼을 자동 탐지
export function analyzeColumns(data) {
  if (!data?.length) return {}
  const keys = Object.keys(data[0])
  const n = data.length

  const cols = keys.map(key => {
    const rawVals = data.map(r => r[key]).filter(v => v !== '' && v != null)
    const numVals = rawVals.map(v => parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v))
    const isNumeric = numVals.length / Math.max(rawVals.length, 1) > 0.7
    const strVals = rawVals.map(v => String(v))
    const uniqueCount = new Set(strVals).size
    // 날짜형: YYYY-MM-DD 또는 YYYY-MM
    const isDateLike = strVals.some(v => /^\d{4}-\d{2}/.test(v))
    const isId = /코드|번호|ID$|id$/i.test(key)
    const isRate = /률|율|%/.test(key) && isNumeric

    return {
      key, isNumeric, isDateLike, isId, isRate,
      uniqueCount,
      cardinality: uniqueCount / n,
      sum: isNumeric ? numVals.reduce((a, b) => a + b, 0) : 0,
      avg: isNumeric && numVals.length ? numVals.reduce((a, b) => a + b, 0) / numVals.length : 0,
    }
  })

  // 범주형: 비수치, 비ID, 유니크값 2~30개
  const catCols = cols
    .filter(c => !c.isNumeric && !c.isDateLike && !c.isId && c.uniqueCount >= 2 && c.uniqueCount <= 30)
    .sort((a, b) => a.uniqueCount - b.uniqueCount)

  // 엔티티형: 비수치, 비ID, 중간~높은 카디널리티
  const entityCols = cols
    .filter(c => !c.isNumeric && !c.isId && c.uniqueCount >= 3 && c.uniqueCount <= 100)
    .sort((a, b) => b.uniqueCount - a.uniqueCount)

  // 시간형: 날짜처럼 보이거나 키에 월/일/분기 포함
  const timeCols = cols
    .filter(c => c.isDateLike || /^월$|분기|기간|거래일|date/i.test(c.key))
    .sort((a, b) => (b.isDateLike ? 1 : 0) - (a.isDateLike ? 1 : 0))

  // 수치형: 합계 내림차순
  const numCols = cols
    .filter(c => c.isNumeric && !c.isId && !c.isRate)
    .sort((a, b) => b.sum - a.sum)

  // 비율형
  const rateCols = cols.filter(c => c.isRate)

  return { catCols, entityCols, timeCols, numCols, rateCols, all: cols }
}

// 날짜 문자열에서 YYYY-MM 추출 (트레이딩 거래일 등)
export function toMonthKey(v) {
  const s = String(v)
  // YYYY-MM-DD → YYYY-MM
  const m = s.match(/^(\d{4}-\d{2})/)
  return m ? m[1] : s
}
