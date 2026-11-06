import zipfile,xml.etree.ElementTree as E,json,sys
from pathlib import Path
n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
data=json.loads(Path('src/data/aip-presets.json').read_text())
for filename in sys.argv[1:]:
 z=zipfile.ZipFile(filename);strings=[''.join(t.text or '' for t in x.findall('.//m:t',n)) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',n)]
 cells={}
 for c in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:c',n):
  v=c.findtext('m:v','',n);cells[c.attrib['r']]=strings[int(v)] if c.attrib.get('t')=='s' else v
 count=0
 for p in data:
  if p['sourceFile']!=Path(filename).name:continue
  for slot in p['slots']:
   for key,value in slot['cells'].items():assert cells[key]==value,(p['id'],key)
   assert slot['raw']=='\n'.join(slot['cells'].values());count+=1
 assert count>0
 print(f'PASS: {Path(filename).name}: {count}个时段来源逐格一致')
