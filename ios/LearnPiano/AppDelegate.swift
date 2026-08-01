import UIKit

@main
@MainActor
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        let practiceViewController = PracticeViewController(configurationStore: AppConfigurationStore())
        let navigationController = UINavigationController(rootViewController: practiceViewController)

        window.rootViewController = navigationController
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}
