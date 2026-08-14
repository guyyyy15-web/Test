/** Bordered panel -- the frame every piece of JRPG UI sits inside. */
export function Window({ title, children, flush = false, className = '', ...rest }) {
  const classes = ['window', flush ? 'window--flush' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {title ? <div className="window__title">{title}</div> : null}
      {children}
    </div>
  )
}

export default Window
