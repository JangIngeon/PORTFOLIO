import ManagedSettings
import ManagedSettingsUI
import UIKit

/// 선택한 앱을 열 때마다 시스템이 보여주는 실드 화면의 문구/모양을 정한다.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration()
    }

    private func makeConfiguration() -> ShieldConfiguration {
        ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: nil,
            icon: UIImage(systemName: "eye.slash.fill"),
            title: ShieldConfiguration.Label(text: "설마 숏폼을 보려는 건 아니시죠?", color: .label),
            subtitle: ShieldConfiguration.Label(
                text: "정말 필요한 게 아니라면 지금은 돌아가요.",
                color: .secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(text: "아니요, 돌아갈게요", color: .white),
            primaryButtonBackgroundColor: .systemRed,
            secondaryButtonLabel: nil
        )
    }
}
