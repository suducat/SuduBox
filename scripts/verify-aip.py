"""Read-only verification: python3 scripts/verify-aip.py /absolute/path/to/source.xlsx"""
import sys,zipfile,xml.etree.ElementTree as ET,json,posixpath
from pathlib import Path
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as book:
    workbook=ET.fromstring(book.read('xl/workbook.xml'))
    sheet=next(s for s in workbook.findall('m:sheets/m:sheet',ns) if s.attrib['name']=='Y11')
    rid=sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    rels=ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))
    target=next(r.attrib['Target'] for r in rels if r.attrib['Id']==rid)
    sheetpath=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
    strings=[''.join(t.text or '' for t in item.findall('.//m:t',ns)) for item in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('m:si',ns)]
    cells={}
    for c in ET.fromstring(book.read(sheetpath)).findall('.//m:c',ns):
        v=c.findtext('m:v','',ns)
        cells[c.attrib['r']]=strings[int(v)] if c.attrib.get('t')=='s' else v
    assert 'Senior 2 Summer Timetable starts from May 18th, 2026' in ' '.join(' '.join(cells.values()).split())
    presets=json.loads(Path('src/data/aip-presets.json').read_text())
    assert len(presets)==5
    for p in presets:
        assert p['sheet']=='Y11' and len(p['slots'])==40
        for s in p['slots']:
            assert cells[s['cell']]==s['raw'], f"原文不同: {p['id']} {s['cell']}"
            assert s['cell'][0]=='DEFGH'[s['day']-1]
    print('PASS: Y11 5份模板共200个单元格原文与星期逐格一致；原文件未修改')
