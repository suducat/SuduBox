"""Build-time only: Python standard library, no Excel/runtime dependencies."""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
DEST = Path(__file__).resolve().parents[1] / 'src/data/study-rooms.json'


def coordinate(ref):
    col, row = re.fullmatch(r'([A-Z]+)(\d+)', ref).groups()
    n = 0
    for c in col:
        n = n * 26 + ord(c) - 64
    return n, int(row)


def extract(path):
    with zipfile.ZipFile(path) as book:
        strings = [''.join(si.itertext()) for si in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        sheets = ET.fromstring(book.read('xl/workbook.xml')).find('s:sheets', NS)
        rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))}
        def read(sheet):
            rid = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            root = ET.fromstring(book.read('xl/' + rels[rid].lstrip('/').removeprefix('xl/')))
            cells = {}
            for c in root.findall('.//s:sheetData/s:row/s:c', NS):
                v = c.find('s:v', NS)
                value = v.text if v is not None else ''
                if c.get('t') == 's':
                    value = strings[int(value)]
                elif c.get('t') == 'inlineStr':
                    value = ''.join(c.find('s:is', NS).itertext())
                # A formula without a cached result is not a confirmed blank.
                if c.find('s:f', NS) is not None and not value:
                    raise ValueError('Unresolved formula: ' + c.get('r'))
                cells[coordinate(c.get('r'))] = value
            merges = [c.get('ref') for c in root.findall('.//s:mergeCell', NS)]
            for area in merges:
                (x1, y1), (x2, y2) = map(coordinate, area.split(':'))
                for x in range(x1, x2 + 1):
                    for y in range(y1, y2 + 1):
                        cells[x, y] = cells.get((x1, y1), '')
            return cells, merges
        s2, _ = read(next(s for s in sheets if s.get('name') == 'S2'))
        room_sheet = next(s for s in sheets if s.get('name').startswith('自习室表'))
        cells, merges = read(room_sheet)
        assert '空白' in cells[1, 1]
        labels = ['1', '2', '3', '4', '5', 'Lunch', '6', '7', '8', '9']
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        rows = sorted(y for (x, y), v in cells.items() if x == 1 and re.fullmatch(r'\d{4}', v))
        assert rows == list(range(4, 21)), 'Review changed room range'
        # Fail rather than silently ignore a new row/column in a future workbook.
        assert not any(v and (x > 51 or y > 20) for (x, y), v in cells.items())
        periods = {}
        for (x, y), value in s2.items():
            if x != 1 or not value.startswith('Period '):
                continue
            num = re.search(r'Period (\d+)', value)[1]
            times = re.findall(r'(\d{1,2}:\d{2})-(\d{1,2}:\d{2})', value)
            normalized = [[a.zfill(5), b.zfill(5)] for a, b in times]
            if num in periods:
                assert periods[num] == normalized, 'Conflicting S2 times'
            periods[num] = normalized
        assert set(periods) == set('123456789')
        assert len(periods['1']) == 2 and '(Monday)' in s2[1, 4]
        rooms = [cells[1, y] for y in rows]
        days = {}
        for day in range(1, 6):
            first = 2 + (day - 1) * 10
            assert cells[first, 2] == day_names[day - 1]
            assert [cells[first + i, 3] for i in range(10)] == labels
            slots = []
            for i, label in enumerate(labels):
                inferred = label == 'Lunch'
                if inferred:
                    start, end = periods['5'][0][1], periods['6'][0][0]
                else:
                    start, end = periods[label][0 if day == 1 or label != '1' else 1]
                slots.append({'id': label, 'start': start, 'end': end, 'inferred': inferred,
                              'available': [cells.get((first + i, y), '') == '' for y in rows]})
            days[str(day)] = slots
        return {
            'version': '2026-10-08', 'sourceFile': path.name,
            'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'sourceSheets': ['S2', room_sheet.get('name')],
            'rooms': rooms, 'days': days,
            'notes': [
                'S2 仅标注 Lunch，未写明其起止时间；查询将第5节结束至第6节开始（12:10–14:10）作为 Lunch 区间，此区间依据课时边界采用，并非学校明确公布的午休作息。',
                '课间仅按相邻课时边界识别，原表未单独列出课间活动安排；首节前与第9节后不提供安排数据。',
                '原表没有确认楼层信息，按教室编号展示，不推断楼层。',
            ],
            'audit': {'roomCount': len(rooms), 'slotCountPerDay': 10, 'cellCount': len(rooms) * 50,
                      'availablePerDay': {day: [sum(s['available']) for s in slots] for day, slots in days.items()},
                      'mergedRanges': merges},
        }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = extract(args.workbook)
    if args.check:
        assert json.loads(DEST.read_text()) == result, 'JSON differs from source workbook'
        print('PASS: all 850 cells, merged regions, room IDs and S2 times match')
    else:
        DEST.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps(result['audit'], ensure_ascii=False))
