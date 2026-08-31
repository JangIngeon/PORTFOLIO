"""CBE 워터마크를 채움 없이 외곽선만 남도록 후처리한다 (원본의 속 빈 글자 재현)."""
import re, shutil, sys, zipfile, os

def patch(pptx):
    tmp = pptx + '.tmp'
    zin = zipfile.ZipFile(pptx)
    zout = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
    n = 0
    for item in zin.infolist():
        data = zin.read(item.filename)
        if re.match(r'ppt/slides/slide\d+\.xml$', item.filename):
            xml = data.decode('utf-8')
            # <a:ln ...>...</a:ln> 를 가진 런의 뒤따르는 solidFill 을 noFill 로 교체
            def fix(m):
                return m.group(1) + '<a:noFill/>'
            new, cnt = re.subn(
                r'(<a:ln w="\d+"><a:solidFill><a:srgbClr val="[0-9A-Fa-f]{6}"/></a:solidFill></a:ln>)'
                r'<a:solidFill><a:srgbClr val="[0-9A-Fa-f]{6}"/></a:solidFill>', fix, xml)
            n += cnt
            data = new.encode('utf-8')
        zout.writestr(item, data)
    zin.close(); zout.close()
    shutil.move(tmp, pptx)
    print(f'{os.path.basename(pptx)}: outline-only runs patched = {n}')

for f in sys.argv[1:]:
    patch(f)
