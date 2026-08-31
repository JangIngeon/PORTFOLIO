const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const theme = process.argv[2] || 'burgundy';
const outFile = process.argv[3] || `seminar-poster-${theme}.pptx`;
const dir = path.resolve(__dirname, 'assets', theme);
const L = JSON.parse(fs.readFileSync(path.join(dir, 'layout.json'), 'utf8'));

/* ---------- 단위 변환 ----------
   포스터는 CSS px(96dpi)로 조판되어 있고, 슬라이드는 A4 세로(8.2677" x 11.6929").  */
const PW = L.poster.w, PH = L.poster.h;
const SLIDE_W = 8.2677, SLIDE_H = 11.6929;
const K = SLIDE_W / PW;                 // px → inch
const inX = v => +(v * K).toFixed(4);
const pt  = v => +(v * 0.75).toFixed(2); // css px → pt

/* ---------- 색 처리 ---------- */
const FONT = 'Malgun Gothic';
// 좌측 바 위에 얹히는 반투명 색을 합성할 기준값 (rail.png 실측)
const RAIL_BG = theme === 'burgundy' ? [38,5,13] : [90,31,3];
const RAIL_MID = theme === 'burgundy' ? [115,17,38] : [236,105,18];
const PAPER = theme === 'burgundy' ? [250,246,239] : [253,248,242];

function parseColor(str){
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return { rgb:[0,0,0], a:1 };
  const p = m[1].split(',').map(s => parseFloat(s));
  return { rgb:[p[0],p[1],p[2]], a: p.length > 3 ? p[3] : 1 };
}
const hex = rgb => rgb.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('').toUpperCase();
function flatten(colorStr, backdrop){
  const { rgb, a } = parseColor(colorStr);
  if (a >= 0.999) return hex(rgb);
  return hex(rgb.map((v,i) => v*a + backdrop[i]*(1-a)));
}

/* ---------- 슬라이드 1(빈 템플릿) / 슬라이드 2(15주차 예시) 텍스트 ---------- */
const BLANK = {
  week:'00주차', speakerName:'연사 성함', speakerAffil:'소속 및 직위',
  talkTitle:'강연 제목을 입력해주세요', dateValue:'2026. 00. 00 (수)'
};
const SAMPLE = {
  week:'15주차', speakerName:'이의수 교수', speakerAffil:'동국대학교 화공생물공학과',
  talkTitle:'AI 시대의 화학생물공학 역할과 미래', dateValue:'2026. 12. 09 (수)'
};

// 줄바꿈을 막고 가로로 넉넉히 잡아줄 필드 (폰트 폭 차이로 디자인이 깨지지 않게)
const NOWRAP = new Set(['term','week','ribbon1','ribbon2','kw1','kw2','kw3','kw4',
  'dateLabel','timeLabel','venueLabel','wm1','wm2','railInitial','deptKo','mainTitle']);

const pres = new pptxgen();
pres.defineLayout({ name:'A4P', width:SLIDE_W, height:SLIDE_H });
pres.layout = 'A4P';
pres.title = '동국대학교 화공세미나 포스터';

function buildSlide(overrides, notes){
  const slide = pres.addSlide();
  slide.background = { color: hex(PAPER) };

  const img = (name, box, extra) => {
    const f = path.join(dir, name + '.png');
    if (!fs.existsSync(f)) return;
    slide.addImage(Object.assign({
      path: f, x: inX(box.x), y: inX(box.y), w: inX(box.w), h: inX(box.h)
    }, extra || {}));
  };
  const MIN_RULE = 1.4;   // px — 이보다 얇으면 뷰어에 따라 렌더링이 사라진다
  const rect = (box, color) => slide.addShape(pres.ShapeType.rect, {
    x: inX(box.x), y: inX(box.y),
    w: inX(Math.max(box.w, MIN_RULE)), h: inX(Math.max(box.h, MIN_RULE)),
    fill: { color }, line: { color, width: 0 }
  });

  // --- 1) 배경 그래픽 (텍스트보다 먼저 = 뒤쪽) ---
  img('rail', L.parts.rail);
  img('molecules', L.parts.molecules);
  img('glass', L.parts.glass);
  img('contour', L.parts.contour);
  img('ribbon', L.parts.ribbon);
  img('logo', L.parts.logo);
  img('icon1', L.parts.icon1);
  img('icon2', L.parts.icon2);
  img('icon3', L.parts.icon3);

  // --- 2) 괘선 ---
  L.lines.forEach(l => {
    const backdrop = l.sel === '.rail-vline' ? RAIL_MID : PAPER;
    rect(l.box, flatten(l.color, backdrop));
  });
  L.kdivs.forEach(k => rect(k.box, flatten(k.color, PAPER)));
  L.ilabs.forEach(k => rect(k.box, flatten(k.color, PAPER)));
  L.dashes.forEach(d => slide.addShape(pres.ShapeType.line, {
    x: inX(d.box.x), y: inX(d.box.y), w: inX(d.box.w), h: 0,
    line: { color: flatten(d.color, PAPER), width: 0.75, dashType: 'dash' }
  }));

  // --- 3) 텍스트 (전부 편집 가능한 텍스트 상자) ---
  // 길이가 바뀌는 필드는 아래쪽 여유 공간까지 상자를 넓히고 자동 축소를 켠다.
  // (HTML 은 흐름 배치라 알아서 밀리지만 슬라이드는 절대 좌표이기 때문)
  const GROW = { speakerName: 434.23, speakerAffil: 492.50, talkTitle: 618.00 };

  const pick = f => L.texts.filter(x => x.f === f)[0];
  const valueOf = t => Object.prototype.hasOwnProperty.call(overrides, t.f) ? overrides[t.f] : t.text;
  const CONTENT_W = pick('mainTitle').box.w;

  L.texts.forEach(t => {
    const b = t.box;
    const text = valueOf(t);

    if (/^kw\d$/.test(t.f)) t.align = 'center';   // 원본은 패딩 박스 안 가운데 정렬
    if (t.f === 'week') return;              // term 런에 합쳐서 출력
    if (t.f === 'term') {
      const wk = pick('week');
      slide.addText([
        { text: text, options: {
            fontSize: pt(t.fontSize), color: flatten(t.color, PAPER),
            charSpacing: pt(t.letterSpacing), bold: t.weight >= 600 } },
        { text: '  ' + valueOf(wk), options: {
            fontSize: pt(wk.fontSize), color: flatten(wk.color, PAPER),
            charSpacing: pt(wk.letterSpacing), bold: wk.weight >= 600 } }
      ], {
        x: inX(b.x), y: inX(b.y), w: inX(CONTENT_W), h: inX(b.h),
        fontFace: FONT, align: 'left', valign: 'middle', margin: 0,
        isTextBox: true, wrap: false, lineSpacingMultiple: 1
      });
      return;
    }

    // 좌측 바 위 텍스트는 바 색 위에 합성
    const onRail = ['wm1','wm2','railText','railInitial'].indexOf(t.f) >= 0;
    const backdrop = onRail ? (t.f === 'railInitial' ? RAIL_BG : RAIL_MID) : PAPER;

    const opts = {
      x: inX(b.x), y: inX(b.y), w: inX(b.w), h: inX(b.h),
      fontFace: FONT, fontSize: pt(t.fontSize), bold: t.weight >= 600,
      color: flatten(t.color, backdrop),
      charSpacing: pt(t.letterSpacing),
      align: t.align, valign: 'middle', margin: 0,
      isTextBox: true, wrap: true,
      lineSpacingMultiple: +(t.lineHeight / t.fontSize).toFixed(2)
    };

    if (t.vertical) {                       // 좌측 세로 문구
      opts.vert = 'vert';
      opts.valign = 'top';
      opts.align = 'left';
      opts.lineSpacingMultiple = 1;
    }
    if (NOWRAP.has(t.f)) {                  // 줄바꿈 금지 + 좌우 여유
      opts.wrap = false;
      const grow = b.w * 0.45;
      if (t.align === 'center') { opts.x = inX(b.x - grow/2); opts.w = inX(b.w + grow); }
      else                      { opts.w = inX(b.w + grow); }
    }
    if (GROW[t.f]) {                        // 내용이 길어져도 위아래 요소를 침범하지 않게
      opts.h = inX(Math.max(GROW[t.f] - b.y, b.h));
      opts.valign = 'top';
      opts.fit = 'shrink';
    }
    if (t.f === 'railInitial') {            // 외곽선만 있는 CBE 워터마크
      opts.color = hex(RAIL_BG);
      opts.outline = { size: pt(t.stroke), color: flatten(t.strokeColor, RAIL_BG) };
      opts.valign = 'middle';
    }
    slide.addText(text, opts);
  });

  if (notes) slide.addNotes(notes);
  return slide;
}

buildSlide(BLANK,
  '빈 템플릿 슬라이드입니다. 각 텍스트 상자를 클릭해 내용을 바꾸세요.\n' +
  '좌측 바의 로고는 그림 개체이므로 [그림 서식 > 그림 바꾸기]로 학교 공식 로고로 교체할 수 있습니다.');
buildSlide(SAMPLE,
  '2026-2학기 15주차 강연 정보를 채워 넣은 예시 슬라이드입니다.');

pres.writeFile({ fileName: path.resolve(__dirname, '..', outFile) })
  .then(f => console.log('wrote', f));
