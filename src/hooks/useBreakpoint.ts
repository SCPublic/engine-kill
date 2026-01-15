import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg';

// Mobile-first breakpoints in logical pixels ("points")
// - sm: small phones (<= 389)
// - md: modern phones (390–429)
// - lg: large phones / small tablets (>= 430)
export function useBreakpoint(): { bp: Breakpoint; width: number; isSm: boolean; isMd: boolean; isLg: boolean } {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const bp: Breakpoint = width >= 430 ? 'lg' : width >= 390 ? 'md' : 'sm';
    return {
      bp,
      width,
      isSm: bp === 'sm',
      isMd: bp === 'md',
      isLg: bp === 'lg',
    };
  }, [width]);
}



