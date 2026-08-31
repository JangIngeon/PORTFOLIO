const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const theme = process.argv[2];                 // burgundy | orange
const html  = path.resolve(__dirname, `poster_${theme}.html`);
const outDir = path.resolve(__dirname, 'assets', theme);
fs.mkdirSync(outDir, { recursive: true });

// 포스터에서 뽑아올 텍스트 필드
const TEXT_FIELDS = ['wm1','wm2','railText','railInitial','ribbon1','ribbon2','eyebrow',
  'term','week','mainTitle','mainEn','speakerLabel','speakerName','speakerAffil',
  'titleLabel','talkTitle','dateLabel','dateValue','timeLabel','timeValue','timeNote',
  'venueLabel','venueValue','venueEn','kw1','kw2','kw3','kw4','deptKo','deptEn'];

// 선(line)으로 재현할 요소
const LINES = ['.eyebrow .erule','.rule','.rule.short','.foot-rule','.rail-vline'];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  const p = await b.newPage({ viewport:{width:1000,height:1300}, deviceScaleFactor:4 });
  await p.goto('file://' + html);
  await p.waitForTimeout(1200);
  await p.evaluate((theme) => {
    var r = document.documentElement.style;
    if (theme === 'burgundy') {
      r.setProperty('--c-primary','#8A1B2D');
      r.setProperty('--c-accent','#7A1228');
      r.setProperty('--c-deep','#2E0710');
      r.setProperty('--c-gold','#B08A5B');
      r.setProperty('--c-mute','#6B5A54');
      r.setProperty('--c-line','#DCD3C6');
    }
    document.documentElement.style.setProperty('--zoom', 1);
    document.body.classList.remove('guides');
    document.querySelector('.panel').style.display = 'none';
    document.querySelector('.toolbar').style.display = 'none';
    document.querySelector('.stage').style.padding = '0';
  }, theme);
  await p.waitForTimeout(400);

  const data = await p.evaluate(({TEXT_FIELDS, LINES}) => {
    const poster = document.getElementById('poster');
    const P = poster.getBoundingClientRect();
    const rel = r => ({ x:r.left-P.left, y:r.top-P.top, w:r.width, h:r.height });
    const px = v => parseFloat(v) || 0;

    const texts = TEXT_FIELDS.map(f => {
      const el = poster.querySelector('[data-f="'+f+'"]');
      const cs = getComputedStyle(el);
      const ls = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
      let lh = cs.lineHeight === 'normal' ? px(cs.fontSize)*1.2 : px(cs.lineHeight);
      return {
        f, text: el.textContent,
        box: rel(el.getBoundingClientRect()),
        fontSize: px(cs.fontSize), weight: parseInt(cs.fontWeight,10) || 400,
        color: cs.color, letterSpacing: ls, lineHeight: lh,
        align: cs.textAlign === 'start' ? 'left' : cs.textAlign,
        vertical: cs.writingMode && cs.writingMode.indexOf('vertical') === 0,
        stroke: cs.webkitTextStrokeWidth ? px(cs.webkitTextStrokeWidth) : 0,
        strokeColor: cs.webkitTextStrokeColor
      };
    });

    const lines = LINES.map(sel => {
      const el = poster.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { sel, box: rel(el.getBoundingClientRect()),
               color: cs.backgroundColor, opacity: parseFloat(cs.opacity) };
    }).filter(Boolean);

    // 점선 구분선
    const dashes = Array.prototype.map.call(poster.querySelectorAll('.idash'), el => {
      const cs = getComputedStyle(el);
      return { box: rel(el.getBoundingClientRect()), color: cs.borderTopColor };
    });
    // 키워드 사이 세로 구분선
    const kdivs = Array.prototype.map.call(poster.querySelectorAll('.kdiv'), el => {
      const cs = getComputedStyle(el);
      return { box: rel(el.getBoundingClientRect()), color: cs.backgroundColor };
    });
    // 정보행 라벨 좌측 세로선
    const ilabs = Array.prototype.map.call(poster.querySelectorAll('.ilab'), el => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      return { box: rel(new DOMRect(r.left, r.top, 1, r.height)), color: cs.borderLeftColor };
    });

    const parts = {};
    [['rail','.rail'],['ribbon','.ribbon'],['molecules','.deco .molecules'],
     ['glass','.deco .glass'],['contour','.deco .contour'],['logo','#logoMark'],
     ['icon1','.info .irow:nth-child(1) .icircle'],
     ['icon2','.info .irow:nth-child(3) .icircle'],
     ['icon3','.info .irow:nth-child(5) .icircle']].forEach(([k,sel]) => {
       const el = poster.querySelector(sel);
       if (el) parts[k] = rel(el.getBoundingClientRect());
     });

    return { poster:{ w:P.width, h:P.height }, texts, lines, dashes, kdivs, ilabs, parts,
             paper: getComputedStyle(poster).backgroundColor };
  }, {TEXT_FIELDS, LINES});

  // ---- 장식 그래픽을 투명 PNG로 추출 ----
  // 대상 요소만 보이게 격리한 뒤 캡처해야 위에 얹힌 본문 텍스트가 섞이지 않는다.
  await p.addStyleTag({ content: `
    html,body,.app,.stage,.frame{background:transparent !important;background-image:none !important}
    .frame{filter:none !important}
    .poster{background:transparent !important}
  `});
  const isolate = await p.evaluateHandle(() => {
    const st = document.createElement('style');
    document.head.appendChild(st);
    return st;
  });

  const SHOTS = [
    ['rail',      '.rail'],
    ['ribbon',    '.ribbon'],
    ['molecules', '.deco .molecules'],
    ['glass',     '.deco .glass'],
    ['contour',   '.deco .contour'],
    ['logo',      '#logoMark'],
    ['icon1',     '.info .irow:nth-child(1) .icircle'],
    ['icon2',     '.info .irow:nth-child(3) .icircle'],
    ['icon3',     '.info .irow:nth-child(5) .icircle']
  ];

  for (const [name, sel] of SHOTS) {
    await p.evaluate(({ st, sel }) => {
      st.textContent =
        '#poster, #poster * { visibility: hidden !important; }' +
        // '#poster *' 보다 명시도가 높아야 대상이 다시 보인다
        '#poster ' + sel + ', #poster ' + sel + ' * { visibility: visible !important; }' +
        // 좌측 바 이미지에는 글자가 들어가면 안 된다 (텍스트는 PPT 텍스트 상자로 별도 배치)
        '.brandmark .wm1,.brandmark .wm2,.rail-vtext{color:transparent !important}' +
        '.rail-cbe{color:transparent !important;-webkit-text-stroke-color:transparent !important}' +
        '.rail-vline{background:transparent !important}' +
        '.ribbon .r1,.ribbon .r2{color:transparent !important}';
    }, { st: isolate, sel });
    await p.waitForTimeout(60);
    const el = await p.$(sel);
    if (!el) { console.log('missing', sel); continue; }
    await el.screenshot({ path: path.join(outDir, name + '.png'), omitBackground: true, timeout: 15000 });
  }
  await p.evaluate(st => { st.textContent = ''; }, isolate);

  fs.writeFileSync(path.join(outDir, 'layout.json'), JSON.stringify(data, null, 1));
  console.log(theme, '→ texts:', data.texts.length, 'lines:', data.lines.length,
              'dashes:', data.dashes.length, 'poster:', data.poster);
  await b.close();
})();
