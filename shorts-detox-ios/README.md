# 숏폼 디톡스 (iPhone)

디톡스를 **ON** 하면, 선택한 앱(유튜브, 인스타그램 등)을 열 때마다
**"설마 숏폼을 보려는 건 아니시죠?"** 화면이 나타납니다. 버튼을 누르면 앱이 닫히고 홈 화면으로 돌아갑니다.

## 동작 방식
iOS는 앱이 다른 앱의 실행을 감지하는 것을 허용하지 않습니다. 대신 Apple의 **Screen Time API**를 사용합니다.

| 구성 | 역할 |
|---|---|
| `ShortsDetox` (앱) | 스크린 타임 권한 요청, 앱 선택(`FamilyActivityPicker`), ON/OFF → `ManagedSettingsStore`에 실드 적용 |
| `ShieldConfiguration` (확장) | 실드 화면의 문구/아이콘/버튼 모양 |
| `ShieldAction` (확장) | 버튼을 눌렀을 때 앱 닫기 |

## 빌드 방법 (Mac + Xcode 필요)
```bash
brew install xcodegen
cd shorts-detox-ios
xcodegen generate        # project.yml → ShortsDetox.xcodeproj
open ShortsDetox.xcodeproj
```
1. 세 타깃(ShortsDetox, ShieldConfiguration, ShieldAction) 모두 **Signing → Team** 을 본인 계정으로 지정
2. 필요하면 Bundle ID(`com.jangingeon.*`)를 본인 것으로 변경
3. **실제 아이폰**에 설치해 실행 (시뮬레이터에서는 Screen Time API가 동작하지 않습니다)
4. 앱에서 "스크린 타임 권한 허용" → "앱 선택" → "디톡스 ON"

## 제한 사항
- 앱 **전체**가 막힙니다. iOS는 다른 앱 *안*의 쇼츠/릴스 탭만 구분해 막을 수 없습니다.
- Family Controls 권한은 개발용으로는 바로 쓸 수 있지만, **App Store/TestFlight 배포에는 Apple의 별도 승인**이 필요합니다.
- 디톡스를 끄려면 앱에서 토글을 OFF 하면 됩니다. (원하면 "5분만 볼게요" 같은 임시 해제 버튼을 추가할 수 있어요.)
- 이 코드는 Linux 환경에서 작성되어 **Xcode에서 빌드/실행해 보지 못했습니다.** 컴파일 오류가 나면 알려주세요.
