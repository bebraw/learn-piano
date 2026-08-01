import CoreAudioKit
import UIKit
import WebKit

@MainActor
final class PracticeViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let configurationStore: AppConfigurationStore
    private var allowedOrigin: AppOrigin?
    private var bridge: NativeMidiBridge?
    private var webView: WKWebView?
    private var didRequestInitialConfiguration = false

    init(configurationStore: AppConfigurationStore) {
        self.configurationStore = configurationStore
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        nil
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .lightContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(
            red: 235.0 / 255.0,
            green: 233.0 / 255.0,
            blue: 224.0 / 255.0,
            alpha: 1
        )
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: "Server",
            style: .plain,
            target: self,
            action: #selector(showServerPrompt)
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        showConfigurationPlaceholder()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        if webView == nil, let url = configurationStore.currentURL() {
            load(url)
        } else if webView == nil, !didRequestInitialConfiguration {
            didRequestInitialConfiguration = true
            showServerPrompt()
        }
    }

    @objc private func showServerPrompt() {
        guard presentedViewController == nil else {
            return
        }

        let alert = UIAlertController(
            title: "Practice server",
            message: "Enter the HTTPS address where the Piano Practice Worker is deployed. Local HTTP addresses are accepted for development.",
            preferredStyle: .alert
        )
        alert.addTextField { [configurationStore] textField in
            textField.placeholder = "https://piano.example.com"
            textField.keyboardType = .URL
            textField.autocapitalizationType = .none
            textField.autocorrectionType = .no
            textField.text = configurationStore.currentURL()?.absoluteString
        }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(
            UIAlertAction(title: "Open", style: .default) { [weak self, weak alert] _ in
                guard let self else {
                    return
                }
                let value = alert?.textFields?.first?.text ?? ""
                do {
                    let url = try self.configurationStore.save(value)
                    self.load(url)
                } catch {
                    self.showConfigurationError(error.localizedDescription)
                }
            }
        )
        present(alert, animated: true)
    }

    @objc private func applicationDidEnterBackground() {
        bridge?.disconnectForBackground()
    }

    @objc private func applicationDidBecomeActive() {
        bridge?.resumeAfterBackground()
    }

    private func presentBluetoothSettings() -> Bool {
        guard presentedViewController == nil else {
            return false
        }

        let bluetoothController = CABTMIDICentralViewController()
        present(bluetoothController, animated: true)
        return true
    }

    private func load(_ url: URL) {
        guard let origin = AppOrigin(url: url) else {
            showConfigurationError(AppConfigurationError.invalidURL.localizedDescription)
            return
        }

        tearDownWebView()
        allowedOrigin = origin

        let userContentController = WKUserContentController()
        let bridge = NativeMidiBridge(allowedOrigin: origin) { [weak self] in
            self?.presentBluetoothSettings() ?? false
        }
        userContentController.addScriptMessageHandler(
            bridge,
            contentWorld: .page,
            name: NativeMidiBridge.handlerName
        )

        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.userContentController = userContentController
        webConfiguration.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: webConfiguration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        bridge.attach(to: webView)

        view.subviews.forEach { $0.removeFromSuperview() }
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
        ])

        self.bridge = bridge
        self.webView = webView
        webView.load(URLRequest(url: url))
    }

    private func tearDownWebView() {
        guard let webView else {
            return
        }

        webView.stopLoading()
        webView.navigationDelegate = nil
        webView.uiDelegate = nil
        webView.configuration.userContentController.removeScriptMessageHandler(
            forName: NativeMidiBridge.handlerName,
            contentWorld: .page
        )
        bridge?.dispose()
        bridge = nil
        webView.removeFromSuperview()
        self.webView = nil
        allowedOrigin = nil
    }

    private func showConfigurationPlaceholder() {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = "Configure the practice server to begin."
        label.textAlignment = .center
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -24),
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    private func showConfigurationError(_ message: String) {
        let alert = UIAlertController(title: "Could not open server", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Try again", style: .default) { [weak self] _ in
            self?.showServerPrompt()
        })
        present(alert, animated: true)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url, allowedOrigin?.contains(url) == true else {
            decisionHandler(.cancel)
            if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url {
                UIApplication.shared.open(url)
            }
            return
        }
        decisionHandler(.allow)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationResponse: WKNavigationResponse,
        decisionHandler: @escaping @MainActor @Sendable (WKNavigationResponsePolicy) -> Void
    ) {
        guard !navigationResponse.isForMainFrame
            || (navigationResponse.response.url.map { allowedOrigin?.contains($0) == true } ?? false)
        else {
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        guard let url = navigationAction.request.url else {
            return nil
        }
        if allowedOrigin?.contains(url) == true {
            webView.load(URLRequest(url: url))
        } else if navigationAction.navigationType == .linkActivated {
            UIApplication.shared.open(url)
        }
        return nil
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation?, withError error: Error) {
        showLoadError(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation?, withError error: Error) {
        showLoadError(error)
    }

    private func showLoadError(_ error: Error) {
        guard presentedViewController == nil else {
            return
        }
        let alert = UIAlertController(
            title: "Practice server unavailable",
            message: "Check the server address and network connection. \(error.localizedDescription)",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Retry", style: .default) { [weak webView] _ in
            webView?.reload()
        })
        alert.addAction(UIAlertAction(title: "Server", style: .default) { [weak self] _ in
            self?.showServerPrompt()
        })
        present(alert, animated: true)
    }
}
