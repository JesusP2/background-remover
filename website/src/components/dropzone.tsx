import { createDropzone } from '@solid-primitives/upload';
import { BsCloudDownload, BsFolder } from 'solid-icons/bs';
import { AiOutlinePicture } from 'solid-icons/ai';

export function DropZone(props: { onFileChange: (file: File) => void }) {
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

