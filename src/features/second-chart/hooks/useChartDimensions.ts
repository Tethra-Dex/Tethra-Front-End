import { useState, useEffect, RefObject } from 'react';
import { ChartDimensions } from '../types/chartTypes';

export const useChartDimensions = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const [dimensions, setDimensions] = useState<ChartDimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const parent = canvasRef.current.parentElement;
        setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const interval = setInterval(updateDimensions, 1000);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearInterval(interval);
    };
  }, [canvasRef]);

  return dimensions;
};
