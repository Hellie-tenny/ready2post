import { useRef, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
}

export function Dropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={`rounded-2xl border-[1.5px] border-dashed bg-navy-soft px-5 py-12 text-center cursor-pointer transition-colors
        ${dragging ? 'border-mint bg-mint/5' : 'border-mint/35 hover:border-mint hover:bg-mint/5'}`}
    >
      <div className="font-semibold text-lg mb-1.5">Drop a photo here, or click to choose one</div>
      <div className="text-sm text-paper/50">JPEG or PNG · processed locally, never uploaded</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
    </div>
  );
}
