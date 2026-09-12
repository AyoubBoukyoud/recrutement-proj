#!/usr/bin/env python3
"""
Transcribes an audio file with faster-whisper (CTranslate2-based — no
PyTorch dependency, chosen to keep the install small) and prints JSON to
stdout for App\\Services\\LanguageAssessment\\WhisperTranscriber.

Usage: transcribe.py <audio_path> [--language de]

Word timestamps are on, which is what makes anything beyond word-counting
possible: each word comes back with the model's probability for it, and the
gaps between words are where the pauses are. The scoring itself stays in PHP
— this script only reports what the model saw.

Passing --language matters. Auto-detect on a short, accented clip regularly
guesses wrong, and a wrong language means a nonsense transcript scored as if
it were real speech. The assessment row always knows which language was
being tested, so there is no reason to make Whisper guess.

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

language = None
if "--language" in sys.argv:
    index = sys.argv.index("--language")
    if index + 1 < len(sys.argv):
        language = sys.argv[index + 1]

try:
    from faster_whisper import WhisperModel
except ImportError:
    fail("faster-whisper is not installed")

try:
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        language=language,
        word_timestamps=True,
    )

    text_segments = list(segments)
    transcript = " ".join(s.text.strip() for s in text_segments)

    words = []
    for segment in text_segments:
        for word in (segment.words or []):
            stripped = word.word.strip()
            if not stripped:
                continue
            words.append({
                "word": stripped,
                # How sure the model is it heard this word. Low values cluster
                # on mispronounced, mumbled or clipped speech.
                "probability": round(float(word.probability), 4),
                "start": round(float(word.start), 3),
                "end": round(float(word.end), 3),
            })

    print(json.dumps({
        "transcript": transcript,
        # Falls back to whitespace splitting when a build returns no word
        # timings, so the caller always gets a count.
        "words": len(words) or len(transcript.split()),
        "duration": info.duration,
        "language": info.language,
        "language_probability": round(float(info.language_probability), 4),
        "word_details": words,
    }))
except Exception as e:
    fail(str(e))
