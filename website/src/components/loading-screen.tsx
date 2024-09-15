import anime from 'animejs';
import { For, createSignal, onCleanup, onMount } from 'solid-js';

function randomHexColor() {
  const randomColor = Math.floor(Math.random() * 16777215);
  const hexColor = randomColor.toString(16).padStart(6, '0');
  return `#${hexColor}`;
}
export function LoadingScreen() {
  const [state, setState] = createSignal({
    columns: 0,
    rows: 0,
    total: 1,
  });
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const handleStagger = (e: any) => {
    const { columns, rows } = state();
    const el = e.target.id;
    anime({
      targets: '.loading-screen-grid-item',
      backgroundColor: randomHexColor(),
      delay: anime.stagger(50, { grid: [columns, rows], from: el }),
    });
  };

  const getGridSize = () => {
    const columns = Math.floor(document.body.clientWidth / 50);
    const rows = Math.floor(document.body.clientHeight / 50);

    setState({ columns, rows, total: rows * columns });
    anime({
      targets: '.loading-screen-grid-item',
      backgroundColor: '#fff',
      duration: 0,
      easing: 'linear',
    });
  };

  onMount(() => {
    getGridSize();
    // window.addEventListener('resize', getGridSize);
  });

  // onCleanup(() => window.removeEventListener('resize', getGridSize));
  return (
    <div id="loading-screen-grid">
      <For each={Array(state().total)}>
        {(_, i) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            class="loading-screen-grid-item"
            id={i().toString()}
            onClick={(e) => handleStagger(e)}
          />
        )}
      </For>
    </div>
  );
}
