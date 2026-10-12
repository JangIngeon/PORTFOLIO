import SwiftUI

@main
struct ShortsDetoxApp: App {
    @StateObject private var model = DetoxModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
        }
    }
}
