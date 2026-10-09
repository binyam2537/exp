import sys, torch, numpy as np, scipy.io.wavfile as wf
from transformers import VitsModel, AutoTokenizer
name, text, out = sys.argv[1], sys.argv[2], sys.argv[3]
tok = AutoTokenizer.from_pretrained(name); m = VitsModel.from_pretrained(name).eval()
print('uroman', getattr(tok, 'is_uroman', None))
torch.manual_seed(int(sys.argv[4]) if len(sys.argv) > 4 else 0)
m.speaking_rate = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
m.noise_scale = 0.6
with torch.no_grad():
    w = m(**tok(text, return_tensors="pt")).waveform[0].numpy()
w = w / np.abs(w).max() * 0.9
wf.write(out, m.config.sampling_rate, (w * 32767).astype(np.int16)); print(out, len(w)/m.config.sampling_rate, 's')
