# 화공세미나 포스터 → PPTX 변환 도구

`seminar-poster.html` 의 레이아웃·타이포·장식 그래픽을 그대로 읽어
편집 가능한 A4 세로 PPTX 로 옮기는 스크립트입니다.

| 파일 | 역할 |
|---|---|
| `extract.js` | 브라우저로 포스터를 렌더링해 모든 텍스트의 좌표·폰트·색을 `layout.json` 으로 뽑고, 장식 그래픽(좌측 바·분자 패턴·실험기구·등고선·아이콘·로고)을 투명 PNG 로 추출 |
| `build.js` | 추출 결과로 PPTX 생성. 모든 문구는 편집 가능한 텍스트 상자, 괘선은 도형, 삽화만 그림 |
| `postprocess.py` | 하단 `CBE` 워터마크를 원본처럼 속이 빈 외곽선 글자로 만드는 후처리 |

## 실행

```bash
npm install playwright pptxgenjs
node extract.js burgundy          # 원본 버건디 팔레트
node extract.js orange            # 동국대 오렌지 팔레트
node build.js burgundy ../../seminar-poster-burgundy.pptx
node build.js orange   ../../seminar-poster-orange.pptx
python3 postprocess.py ../../seminar-poster-*.pptx
```

`extract.js` 는 같은 폴더의 `poster_<theme>.html` 을 읽습니다.
`poster_orange.html` 은 `seminar-poster.html` 그대로이고,
`poster_burgundy.html` 은 여기에 버건디 팔레트 CSS 를 덧씌운 사본입니다.
