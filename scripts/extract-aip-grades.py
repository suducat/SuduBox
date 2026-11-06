"""Read-only extraction of S1/S3. No student roster is imported."""
import zipfile,xml.etree.ElementTree as E,json,re,sys
from pathlib import Path
n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
base=Path('src/data/aip-presets.json');old=json.loads(base.read_text());result=[{**p,'grade':'高二','selectionRevision':2} for p in old if p['id'].startswith('2')]
for filename,grade,version,sheet in [(sys.argv[1],'高一','2026-10-28','S1'),(sys.argv[2],'高三','2026-10-08','S3')]:
 z=zipfile.ZipFile(filename);strings=[''.join(t.text or '' for t in x.findall('.//m:t',n)) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',n)]
 cells={}
 for c in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:c',n):
  v=c.findtext('m:v','',n);v=strings[int(v)] if c.attrib.get('t')=='s' else v
  if v:cells[c.attrib['r']]=v
 groups=[(int(re.search(r'\d+',k)[0]),v.strip()) for k,v in cells.items() if re.fullmatch(r'A\d+',k) and re.fullmatch(r'[13]\d\d[A-B]?',v.strip())];groups.sort()
 daycols=['B C D E F G H','I J K L M N','O P Q R S T U','V W X Y Z','AA AB AC AD AE AF']
 for gi,(r0,group) in enumerate(groups):
  end=groups[gi+1][0] if gi+1<len(groups) else max(int(re.search(r'\d+',k)[0]) for k in cells)+1;slots=[]
  for row in range(r0,end):
   label=cells.get('A'+str(row),'');m=re.search(r'Period\s*(\d+)',label)
   if not m:continue
   period=int(m[1]);times=[('08:00','08:40'),('09:00','09:40'),('09:50','10:30'),('10:40','11:20'),('11:30','12:10'),('14:10','14:50'),('15:00','15:40'),('15:50','16:30'),('16:40','17:20')][period-1]
   for day,cols in enumerate(daycols,1):
    entries={c+str(row):cells[c+str(row)] for c in cols.split() if c+str(row) in cells};vals=list(entries.values());raw='\n'.join(vals)
    if raw.strip() in ('','/'):continue
    name=raw.strip();room='';teacher='';options=[]
    if len(vals)>=2 and re.match(r'^(\d{4}|阶梯教室)',vals[0]):room,name=vals[:2];teacher='\n'.join(vals[2:])
    else:
     chunks=[v.strip().strip(',') for v in re.split(r'/|\n',vals[0] if vals else '') if v.strip()];parsed=[]
     for chunk in chunks:
      m=re.match(r'^(.+?)-(\d{4}|多功能报告厅)(?:-(.+))?$',chunk)
      if m:parsed.append([m[1].strip(),m[2],(m[3] or '').strip()])
     if len(parsed)>1:
      # Some S1 candidates put teachers in an adjacent cell, in matching order.
      teachers=[s.strip() for s in re.split(r'[,，\n]', '\n'.join(vals[1:])) if s.strip()]
      for i,p in enumerate(parsed):
       if not p[2] and i<len(teachers):p[2]=teachers[i]
      options=[f'{a} ({c})【{b}】' for a,b,c in parsed];name='待选择课程'
     elif len(parsed)==1:name,room,teacher=parsed[0]
     elif '阶梯教室' in vals[-1] and len(vals)>1:name=vals[0];room=vals[-1];teacher='\n'.join(vals[1:-1])
     elif len(vals)==2 and '多功能报告厅' in vals[1]:name,room=vals
    slots.append(dict(cell=f'{cols.split()[0]}{row}:{cols.split()[-1]}{row}',cells=entries,day=day,start='08:10' if period==1 and day==1 else times[0],end='08:50' if period==1 and day==1 else times[1],raw=raw,name=name,room=room,teacher=teacher,options=options))
  result.append(dict(id=group,version=version,sheet=sheet,grade=grade,selectionRevision=2,sourceFile=Path(filename).name,slots=slots))
base.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print([(p['id'],len(p['slots'])) for p in result])

for grade,sheet in [("高一","s1"),("高二","s2"),("高三","s3")]:
 Path(f"src/data/aip-{sheet}.json").write_text(json.dumps([p for p in result if p["grade"]==grade],ensure_ascii=False,indent=2)+"\n")
