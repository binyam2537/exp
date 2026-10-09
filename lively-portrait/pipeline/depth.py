import sys, numpy as np, torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation
src, out, name = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGB")
proc = AutoImageProcessor.from_pretrained(name)
model = AutoModelForDepthEstimation.from_pretrained(name).eval()
with torch.no_grad():
    inp = proc(images=im, return_tensors="pt")
    pred = model(**inp).predicted_depth
d = torch.nn.functional.interpolate(pred[None], size=im.size[::-1], mode="bicubic", align_corners=False)[0,0].numpy()
d = (d - d.min()) / (d.max() - d.min())
np.save(out + ".npy", d)
Image.fromarray((d*255).astype(np.uint8)).save(out + ".png")
print("ok", d.shape)
