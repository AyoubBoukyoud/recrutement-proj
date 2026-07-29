#!/usr/bin/env python3
"""
Transcribes an audio file with faster-whisper (CTranslate2-based — no
PyTorch dependency, chosen to keep the install small) and prints JSON
{transcript, words, duration} to stdout.

Usage: transcribe.py <audio_path>

If faster-whisper isn't installed, exits 1 with a JSON error on stdout so
the calling PHP service can degrade gracefully instead of crashing the job
(same pattern as TesseractOcrService for the OCR pipeline).
"""
import json
import sys

def fail(message):
    print(json.dumps({"error": message}))
    sys.exit(1)

if len(sys.argv) < 2:
    fail("missing audio path argument")

audio_path = sys.argv[1]

try:
    from faster_whisper import WhisperModel
except ImportError:
    fail("faster-whisper is not installed")

try:
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_path, beam_size=5)
    text_segments = list(segments)
    transcript = " ".join(s.text.strip() for s in text_segments)
    word_count = len(transcript.split())

    print(json.dumps({
        "transcript": transcript,
        "words": word_count,
        "duration": info.duration,
    }))
except Exception as e:
    fail(str(e))
