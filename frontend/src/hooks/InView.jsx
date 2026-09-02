import useInView from './useInView.js';

export function InView({ children, className = '', as: Tag = 'div' }) {
  const [ref, visible] = useInView();
  return (
    <Tag ref={ref} className={`${visible ? 'in-view-visible' : 'in-view-hidden'} ${className}`}>
      {children}
    </Tag>
  );
}

export default InView;
