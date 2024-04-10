import { action, useAction } from '@solidjs/router';
import { uploadImage } from '~/lib/actions/init-image-process';
import { DropZone } from '~/components/dropzone';

const uploadImageAction = action(uploadImage);
export default function Index() {
  const uploadImage = useAction(uploadImageAction);
  return (
    <div>
      <div class="grid place-items-center h-screen text-center">
        <div>
          <h1>Erased</h1>
          <p>Remoove background / Edit images</p>
        </div>
      </div>
      <DropZone onFileChange={(file) => uploadImage(file)} />
    </div>
  );
}
