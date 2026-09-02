/** Merge class names, filtering falsy values */
export default function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
