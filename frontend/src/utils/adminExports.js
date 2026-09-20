const safeCell = (value) => {
  const text = String(value ?? '')
  const safe = /^[=+@-]/.test(text.trimStart()) ? "'" + text : text
  return '"' + safe.replaceAll('"', '""') + '"'
}

export const downloadCsv = (filename, headers, rows) => {
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(safeCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
