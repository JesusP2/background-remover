import type { DialogTriggerProps } from '@kobalte/core/dialog';
import {
  Dialog,
  DialogContent,
  DialogContentWithoutClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Separator } from './ui/separator';
import { Button } from './ui/button';

export function UploadingFileDialog(props: { open: boolean }) {
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
