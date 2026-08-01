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
        let navigationAppearance = UINavigationBarAppearance()
        let feltColor = UIColor(red: 20.0 / 255.0, green: 35.0 / 255.0, blue: 29.0 / 255.0, alpha: 1)
        let cueColor = UIColor(red: 223.0 / 255.0, green: 243.0 / 255.0, blue: 107.0 / 255.0, alpha: 1)
        let paperColor = UIColor(red: 1, green: 253.0 / 255.0, blue: 247.0 / 255.0, alpha: 1)

        navigationAppearance.configureWithOpaqueBackground()
        navigationAppearance.backgroundColor = feltColor
        navigationAppearance.shadowColor = paperColor.withAlphaComponent(0.08)
        navigationAppearance.titleTextAttributes = [.foregroundColor: paperColor]
        navigationAppearance.largeTitleTextAttributes = [.foregroundColor: paperColor]

        navigationController.navigationBar.standardAppearance = navigationAppearance
        navigationController.navigationBar.scrollEdgeAppearance = navigationAppearance
        navigationController.navigationBar.compactAppearance = navigationAppearance
        navigationController.navigationBar.compactScrollEdgeAppearance = navigationAppearance
        navigationController.navigationBar.tintColor = cueColor
        navigationController.navigationBar.isTranslucent = false
        window.backgroundColor = feltColor

        window.rootViewController = navigationController
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}
