"""Derive a quiet bed and short interaction ripple from the credited Kerala recording.
python3 tools/prepare-interactive-water.py work/audio/lapping-source.wav work/audio
"""
import array, math, sys, wave
from pathlib import Path
with wave.open(sys.argv[1],'rb') as f:
    rate,channels=f.getframerate(),f.getnchannels()
    assert f.getsampwidth()==2
    raw=array.array('h',f.readframes(f.getnframes()))
if sys.byteorder!='little':raw.byteswap()
mono=[sum(raw[i:i+channels])/channels/32768 for i in range(0,len(raw),channels)]
def save(name,values,target,ceiling):
    rms=math.sqrt(sum(x*x for x in values)/len(values));gain=target/rms
    values=[ceiling*math.tanh(x*gain/ceiling) for x in values]
    output=array.array('h',(round(x*32767) for x in values))
    if sys.byteorder!='little':output.byteswap()
    with wave.open(str(Path(sys.argv[2])/name),'wb') as f:
        f.setparams((1,2,rate,0,'NONE','not compressed'));f.writeframes(output.tobytes())
# Smooth out the sharper surface slaps; keep a low, soft water texture.
filtered=[];low=0;alpha=1-math.exp(-2*math.pi*750/rate)
for v in mono:
    low+=alpha*(v-low);filtered.append(low)
body=filtered[12*rate:25*rate];seam=rate
bed=body[seam:-seam]+[body[-seam+i]*(1-i/seam)+body[i]*(i/seam) for i in range(seam)]
save('water-bed.wav',bed,.035,.08)
# One small lap, gently enveloped, for controls and boat movement.
length=int(rate*.85);touch=mono[16*rate:16*rate+length]
touch=[v*min(1,i/(rate*.045),(length-i)/(rate*.32)) for i,v in enumerate(touch)]
save('water-touch.wav',touch,.09,.24)
