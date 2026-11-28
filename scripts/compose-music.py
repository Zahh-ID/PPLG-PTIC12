"""Compose original loopable synth music and result cues for Circuit Rescue."""
from pathlib import Path
import wave
import numpy as np

RATE=32000
OUT=Path('assets/circuit-rescue-v1/music-original')
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(81276)

def pitch(midi): return 440*2**((midi-69)/12)
def env(t,d,attack=.015,release=.12): return np.minimum(1,t/attack)*np.minimum(1,np.maximum(0,d-t)/release)
def stereo_mix(buf,start,waveform,pan=0):
    i=round(start*RATE); indices=(np.arange(len(waveform))+i)%len(buf)
    left=np.sqrt((1-pan)/2); right=np.sqrt((1+pan)/2)
    np.add.at(buf[:,0],indices,waveform*left);np.add.at(buf[:,1],indices,waveform*right)
def note(buf,start,midi,dur,vol,kind='bell',pan=0):
    t=np.arange(int(RATE*dur))/RATE; f=pitch(midi)
    if kind=='pad':
        phase=2*np.pi*f*t
        wave=(np.sin(phase)+.32*np.sin(phase*2+.12)+.10*np.sin(phase*3))/1.42
        wave*=env(t,dur,.24,.35)*(.88+.12*np.sin(2*np.pi*.35*t))
    elif kind=='bass':
        wave=(np.sin(2*np.pi*f*t)+.24*np.sin(4*np.pi*f*t)+.10*np.sin(6*np.pi*f*t))*env(t,dur,.008,.11)*np.exp(-t*1.5)
    else:
        wave=(np.sin(2*np.pi*f*t)+.34*np.sin(2*np.pi*f*2*t)+.12*np.sin(2*np.pi*f*3*t))*env(t,dur,.008,.16)*np.exp(-t*(2.2 if kind=='bell' else .9))
    stereo_mix(buf,start,vol*wave,pan)
    if kind=='bell':
        stereo_mix(buf,start+.23,vol*.20*wave,-pan)

def drum(buf,start,kind,vol):
    d={'kick':.30,'snare':.19,'hat':.075}[kind];t=np.arange(int(RATE*d))/RATE
    if kind=='kick':
        phase=2*np.pi*(48*t+38*.035*(1-np.exp(-t/.035)))
        wave=np.sin(phase)*np.exp(-t*19)
    elif kind=='snare':wave=(rng.normal(0,1,len(t))*.55+np.sin(2*np.pi*180*t)*.25)*np.exp(-t*24)
    else:
        noise=rng.normal(0,1,len(t));wave=np.concatenate(([0],np.diff(noise)))*.32*np.exp(-t*85)
    stereo_mix(buf,start,vol*wave,0 if kind=='kick' else -.12 if kind=='snare' else .22)

def save(name,buf):
    # Loop boundaries already wrap tail contributions; apply only peak limiting.
    peak=np.max(np.abs(buf));buf=buf*(.80/max(peak,.001));out=np.int16(np.clip(buf,-1,1)*32767)
    with wave.open(str(OUT/name),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(out.tobytes())
    print(name,round(len(buf)/RATE,2),'s, peak',round(float(peak),3))

# D minor, B-flat major, F major, C major: a hopeful science-fiction theme.
chords=[[50,53,57],[46,50,53],[53,57,60],[48,52,55]]
bass=[38,34,41,36]
melodies=[[69,72,74,77,74,72,69,65],[70,74,77,74,72,69,65,69],[69,72,77,81,77,72,69,72],[67,72,76,79,76,72,67,64]]

def soundtrack(menu):
    bpm=100 if menu else 120;beat=60/bpm;bars=16;bar=4*beat
    buf=np.zeros((round(bars*bar*RATE),2),dtype=np.float64)
    for b in range(bars):
        chord=chords[b%4];start=b*bar
        for n,midi in enumerate(chord):note(buf,start,midi,bar*.99,.065 if menu else .038,'pad',[-.45,0,.45][n])
        note(buf,start,bass[b%4],bar*.96,.11 if menu else .13,'bass',0)
        if not menu:note(buf,start+2*beat,bass[b%4]+12,beat*.75,.07,'bass',0)
        for step in range(8):
            if menu and step%2:continue
            midi=melodies[b%4][step]
            if b>=8 and step in (3,7):midi+=12
            note(buf,start+step*beat/2,midi,beat*(.85 if menu else .53),.055 if menu else .065,'bell',-.28 if step%2==0 else .28)
        if not menu:
            for step in range(8):
                if step in (0,4,6):drum(buf,start+step*beat/2,'kick',.16)
                if step in (2,6):drum(buf,start+step*beat/2,'snare',.065)
                drum(buf,start+step*beat/2,'hat',.024 if step%2 else .034)
    save('menu.wav' if menu else 'gameplay.wav',buf)

def cue(winner):
    buf=np.zeros((RATE*(6 if winner else 5),2),dtype=np.float64)
    if winner:
        for i,n in enumerate([74,77,81,86]):note(buf,i*.26,n,1.5,.13,'bell',(-.3 if i%2 else .3))
        for n in [50,57,62,65]:note(buf,.95,n,3.5,.08,'pad',0)
    else:
        for i,n in enumerate([74,69,65,62]):note(buf,i*.35,n,1.8,.11,'soft',(-.2 if i%2 else .2))
        for n in [38,45,50,53]:note(buf,.9,n,2.8,.07,'pad',0)
    # One-shot cues end in silence and never wrap into the start.
    fade=np.minimum(1,np.maximum(0,(len(buf)/RATE-np.arange(len(buf))/RATE)/.5));buf*=fade[:,None]
    save('victory.wav' if winner else 'defeat.wav',buf)

soundtrack(True);soundtrack(False);cue(True);cue(False)
