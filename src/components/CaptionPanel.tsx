import { useState } from 'react';

interface Props {
  getFullResBlob: () => Promise<Blob>;
  workerUrl: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip the data: prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function CaptionPanel({ getFullResBlob, workerUrl }: Props) {
  const [captions, setCaptions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    setCaptions(null);
    try {
      const blob = await getFullResBlob();
      const imageBase64 = await blobToBase64(blob);
      const res = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong fetching captions.');
      } else {
        setCaptions(data.captions);
      }
    } catch {
      setError('Could not reach the caption service.');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, i: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Captions</h2>
      <p className="text-xs text-paper/40 mb-3 leading-relaxed">
        Unlike everything else here, this sends your photo to Google's Gemini to generate suggestions —
        it's the one feature that leaves your device.
      </p>
      <button
        onClick={handleSuggest}
        disabled={loading}
        className="w-full rounded-[10px] py-3 px-4 font-bold text-sm border-[1.5px] border-mint text-mint hover:bg-mint/10 disabled:opacity-50 disabled:cursor-wait"
      >
        {loading ? 'Thinking of captions…' : 'Suggest captions'}
      </button>

      {error && <p className="text-xs text-orange mt-2.5">{error}</p>}

      {captions && (
        <div className="flex flex-col gap-2 mt-3">
          {captions.map((c, i) => (
            <button
              key={i}
              onClick={() => copy(c, i)}
              className="text-left text-sm bg-navy border border-white/10 rounded-lg px-3 py-2.5 hover:border-mint/50 transition-colors"
            >
              {c}
              <span className="block text-[11px] text-mint mt-1">
                {copiedIndex === i ? 'Copied!' : 'Tap to copy'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
