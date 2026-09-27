import * as React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value. @default 0 */
  value?: number;
  /** Maximum value. @default 100 */
  max?: number;
  /** Bar thickness in px. @default 8 */
  height?: number;
  /** Use the solid lime pop fill. @default false */
  pop?: boolean;
  /** Solid fill color override. */
  color?: string;
  /** Track color override. */
  trackColor?: string;
}

/** Horizontal progress / share bar. */
export function ProgressBar(props: ProgressBarProps): React.JSX.Element;
