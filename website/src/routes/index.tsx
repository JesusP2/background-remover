import { toaster } from '@kobalte/core';
import { useAction, useSubmission } from '@solidjs/router';
import { Match, Show, Switch } from 'solid-js';
import { DropZone } from '~/components/dropzone';
import { LoadingScreen } from '~/components/loading-screen';
import { Navbar } from '~/components/nav';
import {
  Dialog,
  DialogContentWithoutClose,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Toast,
  ToastContent,
  ToastProgress,
  ToastTitle,
} from '~/components/ui/toast';
import { uploadImageAction } from '~/lib/actions/init-image-process';

export default function Index() {
  const uploadImage = useAction(uploadImageAction);
  const uploadImageState = useSubmission(uploadImageAction);
  return (
    <Switch>
      <Match when={uploadImageState.pending}>
        <LoadingScreen />
      </Match>
      <Match when={!uploadImageState.pending}>
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
                      const payload = await uploadImage(file);
                      if (payload instanceof Error) {
                        toaster.show((props) => (
                          <Toast toastId={props.toastId}>
                            <ToastContent>
                              <ToastTitle>{payload.message}</ToastTitle>
                            </ToastContent>
                            <ToastProgress />
                          </Toast>
                        ));
                      }
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
      </Match>
    </Switch>
  );
}
