import * as React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface treatment. @default "card" */
  variant?: 'card' | 'elevated' | 'glass' | 'hero';
  /** Inner padding in px (or any CSS length). @default 20 */
  padding?: number | string;
  children?: React.ReactNode;
}

/** Rounded surface container — cards, solid panels, and the lime-topped hero card. */
export function Panel(props: PanelProps): React.JSX.Element;
