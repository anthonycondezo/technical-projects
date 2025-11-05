import { useRef, useState, useEffect } from 'react';
import { Button, Container, Card, Alert } from 'react-bootstrap'
import { getTranscriber } from './transcriber/transcriber';
import { read_audio } from '@huggingface/transformers'; // Utility to decode audio Blob → Float32Array

/**
 * 
 * @param {{}} param0 
 * @returns 
 */
function Transcriber({ resetTrigger, saveToCallback }) {
  // Recording + UI state
  const [pause, setPause] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pauseAttempted, setPauseAttempted] = useState(false);
  const [recordingComplete, setRecordingCompleted] = useState(false);

  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState('');

  // References for MediaRecorder and audio chunks
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Reset state when resetTrigger changes
  useEffect(() => {
    setPause(false);
    setRecording(false);
    setPauseAttempted(false);
    setRecordingCompleted(false);
    setTranscript('');
    setBusy(false);

    // Also clear out any old media recorder / chunks
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, [resetTrigger]);

  /** Handler for toggling recording state.
   * On start: request mic access, begin recording.
   * On stop: finalize recording, process audio blob.
   */
  async function toggleRecord() {
    if (recording) {
      // Stop recording if already recording
      mediaRecorderRef.current?.stop();
      setRecording(false);
      setRecordingCompleted(true);
      return;
    }

    // Reset state for a fresh transcript
    setTranscript('');
    // Ask user for mic access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    // Collect audio data as it becomes available
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    // On stop: assemble blob, decode it, and transcribe
    recorder.onstop = async () => {
      try {
        // Create a blob from the recorded chunks
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        /** --- Audio Decoding Step ---
         * Whisper expects raw waveform data at 16kHz sample rate in Float32Array format.
         * `read_audio(...)` handles:
         * - Decoding via Web Audio APIs
         * - Resampling to 16000 Hz
         * - Converting to mono (if stereo)
         */
        const url = URL.createObjectURL(blob);
        const audioData = await read_audio(url, 16000);
        URL.revokeObjectURL(url);

        setBusy(true);

        // Lazy-load the Whisper Tiny model and run transcription
        const transcriber = await getTranscriber();
        const output = await transcriber(audioData);
        const transcriptText = output.text || '';
        setTranscript(transcriptText);
        // Saving transript to saveReponseTo
        saveToCallback(prev => [...prev, transcriptText]);

       
      } catch (err) {
        console.error('Transcription failed:', err);
        setTranscript('Error: ' + (err.message || err));
      } finally {
        // Clean up mic stream and loading state
        stream.getTracks().forEach((t) => t.stop());
        setBusy(false);
      }
    };

    // Start recording
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }

  async function togglePause() {
    setPauseAttempted(true);
    if (!mediaRecorderRef.current) return;

    if (pause) {
      mediaRecorderRef.current.resume();
      setPause(false);
    } else {
      mediaRecorderRef.current.pause();
      setPause(true);
    }
  }

  return (
    <>
        <Container className="my-2" style={{ maxWidth: 720 }}>
        {/* Record / Stop Button */}
        <Button variant={recording ? 'danger' : 'success'} className='me-2' disabled={busy || recordingComplete} onClick={toggleRecord}>
            {recording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        {/* Pause Button */}
        <Button variant={pause ? 'info' : 'warning'} className='me-2' disabled={recordingComplete} onClick={togglePause}>
            {pause ? 'Resume Recording' : 'Pause Recording' }
        </Button>
        {/* Transcribing Loading Text */}
        {busy && <div className="mt-3 text-muted">Transcribing…</div>}

        {/* Transcript Display */}
        {transcript && (
          <Card className="mt-3">
            <Card.Body
              style={{
                maxHeight: "300px",   // adjust to whatever fits your layout
                overflowY: "auto",
              }}
            >
              <h2 className="h6">Transcript</h2>
              <pre style={{ whiteSpace: "pre-wrap" }} className="mb-0">
                {transcript}
              </pre>
            </Card.Body>
          </Card>
        )}

        {/* Alert user that recording is paused */}
        {pause && recording && (
          <Alert variant='info' className='my-2'>
            Recording is currently paused, resume to continue.
          </Alert>
        )}
        {/* Alert user that they cannot pause the recording without starting recording */}
       {pauseAttempted && !pause && !recording && !recordingComplete && (
          <Alert variant='warning' className='my-2'>
            Cannot pause. Recording has not started.
          </Alert>
        )}
        </Container>
    </>
  );
}

export default Transcriber;