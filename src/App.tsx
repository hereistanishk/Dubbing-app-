import React, { useState, useRef } from 'react';
import { translateToHindi, synthesizeSpeech, translateAudioToHindi, translateVideoToHindi } from './services/geminiService';
import { Mic, Languages, Play, Loader2, RefreshCw, FileText, Download, UploadCloud, FileAudio, FileVideo } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const VOICES = [
  { id: 'Kore', name: 'Kore (Calm, Neutral)' },
  { id: 'Zephyr', name: 'Zephyr (Deep, Authoritative)' },
  { id: 'Fenrir', name: 'Fenrir (Gruff, Serious)' },
  { id: 'Charon', name: 'Charon (Smooth, Narrative)' },
  { id: 'Puck', name: 'Puck (Bright, Engaging)' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'audio' | 'video'>('text');

  // Text-to-Dub states
  const [englishText, setEnglishText] = useState('');
  const [hindiText, setHindiText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Charon');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Audio-to-Transcript states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioHindiText, setAudioHindiText] = useState('');

  // Video-to-Transcript states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isVideoTranscribing, setIsVideoTranscribing] = useState(false);
  const [videoHindiText, setVideoHindiText] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTranslate = async () => {
    if (!englishText.trim()) return;
    setIsTranslating(true);
    try {
      const translation = await translateToHindi(englishText);
      setHindiText(translation);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Failed to translate text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDub = async (textToDub: string) => {
    if (!textToDub.trim()) return;
    setIsSynthesizing(true);
    setAudioUrl(null);
    try {
      const base64Audio = await synthesizeSpeech(textToDub, selectedVoice);
      if (base64Audio) {
        // Decode base64 audio into a playable Blob URL
        const audioDataUrl = createWavFileFromBase64(base64Audio, 24000);
        setAudioUrl(audioDataUrl);
      } else {
        console.error('Empty base64 audio data returned!');
        alert('Empty audio data returned. Please try again.');
      }
    } catch (error: any) {
      console.error('Speech synthesis error:', error);
      alert('Failed to generate audio. ' + (error?.message || 'Please try again.'));
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleTranscribeAudio = async () => {
    if (!audioFile) return;
    setIsTranscribing(true);
    try {
      const base64 = await readFileAsBase64(audioFile);
      const mimeType = audioFile.type || 'audio/mpeg';
      const translation = await translateAudioToHindi(base64, mimeType);
      setAudioHindiText(translation);
    } catch (error: any) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. ' + (error?.message || 'Please try again.'));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTranscribeVideo = async () => {
    if (!videoFile) return;
    setIsVideoTranscribing(true);
    try {
      // Note: for 1hr videos, reading as Base64 in browser might fail due to memory limits.
      // A production app would upload to a backend and process via File API.
      const base64 = await readFileAsBase64(videoFile);
      const mimeType = videoFile.type || 'video/mp4';
      const translation = await translateVideoToHindi(base64, mimeType);
      setVideoHindiText(translation);
    } catch (error: any) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe video (Note: very large videos might run out of memory in browser). ' + (error?.message || 'Please try again.'));
    } finally {
      setIsVideoTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-10 max-w-7xl mx-auto font-sans bg-zinc-950 text-zinc-50 tracking-tight">
      {/* Header */}
      <header className="mb-10 pb-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex flex-center items-center justify-center text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
             <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">DocuDub</h1>
            <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest mt-1">Professional Voice Dubbing</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === 'text' ? 'bg-orange-500 text-white border-orange-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          Text to Dub
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === 'audio' ? 'bg-orange-500 text-white border-orange-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          Audio to Transcript
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === 'video' ? 'bg-orange-500 text-white border-orange-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
        >
          Video to Transcript
        </button>
      </div>

      {activeTab === 'text' && (
      <>
      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Source Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-400">Source: English Master</h2>
          </div>
          
          <div className="relative flex-1 min-h-[300px]">
            <textarea
              className="w-full h-full min-h-[300px] bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder:text-zinc-700 scrollbar-thin"
              placeholder="Paste the English documentary script here..."
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !englishText.trim()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
            >
              {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              Translate to Hindi
            </button>
          </div>
        </section>

        {/* Target Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-orange-500">Target: Hindi Dub</h2>
            </div>
            {hindiText && (
               <span className="text-xs font-mono text-zinc-500 px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800">
                 Editable Transcript
               </span>
            )}
          </div>
          
          <div className="relative flex-1 min-h-[300px]">
            <textarea
              className="w-full h-full min-h-[300px] bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder:text-zinc-700 scrollbar-thin"
              placeholder="Hindi translation will appear here..."
              value={hindiText}
              onChange={(e) => setHindiText(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 gap-4">
            <div className="flex-1 max-w-[200px]">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => handleDub(hindiText)}
              disabled={isSynthesizing || !hindiText.trim()}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)]"
            >
              {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Generate Voiceover
            </button>
          </div>
        </section>

      </main>

      </>
      )}

      {activeTab === 'audio' && (
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Audio Upload Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <FileAudio className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-400">Source: English Audio</h2>
          </div>
          
          <div className="relative flex-1 min-h-[300px] bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-6 text-zinc-300 flex flex-col items-center justify-center gap-4 transition-colors hover:bg-zinc-800/50 group">
            <input 
              type="file" 
              accept="audio/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setAudioFile(e.target.files[0]);
                }
              }}
            />
            {audioFile ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                  <FileAudio className="w-8 h-8" />
                </div>
                <p className="font-medium text-zinc-200">{audioFile.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-sm text-zinc-400 mt-4 group-hover:text-zinc-300 transition-colors">Click to replace file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-medium text-zinc-300">Upload English Audio</p>
                <p className="text-sm text-zinc-500 mt-1">MP3, WAV, M4A up to 500MB</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleTranscribeAudio}
              disabled={isTranscribing || !audioFile}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
            >
              {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              Transcribe to Hindi
            </button>
          </div>
        </section>

        {/* Target Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-orange-500">Target: Hindi Transcript</h2>
            </div>
          </div>
          
          <div className="relative flex-1 min-h-[300px]">
             <textarea
               className="w-full h-full min-h-[300px] bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder:text-zinc-700 scrollbar-thin"
               placeholder="Hindi transcript will appear here..."
               value={audioHindiText}
               readOnly={isTranscribing}
               onChange={(e) => setAudioHindiText(e.target.value)}
             />
          </div>

          <div className="flex items-center justify-between pt-2 gap-4">
            <div className="flex-1 max-w-[200px]">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => handleDub(audioHindiText)}
              disabled={isSynthesizing || !audioHindiText.trim() || isTranscribing}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)]"
            >
              {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Generate Voiceover
            </button>
          </div>
        </section>
      </main>
      )}

      {activeTab === 'video' && (
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Upload Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <FileVideo className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-400">Source: English Video</h2>
          </div>
          
          <div className="relative flex-1 min-h-[300px] bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-6 text-zinc-300 flex flex-col items-center justify-center gap-4 transition-colors hover:bg-zinc-800/50 group">
            <input 
              type="file" 
              accept="video/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setVideoFile(e.target.files[0]);
                }
              }}
            />
            {videoFile ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                  <FileVideo className="w-8 h-8" />
                </div>
                <p className="font-medium text-zinc-200">{videoFile.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-sm text-zinc-400 mt-4 group-hover:text-zinc-300 transition-colors">Click to replace file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center z-10 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-medium text-zinc-300">Upload English Video</p>
                <p className="text-sm text-zinc-500 mt-1">MP4, WebM up to 2GB</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleTranscribeVideo}
              disabled={isVideoTranscribing || !videoFile}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
            >
              {isVideoTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              Transcribe to Hindi
            </button>
          </div>
        </section>

        {/* Target Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-orange-500">Target: Hindi Transcript</h2>
            </div>
          </div>
          
          <div className="relative flex-1 min-h-[300px]">
             <textarea
               className="w-full h-full min-h-[300px] bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder:text-zinc-700 scrollbar-thin"
               placeholder="Hindi transcript will appear here..."
               value={videoHindiText}
               readOnly={isVideoTranscribing}
               onChange={(e) => setVideoHindiText(e.target.value)}
             />
          </div>

          <div className="flex items-center justify-between pt-2 gap-4">
            <div className="flex-1 max-w-[200px]">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => handleDub(videoHindiText)}
              disabled={isSynthesizing || !videoHindiText.trim() || isVideoTranscribing}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)]"
            >
              {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Generate Voiceover
            </button>
          </div>
        </section>
      </main>
      )}

      {/* Player Section */}
      <AnimatePresence>
        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
               <Mic className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 w-full">
               <h3 className="text-zinc-200 font-medium mb-1">Generated Output</h3>
               <p className="text-zinc-500 font-mono text-xs mb-4 uppercase tracking-widest">{selectedVoice} • Hindi Audio</p>
               <audio 
                 ref={audioRef} 
                 src={audioUrl} 
                 controls 
                 className="w-full outline-none [&::-webkit-media-controls-panel]:bg-zinc-800 [&::-webkit-media-controls-current-time-display]:text-zinc-300 [&::-webkit-media-controls-time-remaining-display]:text-zinc-300"
               />
            </div>
            <a
              href={audioUrl}
              download={`DocuDub_${selectedVoice}.wav`}
              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors shrink-0 max-md:w-full max-md:justify-center border border-zinc-700"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Helper function to create WAV file from raw PCM 16-bit
function createWavFileFromBase64(base64: string, sampleRate: number): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create WAV header
  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true); // chunk size
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true); // num channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, byteRate, true); // byte rate
  view.setUint16(32, blockAlign, true); // block align
  view.setUint16(34, bitsPerSample, true); // bits per sample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);

  // write PCM data
  const dataArray = new Uint8Array(buffer, 44);
  dataArray.set(bytes);

  // Create Blob and URL
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

