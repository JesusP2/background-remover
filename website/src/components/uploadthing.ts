import {
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/solid';

import type { OurFileRouter } from '~/server/uploadthing';

// URL is only needed for server side rendering, or when your router
// is deployed on a different path than `/api/uploadthing`
const url = `http://localhost:${process.env.PORT ?? 3000}`;

export const Uploader = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
