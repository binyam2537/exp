import numpy as np, cv2
from PIL import Image
H0 = 414
d = np.load('work/depth_large.npy')[:H0].astype(np.float32)
d = (d - d.min())/(d.max()-d.min())
d = cv2.resize(d, (1280, round(1280*H0/640)), interpolation=cv2.INTER_CUBIC)
d = cv2.GaussianBlur(d, (0,0), 5.0)
gx = cv2.Sobel(d, cv2.CV_32F, 1, 0, ksize=3)/8.0
gy = cv2.Sobel(d, cv2.CV_32F, 0, 1, ksize=3)/8.0
k = 0.24/(1.5464/1280)
nx, ny = -gx*k, gy*k
mag = np.sqrt(nx*nx+ny*ny)
c = 1.0/(1.0 + 0.6*mag)          # tame silhouette rims
nx, ny = nx*c, ny*c
n = np.stack([nx, ny, np.ones_like(nx)], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
img = ((n*0.5+0.5)*255).round().astype(np.uint8)
img = cv2.resize(img, (960, round(960*H0/640)), interpolation=cv2.INTER_AREA)
Image.fromarray(img).save('site/normal.png', optimize=True)
print(img.shape, float(mag.max()), float(np.percentile(mag,99)))
