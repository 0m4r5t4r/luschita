import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

export default function AnimatedNumber({ value, decimals = 0, className }) {
  const v = useAnimatedNumber(value);
  return <span className={className}>{v.toFixed(decimals)}</span>;
}
