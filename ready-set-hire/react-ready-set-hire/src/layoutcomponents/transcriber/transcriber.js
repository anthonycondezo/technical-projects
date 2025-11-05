import { pipeline, env } from '@huggingface/transformers';

// Force remote model loading (avoid local misfetching)
env.allowLocalModels = false;
env.useBrowserCache = false;

let _asr = null;

export async function getTranscriber() {
  if (!_asr) {
    _asr = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny'
    );
  }
  return _asr;
}
