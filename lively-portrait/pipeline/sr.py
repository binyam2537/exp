import sys, numpy as np, torch
from PIL import Image
from transformers import AutoImageProcessor, Swin2SRForImageSuperResolution
name="caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr"
im = Image.open(sys.argv[1]).convert("RGB")
proc = AutoImageProcessor.from_pretrained(name); model = Swin2SRForImageSuperResolution.from_pretrained(name).eval()
with torch.no_grad():
    out = model(**proc(im, return_tensors="pt")).reconstruction[0]
a = (out.clamp(0,1).permute(1,2,0).numpy()*255).round().astype(np.uint8)
a = a[:im.size[1]*4, :im.size[0]*4]
Image.fromarray(a).save(sys.argv[2]); print(a.shape)
