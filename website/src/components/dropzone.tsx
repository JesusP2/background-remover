import { createDropzone } from '@soorria/solid-dropzone';
import { BiSolidMagicWand } from 'solid-icons/bi';
import { FaRegularImage } from 'solid-icons/fa';

export function DropZone(props: {
  onFileChange: (file: File) => void;
  class?: string;
}) {
  const dropzone = createDropzone({
    onDrop: (files) => {
      props.onFileChange(files[0]);
    },
  });

  return (
    <>
      <div
        {...dropzone.getRootProps()}
        class={`block w-full p-8 border-2 border-dashed rounded-xl transition-colors duration-200 ease-in-out cursor-pointer
        ${
          dropzone.isDragActive
            ? 'border-blue-500'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...dropzone.getInputProps()} />
        <div class="flex flex-col items-center justify-center space-y-4">
        <div class="p-4 rounded-full bg-blue-50">
          {dropzone.isDragActive ? (
            <FaRegularImage class="w-8 h-8 text-blue-500" />
          ) : (
            <BiSolidMagicWand class="w-8 h-8 text-blue-500" />
          )}
        </div>
          <div class="text-center">
            <p class="text-lg font-medium text-gray-700">
              {dropzone.isDragActive
                ? 'Drop your image here'
                : 'Drag & drop your image here'}
            </p>
            <p class="text-sm text-gray-500 mt-2">or click to select a file</p>
          </div>
          <p class="text-xs text-gray-400 mt-2">Supports: JPG, PNG, WEBP</p>
        </div>
      </div>
    </>
  );
}
