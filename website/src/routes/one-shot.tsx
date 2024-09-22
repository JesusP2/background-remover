// import { useAction } from '@solidjs/router';
// import { createSignal } from 'solid-js';
import { ulid } from 'ulidx';
import { DropZone } from '~/components/dropzone';
import { useBirefnet } from '~/hooks/use-birefnet';
// import { removeBackgroundAction } from '~/lib/actions/background-removal';
import { downscaleImage } from '~/lib/utils/image';

export default function Page() {
  const { worker, modelStatus } = useBirefnet();
  // const removeBackground = useAction(removeBackgroundAction)
  return (
    <>
      {modelStatus()}
      <DropZone
        onFileChange={async (file) => {
          const id = ulid();
          const downscaledImage = await downscaleImage(file, 3840);
          const reader = new FileReader();
          reader.readAsDataURL(downscaledImage);
          reader.onload = (e) => {
            if (!worker()) return;
            worker()?.postMessage({
              type: 'remove_background',
              data: e.target?.result as string,
            });
          };
        }}
      />
    </>
  );
}

// export default function Page() {
//   const { worker, modelStatus } = useBirefnet();
//   const removeBackground = useAction(removeBackgroundAction);
//   return (
//     <>
//       {modelStatus()}
//       <DropZone
//         onFileChange={async (file) => {
//           const downscaledImage = await downscaleImage(file, 3840);
//           const mask = await removeBackground(downscaledImage);
//           console.log(mask)
//         }}
//       />
//     </>
//   );
// }
