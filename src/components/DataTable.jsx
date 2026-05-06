import { useState } from 'react'
import styles from './DataTable.module.css'

export default function DataTable({ data }) {
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const pageSize = 15

  if (!data || !data.length) {
    return <div className={styles.empty}>검색 결과가 없습니다</div>
  }

  const columns = Object.keys(data[0])

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0
    const av = a[sortCol], bv = b[sortCol]
    const an = parseFloat(String(av).replace(/,/g, ''))
    const bn = parseFloat(String(bv).replace(/,/g, ''))
    if (!isNaN(an) && !isNaN(bn)) {
      return sortDir === 'asc' ? an - bn : bn - an
    }
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv), 'ko')
      : String(bv).localeCompare(String(av), 'ko')
  })

  const totalPages = Math.ceil(sorted.length / pageSize)
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const isNumeric = (col) => {
    const sample = data.slice(0, 5).map(r => parseFloat(String(r[col]).replace(/,/g, '')))
    return sample.filter(n => !isNaN(n)).length >= 3
  }

  const fmt = (val) => {
    const n = parseFloat(String(val).replace(/,/g, ''))
    if (!isNaN(n) && val !== '') return n.toLocaleString('ko-KR')
    return val
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className={`${styles.th} ${isNumeric(col) ? styles.thNum : ''}`}
                  onClick={() => handleSort(col)}
                >
                  <span className={styles.thInner}>
                    {col}
                    <span className={styles.sortIcon}>
                      {sortCol === col
                        ? (sortDir === 'asc' ? '↑' : '↓')
                        : '↕'}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className={styles.tr}>
                {columns.map(col => (
                  <td
                    key={col}
                    className={`${styles.td} ${isNumeric(col) ? styles.tdNum : ''}`}
                  >
                    {fmt(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ←
          </button>
          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
