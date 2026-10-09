import mediapipe as mp, numpy as np, json, sys
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
opts = vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path='work/face_landmarker.task'), num_faces=1)
det = vision.FaceLandmarker.create_from_options(opts)
img = mp.Image.create_from_file(sys.argv[1])
r = det.detect(img)
print(len(r.face_landmarks))
if r.face_landmarks:
    L = r.face_landmarks[0]
    pts = {k:[L[i].x, L[i].y] for k,i in dict(leT=159,leB=145,leO=33,leI=133, reT=386,reB=374,reO=263,reI=362, nose=1, chin=152, mouthL=61, mouthR=291, browL=105, browR=334, forehead=10).items()}
    print(json.dumps(pts, indent=0))
    json.dump(pts, open('work/landmarks.json','w'))
