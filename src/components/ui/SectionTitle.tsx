import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  editorial?: boolean;
  align?: 'left' | 'center';
  action?: {
    label: string;
    href: string;
  };
}

export default function SectionTitle({
  title,
  subtitle,
  editorial = false,
  align = 'left',
  action,
}: SectionTitleProps) {
  return (
    <div className={`${styles.wrapper} ${align === 'center' ? styles.center : ''}`}>
      <div>
        <h2 className={`${styles.title} ${editorial ? 'font-editorial' : ''}`}>
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && (
        <a href={action.href} className={styles.action}>
          {action.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}
