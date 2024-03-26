import { Uploader } from '~/components/uploadthing';

export default function Home() {
  return (
    <main>
      <Uploader
        endpoint="profileImage"
        onClientUploadComplete={(res) => {
          console.log('onClientUploadComplete', res);
          alert('Upload Completed');
        }}
      />
    </main>
  );
}
