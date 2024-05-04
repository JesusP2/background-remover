import { A, action, useAction, useSubmission } from '@solidjs/router';
import { Show } from 'solid-js';
import { DropZone } from '~/components/dropzone';
import { Navbar } from '~/components/nav';
import { Progress, ProgressLabel } from '~/components/ui/progress';
import { Separator } from '~/components/ui/separator';
import { UploadingFileDialog } from '~/components/uploading-file-dialog';
import { uploadImage } from '~/lib/actions/init-image-process';

const uploadImageAction = action(uploadImage);
export default function Index() {
  const uploadImage = useAction(uploadImageAction);
  const uploadImageState = useSubmission(uploadImageAction);
  return (
    <div class="h-[3000px]">
      <Navbar route="/" />
      <main class="grid place-items-center gap-y-10 mt-20">
        <h1 class="font-gabarito text-6xl font-semibold">
          Background Removal App
        </h1>
        <div class="w-[153px] group">
          <A href="/" class="relative bg-red-100">
            <div class="border-2 border-black bg-white rounded-lg w-36 h-12" />
            <div class="absolute top-[6px] left-[9px] bg-black rounded-lg w-36 h-12 text-white grid place-items-center font-gabarito text-lg group-hover:left-[6px] group-hover:top-[9px] duration-100">
              Get Started
            </div>
          </A>
        </div>
      </main>
      <div class="relative ml-10 w-[300px] h-[300px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img src="/logo.png" alt="logo" width={300} />
        </div>
      </div>
      <div class="relative ml-10 w-[300px] h-[300px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/logo-with-background.gif"
            alt="logo"
            width={300}
            class="rounded-md"
          />
        </div>
      </div>
      <div class="relative ml-10 w-[600px] h-[262px]">
        <div class="bg-black rounded-lg w-full h-full" />
        <div class="border-2 border-black absolute top-[-3px] left-[3px] bg-white rounded-lg w-full h-full">
          <img
            src="/img-without-background-1.jpeg"
            alt="logo"
            width={600}
            class="rounded-md"
          />
        </div>
      </div>
      <p>Remoove background / Edit images</p>
      <DropZone onFileChange={(file) => uploadImage(file)} />
      <UploadingFileDialog open={uploadImageState.pending} />
    </div>
  );
}
