from gtts import gTTS

text = open('text.txt').read()
output = gTTS(text, lang='en')
output.save("example_audio.mp3")
