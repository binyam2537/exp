import numpy as np, json, cv2
from PIL import Image, ImageFilter
H0 = 414  # rows above the museum caption
sr = Image.open('work/sr4.png').convert('RGB')
W4, H4 = sr.size
sr = sr.crop((0, 0, W4, H0*4))
# gentle local-contrast restore after SR smoothing
a = np.asarray(sr).astype(np.float32)
g = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2LAB)
clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8,8))
g[...,0] = clahe.apply(g[...,0])
a2 = cv2.cvtColor(g, cv2.COLOR_LAB2RGB).astype(np.float32)
out = (0.55*a2 + 0.45*a).clip(0,255).astype(np.uint8)
img = Image.fromarray(out).resize((1800, round(1800*H0/640)), Image.LANCZOS)
img.save('site/photo.jpg', quality=88, optimize=True, progressive=True)
d = np.load('work/depth_large.npy')[:H0]
d = cv2.bilateralFilter(d.astype(np.float32), 9, 0.08, 6)
d = cv2.GaussianBlur(d, (0,0), 1.6)
d = (d - d.min())/(d.max()-d.min())
dimg = Image.fromarray((d*255).astype(np.uint8)).resize((960, round(960*H0/640)), Image.BICUBIC)
dimg.save('site/depth.png', optimize=True)
print(img.size, dimg.size)
lm = json.load(open('work/landmarks.json'))
# landmarks were normalized to 640x441 -> renormalize to cropped height
lm = {k:[round(v[0],4), round(v[1]*441/H0,4)] for k,v in lm.items()}
print(json.dumps(lm))
