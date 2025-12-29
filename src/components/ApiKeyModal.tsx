import { useState } from 'react';
import { useBillStore } from '../stores/billStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (key: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, onSubmit }: ApiKeyModalProps) {
  const language = useBillStore((state) => state.voucherConfig.language);
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
      setApiKey('');
      onClose();
    }
  };

  const texts = {
    de: {
      title: 'Stability AI API Key',
      description:
        'Um die AI-Bildverbesserung zu nutzen, benötigst du einen Stability AI API Key. Du kannst ihn auf platform.stability.ai erhalten.',
      placeholder: 'sk-...',
      submit: 'Speichern',
      cancel: 'Abbrechen',
      hint: 'Der Key wird lokal in deinem Browser gespeichert.',
    },
    en: {
      title: 'Stability AI API Key',
      description:
        'To use AI image enhancement, you need a Stability AI API key. You can get one at platform.stability.ai.',
      placeholder: 'sk-...',
      submit: 'Save',
      cancel: 'Cancel',
      hint: 'The key is stored locally in your browser.',
    },
  };

  const txt = texts[language];

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{txt.title}</h3>
        <p className="py-4 text-sm opacity-80">{txt.description}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <input
              type="password"
              placeholder={txt.placeholder}
              className="input input-bordered w-full"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoFocus
            />
            <label className="label">
              <span className="label-text-alt">{txt.hint}</span>
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {txt.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!apiKey.trim()}>
              {txt.submit}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
