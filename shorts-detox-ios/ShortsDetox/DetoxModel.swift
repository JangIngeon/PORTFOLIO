import SwiftUI
import FamilyControls
import ManagedSettings

/// 디톡스 ON/OFF 와 선택한 앱을 관리하고, 시스템 실드(ManagedSettingsStore)에 반영한다.
@MainActor
final class DetoxModel: ObservableObject {
    private let store = ManagedSettingsStore()
    private let defaults = UserDefaults.standard
    private let selectionKey = "detox.selection"
    private let enabledKey = "detox.enabled"

    @Published var selection: FamilyActivitySelection {
        didSet { saveSelection(); apply() }
    }
    @Published var isOn: Bool {
        didSet { defaults.set(isOn, forKey: enabledKey); apply() }
    }
    @Published var authorized: Bool
    @Published var errorMessage: String?

    init() {
        if let data = UserDefaults.standard.data(forKey: "detox.selection"),
           let saved = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
            selection = saved
        } else {
            selection = FamilyActivitySelection()
        }
        isOn = UserDefaults.standard.bool(forKey: "detox.enabled")
        authorized = AuthorizationCenter.shared.authorizationStatus == .approved
        apply()
    }

    var selectedCount: Int {
        selection.applicationTokens.count + selection.webDomainTokens.count + selection.categoryTokens.count
    }

    /// 스크린 타임 권한 요청 (Face ID/암호 확인 창이 뜬다)
    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            errorMessage = nil
        } catch {
            errorMessage = "권한 요청에 실패했어요: \(error.localizedDescription)"
        }
        authorized = AuthorizationCenter.shared.authorizationStatus == .approved
        apply()
    }

    /// 선택한 앱/웹사이트를 실드 대상으로 지정하거나 해제한다.
    private func apply() {
        if isOn && authorized {
            store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
            store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
            store.shield.applicationCategories = selection.categoryTokens.isEmpty
                ? nil : .specific(selection.categoryTokens)
        } else {
            store.clearAllSettings()
        }
    }

    private func saveSelection() {
        if let data = try? PropertyListEncoder().encode(selection) {
            defaults.set(data, forKey: selectionKey)
        }
    }
}
