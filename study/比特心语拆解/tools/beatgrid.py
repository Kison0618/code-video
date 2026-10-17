import sys, numpy as np, subprocess, json
from scipy import signal
from scipy.ndimage import median_filter
SR=22050
a=np.frombuffer(subprocess.run(["ffmpeg","-nostdin","-v","error","-i",(sys.argv[1] if len(sys.argv) > 1 else "reference-videos/BGM.m4a"),"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32)
HOP=128;f,t,Z=signal.stft(a,SR,nperseg=2048,noverlap=2048-HOP);m=np.log1p(np.abs(Z)*10);fa=SR/HOP
fl=np.concatenate([[0],np.maximum(0,np.diff(m,axis=1)).sum(0)]);fl=fl-median_filter(fl,int(fa))
oe=fl.clip(0)
# tempo search 80-160 by comb on onset envelope
best=None
for bpm in np.arange(80,160,0.05):
    per=60/bpm*fa
    for ph in np.linspace(0,per,40,endpoint=False):
        idx=(ph+np.arange(0,len(oe)/per-1)*per).astype(int)
        sc=oe[idx].mean()
        if best is None or sc>best[0]: best=(sc,bpm,ph/fa)
sc,bpm,ph=best; print("bpm",round(bpm,2),"phase",round(ph,3),"beat",round(60/bpm,4),"bar",round(240/bpm,3))
# energy per bar (4 beats) to find sections
bar=240/bpm; rms=np.sqrt(np.convolve(a**2,np.ones(SR//10)/(SR//10),'same'))
hi=np.abs(Z)[f>6000].sum(0)
for k in range(int((len(a)/SR-ph)/bar)+1):
    t0=ph+k*bar; s=int(t0*SR); e=int((t0+bar)*SR)
    h=hi[int(t0*fa):int((t0+bar)*fa)].mean() if t0*fa<len(hi) else 0
    print(f"bar {k:3d} t={t0:6.2f}  rms={20*np.log10(rms[s:e].mean()+1e-9):6.1f}dB  hi={h:7.2f}")
