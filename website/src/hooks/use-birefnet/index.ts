import { type Setter, createSignal, onMount } from 'solid-js';

function setupWorker({
  setModelStatus,
}: {
  setModelStatus: Setter<string | null>;
}) {
  const worker = new Worker('/birefnet.js', {
    type: 'module',
  });
  worker.addEventListener('message', (e) => {
    const { type, data } = e.data;
    if (type === 'ready') {
      setModelStatus('model-downloaded');
    }
    if (type !== 'remove_background_result') return;
    if (data === 'start') {
      setModelStatus('removing-background');
    }
    if ('mask' in data) {
      setModelStatus('background-removed');
      const { mask } = data;
    }
  });
  return {
    worker,
  };
}
export function useBirefnet() {
  const [worker, setWorker] = createSignal<null | Worker>(null);
  const [modelStatus, setModelStatus] = createSignal<null | string>(null);
  onMount(() => {
    if (!worker()) {
      const { worker } = setupWorker({
        setModelStatus,
      });
      setWorker(worker);
    }
  });
  return {
    worker,
    modelStatus,
  };
}
