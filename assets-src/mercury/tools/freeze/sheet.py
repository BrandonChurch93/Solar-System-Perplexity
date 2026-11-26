import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; folder=sys.argv[2]; cols=int(sys.argv[3]); w=int(sys.argv[4]); ks=[int(k) for k in sys.argv[5:]]
h=w*9//16; rows=(len(ks)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*h))
for i,k in enumerate(ks):
    im=Image.open('%s/k00%d.png'%(folder,k)).convert('RGB').resize((w,h),Image.LANCZOS)
    ImageDraw.Draw(im).text((6,4),'%d  (%g)'%(k,k/2),fill=(255,255,0))
    S.paste(im,((i%cols)*w,(i//cols)*h))
S.save(out,quality=88)
