import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export const useResponsive = () => {
  const [width, setWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const handler = ({ window }: { window: any }) => setWidth(window.width);
    const subscription = Dimensions.addEventListener('change', handler);
    return () => subscription?.remove();
  }, []);

  return {
    width,
    isTablet: width >= BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.desktop,
    isPhone: width < BREAKPOINTS.tablet,
    columns: width >= BREAKPOINTS.desktop ? 3 : width >= BREAKPOINTS.tablet ? 2 : 1,
    cardWidth: width >= BREAKPOINTS.tablet ? (width - 48 - 32) / 2 : width - 48,
    maxContentWidth: width >= BREAKPOINTS.desktop ? 1200 : width >= BREAKPOINTS.tablet ? 800 : undefined,
  };
};
