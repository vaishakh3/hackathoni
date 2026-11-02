"""Prepare a quiet, seamless loop from the credited CC0 recording.
Usage: python3 tools/prepare-water-audio.py input.wav output.wav
Decode/encode with afconvert (macOS), or an equivalent PCM/AAC converter.
"""
import array, math, sys, wave
from pathlib import Path
with wave.open(sys.argv[1], 'rb') as source:
    channels, rate = source.getnchannels(), source.getframerate()
    assert source.getsampwidth() == 2, 'Use 16-bit PCM input'
    samples = array.array('h', source.readframes(source.getnframes()))
if sys.byteorder != 'little': samples.byteswap()
# Omit the recorder's opening/closing handling; join the ends over two seconds.
start, end, seam = 4 * rate, min(52 * rate, len(samples) // channels), 2 * rate
body = array.array('h', samples[(start + seam) * channels:(end - seam) * channels])
for frame in range(seam):
    t = frame / seam
    # Constant-amplitude crossfade avoids an unnatural swell in the quiet bed.
    for channel in range(channels):
        tail = samples[(end - seam + frame) * channels + channel]
        head = samples[(start + frame) * channels + channel]
        body.append(round(tail * (1 - t) + head * t))
rms = math.sqrt(sum((v / 32768) ** 2 for v in body) / len(body))
peak = max(abs(v) for v in body) / 32768
gain = .05 / rms
# Gentle soft limiting keeps isolated splashes from dominating the quiet bed.
for i, value in enumerate(body): body[i] = round(.22 * math.tanh(value / 32768 * gain / .22) * 32767)
final_rms = math.sqrt(sum((v / 32768) ** 2 for v in body) / len(body))
final_peak = max(abs(v) for v in body) / 32768
if sys.byteorder != 'little': body.byteswap()
with wave.open(sys.argv[2], 'wb') as output:
    output.setnchannels(channels); output.setsampwidth(2); output.setframerate(rate)
    output.writeframes(body.tobytes())
print({'seconds': len(body) / channels / rate, 'rms_dbfs': round(20 * math.log10(final_rms), 2), 'peak_dbfs': round(20 * math.log10(final_peak), 2)})
