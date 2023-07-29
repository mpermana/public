const bumpMap = []

for (var i=0;i<128;i++) {
    const value = 128-(128-i)*(128-i)/128    
    bumpMap.push(value)
}
for (var i=128;i<256;i++) {    
    bumpMap.push(i)
}