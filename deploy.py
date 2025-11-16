from tqdm import tqdm
from squaremoonpy import google_cloud as gc
import glob

bucket = 'mybrandheritage.com'

files = ['index.html','style.css','script.js','background-animation.js','interactive.html']
files.extend(glob.glob('assets/*'))
files.extend(glob.glob('setup/*'))

for file in tqdm(files):
    print(gc.item_to_google_cloud(bucket, F"{file}", file,public=True))
