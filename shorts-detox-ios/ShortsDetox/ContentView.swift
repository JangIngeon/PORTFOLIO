import SwiftUI
import FamilyControls

struct ContentView: View {
    @EnvironmentObject private var model: DetoxModel
    @State private var showPicker = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("디톡스 ON", isOn: toggleBinding)
                } footer: {
                    Text("켜면 선택한 앱을 열 때마다 \"설마 숏폼을 보려는 건 아니시죠?\" 화면이 나타나요.")
                }

                Section("방해받을 앱") {
                    Button {
                        showPicker = true
                    } label: {
                        HStack {
                            Text("앱 선택하기 (유튜브, 인스타그램 …)")
                            Spacer()
                            Text("\(model.selectedCount)개").foregroundStyle(.secondary)
                        }
                    }
                    .disabled(!model.authorized)
                }

                if !model.authorized {
                    Section {
                        Button("스크린 타임 권한 허용하기") {
                            Task { await model.requestAuthorization() }
                        }
                    } footer: {
                        Text("앱을 선택하려면 스크린 타임(Family Controls) 권한이 필요해요.")
                    }
                }

                if let message = model.errorMessage {
                    Section { Text(message).foregroundStyle(.red) }
                }
            }
            .navigationTitle("숏폼 디톡스")
            .familyActivityPicker(isPresented: $showPicker, selection: $model.selection)
        }
    }

    /// 권한이 없을 때 켜려고 하면 먼저 권한을 요청한다.
    private var toggleBinding: Binding<Bool> {
        Binding(
            get: { model.isOn },
            set: { newValue in
                model.isOn = newValue
                if newValue && !model.authorized {
                    Task { await model.requestAuthorization() }
                }
            }
        )
    }
}
