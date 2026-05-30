/**
 * Badge component – small status pill.
 * @param {{ variant?: 'success'|'warning'|'error'|'info'|'default', children: React.ReactNode }} props
 */
function Badge({ variant = 'default', children }) {
  const colors = {
    default: { bg: '#e2e8f0', color: '#475569' },
    success: { bg: '#dcfce7', color: '#166534' },
    warning: { bg: '#fef9c3', color: '#854d0e' },
    error:   { bg: '#fee2e2', color: '#991b1b' },
    info:    { bg: '#dbeafe', color: '#1e40af' },
  }
  const { bg, color } = colors[variant] || colors.default

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: bg,
      color,
    }}>
      {children}
    </span>
  )
}

export default Badge
