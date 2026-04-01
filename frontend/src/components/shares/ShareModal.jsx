import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { sharesApi } from '../../api/sharesApi';
import { useToast } from '../ui/Toast';

export function ShareModal({ file, onClose, onCreated }) {
  const [recipient, setRecipient] = useState('');
  const [expiry, setExpiry]       = useState('');
  const [loading, setLoading]     = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async e => {
    e.preventDefault();
    if (!recipient.trim()) return;
    setLoading(true);
    try {
      const res = await sharesApi.create(file.id, recipient.trim(), expiry || null);
      addToast(`Shared with ${recipient}`, 'success');
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Share failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!file} onClose={onClose} title={`Share "${file?.original_name ?? ''}"`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Recipient username"
          placeholder="Enter username…"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          required
        />
        <Input
          label="Expires at (optional)"
          type="datetime-local"
          value={expiry}
          onChange={e => setExpiry(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Share</Button>
        </div>
      </form>
    </Modal>
  );
}
