import { A, action, useAction, useSubmission } from '@solidjs/router';
import { DropZone } from '~/components/dropzone';
import { Image1 } from '~/components/img-1';
import { Image2 } from '~/components/img-2';
import { Image3 } from '~/components/img-3';
import { Image4 } from '~/components/img-4';
import { Image5 } from '~/components/img-5';
import { Navbar } from '~/components/nav';
import { PerfectArrow } from '~/components/perfect-arrow';
import { UploadingFileDialog } from '~/components/uploading-file-dialog';
import { uploadImage } from '~/lib/actions/init-image-process';

const uploadImageAction = action(uploadImage);
export default function Index() {
  const uploadImage = useAction(uploadImageAction);
  const uploadImageState = useSubmission(uploadImageAction);
  return (
    <div>
      <Navbar route="/" />
      <main class="grid place-items-center gap-y-10 mt-10 px-4 max-w-7xl mx-auto">
        <h1 class="font-gabarito lg:text-6xl md:text-5xl sm:text-4xl text-3xl font-semibold z-10">
          Background Removal App
        </h1>
        <div class="w-[153px] group z-10">
          <A href="/" class="relative bg-red-100">
            <div class="border-2 border-black bg-white rounded-lg w-36 h-12" />
            <div class="absolute top-[6px] left-[9px] bg-black rounded-lg w-36 h-12 text-white grid place-items-center font-gabarito text-lg group-hover:left-[6px] group-hover:top-[9px] duration-100">
              Get Started
            </div>
          </A>
        </div>
        <img src="/collage.png" alt="collage" class="relative sm:top-[-100px]" />
        <DropZone
          onFileChange={(file) => uploadImage(file)}
        />
        <UploadingFileDialog open={uploadImageState.pending} />
      </main>
    </div>
  );
}
