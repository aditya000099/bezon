import styles from './Button.module.css'

/**
 * Reusable Button component.
 * @param {{ variant?: 'primary'|'secondary'|'danger', size?: 'sm'|'md'|'lg', children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
function Button({ variant = 'primary', size = 'md', children, className = '', ...rest }) {
  const cls = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

export default Button
