import styles from './Input.module.css'

/**
 * Reusable Input component.
 * @param {{ label?: string, error?: string } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
function Input({ label, error, id, className = '', ...rest }) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={[styles.input, error ? styles.hasError : '', className].filter(Boolean).join(' ')}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

export default Input
