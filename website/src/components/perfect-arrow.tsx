import { getArrow } from 'perfect-arrows';

export function PerfectArrow(props: {
  class?: string;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}) {
  const { p1, p2 } = props;


  const arrow = getArrow(props.p1.x, p1.y, p2.x, p2.y, {
    padEnd: 1,
  });

  const [sx, sy, cx, cy, ex, ey, ae, as, ec] = arrow;

  const endAngleAsDegrees = ae * (180 / Math.PI);

  return (
    <svg
      viewBox="0 0 150 150"
      class={props.class}
      stroke="#000"
      fill="#000"
      stroke-width={3}
    >
      <title>idk</title>
      <path d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`} fill="none" />
      <polygon
        points="0,-6 12,0, 0,6"
        transform={`translate(${ex},${ey}) rotate(${endAngleAsDegrees})`}
      />
    </svg>
  );
}
