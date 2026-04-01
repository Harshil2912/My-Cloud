import { UploadDropzone } from '../components/files/UploadDropzone';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="glass-card mb-5 p-5">
        <h1 className="text-xl font-semibold brand-neon-text-soft">Upload Files</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fast encrypted upload pipeline with queue control.</p>
      </div>
      <UploadDropzone onSuccess={() => navigate('/dashboard')} />
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Files are encrypted with AES-256-GCM before being written to disk. Maximum 5 GB per file.
      </p>
    </div>
  );
}
