import zipfile,xml.etree.ElementTree as E,json,re,sys
from pathlib import Path
z=zipfile.ZipFile(sys.argv[1]);n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
strings=[''.join(t.text or '' for t in x.findall('.//m:t',n)) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',n)]
cells={}
for c in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:c',n):
 v=c.findtext('m:v','',n);v=strings[int(v)] if c.attrib.get('t')=='s' else v
 if v:cells[c.attrib['r']]=v
cols=['B C D E F G H','I J K L M N','O P Q R S T U','V W X Y Z','AA AB AC AD AE AF']
result=[]
for group,start,lunch,end in [('211',4,9,13),('212',18,23,27),('212B',31,36,40),('213',44,49,52),('214',56,61,64)]:
 slots=[]
 for period,row in enumerate(r for r in range(start,end+1) if r!=lunch):
  for day,cs in enumerate(cols,1):
   entries={c+str(row):cells[c+str(row)] for c in cs.split() if c+str(row) in cells}
   vals=list(entries.values());raw='\n'.join(vals)
   if raw.strip() in ('','/'):continue
   options=[];name='';room='';teacher=''
   if len(vals)>=2 and re.match(r'^(\d{4}|阶梯教室)',vals[0]):
    room,name=vals[:2];teacher='\n'.join(vals[2:])
    if ',' in name and ',' in room:
     names=[v.strip() for v in name.split(',')];rooms=[v.strip() for v in room.split(',')];teachers=[v.strip() for v in teacher.split(',')]
     options=[f'{v} ({teachers[i] if i<len(teachers) else ""})【{rooms[i] if i<len(rooms) else ""}】' for i,v in enumerate(names)];name='待选择课程';room='';teacher=''
   else:
    chunks=[s.strip() for s in re.split(r'/|\n',raw) if s.strip()]
    if raw.strip().startswith('ASSEMBLY/'):name=raw.strip()
    else:
     for chunk in chunks:
      m=re.match(r'^(.+?)-(\d{4}|多功能报告厅)(?:-(.+))?$',chunk)
      if m:options.append(f'{m[1].strip()} ({(m[3] or "").strip()})【{m[2]}】')
     if len(options)>1:name='待选择课程'
     elif len(options)==1:
      m=re.match(r'^(.+) \((.*)\)【(.*)】$',options[0]);name,teacher,room=m.groups();options=[]
     else:name=raw.strip()
   times=[('08:10' if day==1 else '08:00','08:50' if day==1 else '08:40'),('09:00','09:40'),('09:50','10:30'),('10:40','11:20'),('11:30','12:10'),('14:10','14:50'),('15:00','15:40'),('15:50','16:30'),('16:40','17:20')][period]
   slots.append(dict(cell=f'{cs.split()[0]}{row}:{cs.split()[-1]}{row}',cells=entries,day=day,start=times[0],end=times[1],raw=raw,name=name,room=room,teacher=teacher,options=options))
 result.append(dict(id=group,version='2026-10-08',sheet='S2',sourceFile=Path(sys.argv[1]).name,slots=slots))
Path('src/data/aip-presets.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print([(p['id'],len(p['slots'])) for p in result])
