import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react';
import { Game } from '../types';
import { registerRom, requestRomUploadUrl } from '../services/api';

interface AdminUploadProps {
  games: Game[];
  onBack: () => void;
}

type StatusState = {
  kind: 'idle' | 'working' | 'success' | 'error';
  message: string;
};

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function AdminUpload({ games, onBack }: AdminUploadProps) {
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id ? String(games[0].id) : '');
  const [file, setFile] = useState<File | null>(null);
  const [licenseType, setLicenseType] = useState('licensed');
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [sha256, setSha256] = useState('');
  const [status, setStatus] = useState<StatusState>({ kind: 'idle', message: 'Ready to upload a ROM to Filebase.' });
  const [progress, setProgress] = useState(0);

  const selectedGame = useMemo(
    () => games.find((game) => String(game.id) === selectedGameId) ?? null,
    [games, selectedGameId],
  );

  const handleUpload = async () => {
    if (!selectedGameId) {
      setStatus({ kind: 'error', message: 'Pick a game first.' });
      return;
    }

    if (!file) {
      setStatus({ kind: 'error', message: 'Choose a ROM file.' });
      return;
    }

    try {
      setStatus({ kind: 'working', message: 'Creating upload URL...' });
      setProgress(10);

      const uploadInfo = await requestRomUploadUrl({
        gameId: selectedGameId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        expiresInSeconds: 300,
      });

      setStatus({ kind: 'working', message: 'Uploading ROM to Filebase...' });
      setProgress(35);

      const uploadRes = await fetch(uploadInfo.uploadUrl, {
        method: 'PUT',
        headers: file.type ? { 'Content-Type': file.type } : {},
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Filebase upload failed.');
      }

      setStatus({ kind: 'working', message: 'Registering ROM metadata...' });
      setProgress(80);

      const romSha256 = sha256.trim() || (await computeSha256(file));

      await registerRom({
        gameId: selectedGameId,
        romStorageKey: uploadInfo.storageKey,
        romFilename: file.name,
        romSizeBytes: file.size,
        romSha256,
        licenseType,
        isDownloadable,
      });

      setProgress(100);
      setStatus({ kind: 'success', message: `Uploaded ${file.name} and linked it to ${selectedGame?.title ?? 'the selected game'}.` });
      setFile(null);
      setSha256('');
    } catch (error) {
      setProgress(0);
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Upload failed.' });
    }
  };

  return (
    <div className="space-y-6 pb-12 page-enter">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.35em] text-neon-cyan uppercase">Admin Upload</p>
          <h2 className="text-3xl font-black italic tracking-tighter mt-2">UPLOAD ROM TO FILEBASE</h2>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-neon-cyan/30 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-3xl border border-white/10 bg-black/50 p-6 space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">Select Game</label>
            <select
              value={selectedGameId}
              onChange={(event) => setSelectedGameId(event.target.value)}
              aria-label="Select game to upload ROM for"
              className="w-full rounded-xl bg-black/70 border border-white/10 px-4 py-3 text-white outline-none focus:border-neon-cyan/40"
            >
              {games.length === 0 ? (
                <option value="">No games available</option>
              ) : (
                games.map((game) => (
                  <option key={game.id} value={String(game.id)}>
                    {game.title} (ID {game.id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">License Type</span>
              <input
                value={licenseType}
                onChange={(event) => setLicenseType(event.target.value)}
                className="w-full rounded-xl bg-black/70 border border-white/10 px-4 py-3 text-white outline-none focus:border-neon-cyan/40"
                placeholder="licensed"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">SHA-256 Hash</span>
              <input
                value={sha256}
                onChange={(event) => setSha256(event.target.value)}
                className="w-full rounded-xl bg-black/70 border border-white/10 px-4 py-3 text-white outline-none focus:border-neon-cyan/40"
                placeholder="optional"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <input
              type="checkbox"
              checked={isDownloadable}
              onChange={(event) => setIsDownloadable(event.target.checked)}
              className="h-4 w-4 accent-neon-cyan"
            />
            <span className="text-sm text-white/80">Make this game downloadable</span>
          </label>

          <label className="block">
            <span className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-2">ROM File</span>
            <input
              type="file"
              accept=".zip,.nes,.sfc,.smc,.7z,.rar,.bin,.rom"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl bg-black/70 border border-white/10 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-neon-cyan file:px-4 file:py-2 file:font-black file:text-black"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpload}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-neon-cyan to-neon-magenta text-black font-black italic tracking-widest flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload to Filebase
            </button>
            <button
              onClick={() => {
                setFile(null);
                setSha256('');
                setProgress(0);
                setStatus({ kind: 'idle', message: 'Ready to upload a ROM to Filebase.' });
              }}
              className="px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div className="space-y-2">
            <progress className="download-progress w-full h-2" value={progress} max={100} />
            <p className="text-xs font-mono text-white/50">{status.message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-neon-cyan/20 bg-neon-cyan/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-neon-cyan" />
              <h3 className="font-black italic tracking-tighter">Upload Flow</h3>
            </div>
            <ol className="space-y-2 text-sm text-white/70 font-mono list-decimal list-inside">
              <li>Choose a game record.</li>
              <li>Upload the ROM file to Filebase with a signed URL.</li>
              <li>Save the storage key and metadata back to the database.</li>
            </ol>
          </div>

          <div className={`rounded-3xl border p-6 ${status.kind === 'error' ? 'border-red-400/30 bg-red-400/5' : status.kind === 'success' ? 'border-green-400/30 bg-green-400/5' : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-start gap-3">
              {status.kind === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1">Current Game</p>
                <h4 className="text-xl font-black italic tracking-tighter">{selectedGame?.title ?? 'No game selected'}</h4>
                <p className="text-sm text-white/60 mt-2">{selectedGame?.description ?? 'Pick a game from the catalog first.'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/50 p-6 space-y-3 text-sm text-white/70 font-mono">
            <p><span className="text-neon-cyan">Bucket:</span> Filebase S3 bucket for ROM storage.</p>
            <p><span className="text-neon-cyan">Endpoint:</span> use your Filebase S3 endpoint in the server env.</p>
            <p><span className="text-neon-cyan">RPC:</span> the Filebase RPC endpoint is separate and only needed if you later pin to IPFS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
