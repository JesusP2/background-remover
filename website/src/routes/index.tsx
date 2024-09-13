import { DropZone } from '~/components/dropzone';
import { Navbar } from '~/components/nav';
import {
  Dialog,
  DialogContentWithoutClose,
  DialogTrigger,
} from '~/components/ui/dialog';
import { useNavigate } from "@solidjs/router";
import initialFileSignal from '~/lib/stores/initial-file';
import { ulid } from 'ulidx';

export default function Page() {
  const [_, setInitialFile] = initialFileSignal;
  const navigate = useNavigate()
  return (
    <div>
      <Navbar route="/" />
      <main class="grid place-items-center gap-y-10 mt-10 px-4 max-w-7xl mx-auto">
        <h1 class="font-gabarito lg:text-6xl md:text-5xl sm:text-4xl text-3xl font-semibold z-10">
          Background Removal App
        </h1>
        <div class="group z-10 w-[153px]">
          <Dialog>
            <DialogTrigger
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              as={(props: any) => (
                <button class="relative h-12" {...props}>
                  <div class="border-2 border-black bg-white rounded-lg w-36 h-12 relative">
                    <div class="bg-black w-36 h-12 relative top-[-0.7rem] rounded-lg text-white grid place-items-center font-gabarito text-lg group-hover:top-[-0.4rem] group-hover:left-[0.2rem] left-[0.5rem] duration-100">
                      Get Started
                    </div>
                  </div>
                </button>
              )}
            />
            <DialogContentWithoutClose>
              <DropZone
                onFileChange={async (file) => {
                  const id = ulid();
                  setInitialFile(file);
                  navigate(`/canvas/grabcut/${id}`)
                }}
              />
            </DialogContentWithoutClose>
          </Dialog>
        </div>
        <img
          src="/collage.png"
          alt="collage"
          class="relative sm:top-[-130px]"
        />
      </main>
    </div>
  );
}
