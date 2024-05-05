import {
  Dialog,
  DialogContentWithoutClose,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Separator } from './ui/separator';

export function UploadingFileDialog(props: { open: boolean}) {
  return (
    <Dialog open={props.open}>
      <DialogContentWithoutClose class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Loading</DialogTitle>
        </DialogHeader>
        <Separator class="mb-4 mt-2" />
        <div class="loading-bar animate">
          <span class="w-[80%]" />
        </div>
      </DialogContentWithoutClose>
    </Dialog>
  );
}
