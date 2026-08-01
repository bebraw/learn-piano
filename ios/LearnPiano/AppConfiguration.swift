import Foundation

struct AppOrigin: Equatable {
    let scheme: String
    let host: String
    let port: Int

    init?(url: URL) {
        guard let scheme = url.scheme?.lowercased(), let host = url.host?.lowercased() else {
            return nil
        }

        let defaultPort: Int
        switch scheme {
        case "https":
            defaultPort = 443
        case "http":
            defaultPort = 80
        default:
            return nil
        }

        self.scheme = scheme
        self.host = host
        port = url.port ?? defaultPort
    }

    func contains(_ url: URL) -> Bool {
        AppOrigin(url: url) == self
    }
}

enum AppConfigurationError: LocalizedError, Equatable {
    case invalidURL
    case insecureRemoteURL

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Enter a complete HTTPS address for the Piano Practice web app."
        case .insecureRemoteURL:
            return "Use HTTPS. Plain HTTP is allowed only for a private local-development address."
        }
    }
}

final class AppConfigurationStore {
    static let appURLInfoKey = "LearnPianoAppURL"
    static let appURLDefaultsKey = "learn-piano.app-url"

    private let defaults: UserDefaults
    private let bundle: Bundle

    init(defaults: UserDefaults = .standard, bundle: Bundle = .main) {
        self.defaults = defaults
        self.bundle = bundle
    }

    func currentURL() -> URL? {
        if let saved = defaults.string(forKey: Self.appURLDefaultsKey),
           let url = try? Self.validate(saved)
        {
            return url
        }

        guard let configured = bundle.object(forInfoDictionaryKey: Self.appURLInfoKey) as? String else {
            return nil
        }
        return try? Self.validate(configured)
    }

    @discardableResult
    func save(_ value: String) throws -> URL {
        let url = try Self.validate(value)
        defaults.set(url.absoluteString, forKey: Self.appURLDefaultsKey)
        return url
    }

    static func validate(_ value: String) throws -> URL {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              var components = URLComponents(string: trimmed),
              components.user == nil,
              components.password == nil,
              let scheme = components.scheme?.lowercased(),
              let rawHost = components.host?.lowercased(),
              !rawHost.isEmpty
        else {
            throw AppConfigurationError.invalidURL
        }
        let host = normalizedHost(rawHost)

        guard scheme == "https" || scheme == "http" else {
            throw AppConfigurationError.invalidURL
        }
        guard scheme == "https" || isLocalDevelopmentHost(host) else {
            throw AppConfigurationError.insecureRemoteURL
        }

        components.scheme = scheme
        components.host = rawHost
        components.fragment = nil
        if components.path.isEmpty {
            components.path = "/"
        }

        guard let url = components.url, AppOrigin(url: url) != nil else {
            throw AppConfigurationError.invalidURL
        }
        return url
    }
}

private func isLocalDevelopmentHost(_ host: String) -> Bool {
    if host == "localhost" || host == "::1" || host.hasSuffix(".local") || host.hasPrefix("fe80:") {
        return true
    }

    let components = host.split(separator: ".", omittingEmptySubsequences: false)
    guard components.count == 4 else {
        return false
    }
    var octets: [UInt8] = []
    for component in components {
        guard !component.isEmpty,
              component.allSatisfy({ $0.isASCII && $0.isNumber }),
              (component == "0" || !component.hasPrefix("0")),
              let octet = UInt8(component)
        else {
            return false
        }
        octets.append(octet)
    }

    switch (octets[0], octets[1]) {
    case (10, _), (127, _), (192, 168):
        return true
    case (172, let second) where (16 ... 31).contains(second):
        return true
    default:
        return false
    }
}

private func normalizedHost(_ host: String) -> String {
    guard host.hasPrefix("["), host.hasSuffix("]") else {
        return host
    }
    return String(host.dropFirst().dropLast())
}
