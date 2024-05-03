import { createDropzone } from '@solid-primitives/upload';
import { AiOutlinePicture } from 'solid-icons/ai';
import { BsCloudDownload, BsFolder } from 'solid-icons/bs';
import { cn } from '~/lib/utils';

export function DropZone(props: {
  onFileChange: (file: File) => void;
  class?: string;
}) {
  const { setRef: dropzoneRef } = createDropzone({
    onDrop: (files) => {
      if (!files.length) return;
      props.onFileChange(files[0].file);
    },
  });

  return (
    <label
      ref={dropzoneRef}
      class={cn(
        'grid place-items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer border-gray-200 hover:border-gray-400 text-zinc-400 hover:text-zinc-500 mb-10 w-full',
        props.class,
      )}
    >
      <div class="flex gap-x-1">
        <AiOutlinePicture size={40} />
        <BsCloudDownload size={40} />
        <BsFolder size={40} />
      </div>
      Click or Drag image here
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
