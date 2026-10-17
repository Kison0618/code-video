import numpy as np, wave
from scipy import signal
import os
S = os.environ.get("WORK", "work/") + "audio/"  # 16 kHz 单声道 wav：v1..v7.wav、BGM.wav
def load(n):
    w=wave.open(f"{S}{n}.wav"); a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
    f,t,Z=signal.stft(a,16000,nperseg=2048,noverlap=2048-320)
    m=np.abs(Z)[(f>60)&(f<4000)]; fr=f[(f>60)&(f<4000)]; pc=(np.round(12*np.log2(fr/440))%12).astype(int)
    C=np.stack([m[pc==k].sum(0) for k in range(12)]); return C/(np.linalg.norm(C,axis=0)+1e-9)
V=load("v7"); B=load("BGM")
for s in np.arange(0,160,4):
    A=V[:,int(s*50):int((s+4)*50)]
    if A.shape[1]<200: break
    sc=[(A*B[:,o:o+200]).sum()/200 for o in range(0,B.shape[1]-200,2)]
    i=int(np.argmax(sc)); print(f"video {s:5.0f}s -> BGM {i*2/50:6.1f}s  sim {sc[i]:.2f}")
