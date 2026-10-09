import sys
from transformers import pipeline
p = pipeline("automatic-speech-recognition", model="openai/whisper-small")
for f in sys.argv[1:]:
    print(f, '->', p(f, generate_kwargs={"task": "transcribe"})['text'])
