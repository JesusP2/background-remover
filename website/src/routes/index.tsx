import { UploadFile, createDropzone } from '@solid-primitives/upload';
import { action, useAction, useSubmission } from '@solidjs/router';
import { BsCloudDownload, BsFolder } from 'solid-icons/bs';
import { AiOutlinePicture } from 'solid-icons/ai';
import { uploadFile } from '~/lib/r2';

function DropZone(props: { onFileChange: (file: File) => void }) {
  const { setRef: dropzoneRef } = createDropzone({
    onDrop: (files) => {
      if (!files.length) return;
      props.onFileChange(files[0].file);
    },
  });

  return (
    <label
      ref={dropzoneRef}
      class="grid place-items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer border-gray-200 text-zinc-400 mb-10"
    >
      <div class="flex gap-x-1">
        <AiOutlinePicture size={40} />
        <BsCloudDownload size={40} />
        <BsFolder size={40} />
      </div>
      Drag image here
      <input
        onChange={(event) => {
          if (!event.target.files?.length) return;
          props.onFileChange(event.target.files[0]);
        }}
        class="hidden"
        type="file"
        name="file"
      />
    </label>
  );
}

const uploadImageAction = action(async (file: File) => {
  'use server';
  const url = await uploadFile(file, file.name);
  return { url };
});

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
      <img src="https://erased.13e14d558cce799d0040255703bae354.r2.cloudflarestorage.com/mask%20%289%29.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8998abc8cba410ef72731b8554c88f75%2F20240407%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20240407T095327Z&X-Amz-Expires=3600&X-Amz-Signature=83f9cf2395ae60b8f433521f9f0b5798e2f59d76405a1f33838ad5e276b271a3&X-Amz-SignedHeaders=host&x-id=GetObject" />
    </div>
  );
}
